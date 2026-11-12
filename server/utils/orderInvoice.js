const PDFDocument = require('pdfkit');
const { totals } = require('../services/shiprocket');
function renderInvoice(res, order, settings) {
  const amount = value => `INR ${Number(value || 0).toFixed(2)}`;
  const sums = totals(order);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${order._id}.pdf"`);
  res.setHeader('Cache-Control', 'private, no-store');
  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  doc.on('error', () => res.destroy());
  doc.pipe(res);
  doc.fillColor('#1e6e53').fontSize(22).text(settings.businessName || 'Earth Mitra Farmers');
  doc.fillColor('#222222').fontSize(10).text(settings.businessAddress || '');
  if (settings.businessGstin) doc.text(`GSTIN: ${settings.businessGstin}`);
  doc.moveDown().fontSize(16).text('ORDER INVOICE');
  doc.fontSize(10).text(`Invoice: ${order.invoice.number}`).text(`Issued: ${new Date(order.invoice.issuedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  doc.text(`Order: ${order._id}`).text(`Payment: ${order.paymentMethod || 'Prepaid'} / ${order.paymentInfo?.status || 'pending'}`);
  if (order.paymentInfo?.razorpay_payment_id) doc.text(`Payment reference: ${order.paymentInfo.razorpay_payment_id}`);
  for (const [label, address] of [['Bill to', order.billingAddress || order.shippingAddress], ['Deliver to', order.shippingAddress]]) {
    doc.moveDown().font('Helvetica-Bold').text(label).font('Helvetica');
    doc.text([address.firstName, address.lastName].filter(Boolean).join(' ') || order.guestName || order.user?.name || 'Customer');
    doc.text([address.street, address.apartment, address.city, address.state, address.pincode, address.country].filter(Boolean).join(', '));
    doc.text([address.phone, order.guestEmail || order.user?.email].filter(Boolean).join(' | '));
  }
  doc.moveDown().font('Helvetica-Bold').text('Items').font('Helvetica');
  for (const item of order.items) {
    if (doc.y > 690) doc.addPage();
    doc.moveDown(0.4).text(item.name).text(`${item.qty} x ${amount(item.price)} = ${amount(item.qty * item.price)}`, { align: 'right' });
  }
  if (doc.y > 620) doc.addPage();
  doc.moveDown().text(`Subtotal: ${amount(sums.subtotal)}`, { align: 'right' });
  doc.text(`Discount: -${amount(sums.discount)}`, { align: 'right' }).text(`Shipping: ${amount(sums.shipping)}`, { align: 'right' });
  doc.font('Helvetica-Bold').fontSize(13).text(`Total: ${amount(sums.total)}`, { align: 'right' });
  doc.moveDown().font('Helvetica').fontSize(9).fillColor('#666666').text('Order billing summary. A GST tax breakup is not available for this order.');
  doc.end();
}
module.exports = { renderInvoice };
