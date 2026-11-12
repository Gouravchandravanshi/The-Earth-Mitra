const Order = require("../models/Order");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function addressText(address) {
  if (!address) return "";
  return [
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.company,
    address.street,
    address.apartment,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ].filter(Boolean).join("\n");
}

async function sendOrderConfirmationEmail(orderId) {
  let order;
  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      console.error("Order confirmation email skipped: Resend is not configured");
      await Order.updateOne({ _id: orderId, confirmationEmailStatus: { $in: ["pending", "failed"] } }, { $set: { confirmationEmailStatus: "failed" } });
      return { sent: false };
    }

    order = await Order.findById(orderId).populate("user", "email");
    if (!order) return { sent: false };
    const recipient = order.guestEmail || order.user?.email;
    if (!recipient) {
      await Order.updateOne({ _id: orderId }, { $set: { confirmationEmailStatus: "failed" } });
      console.error("Order confirmation email skipped: order has no customer email");
      return { sent: false };
    }

    const claimed = await Order.updateOne(
      { _id: orderId, confirmationEmailStatus: { $in: ["pending", "failed"] } },
      { $set: { confirmationEmailStatus: "sending" } }
    );
    if (!claimed.modifiedCount) return { sent: false };

    const orderNumber = order._id.toString().slice(-8).toUpperCase();
    const rows = order.items.map((item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e8e5df">${escapeHtml(item.name)}</td>
        <td style="padding:10px;border-bottom:1px solid #e8e5df;text-align:center">${Number(item.qty)}</td>
        <td style="padding:10px;border-bottom:1px solid #e8e5df;text-align:right">${money(item.price * item.qty)}</td>
      </tr>`).join("");
    const shippingAddress = addressText(order.shippingAddress);
    const subject = `Your Earth Mitra order #${orderNumber} is confirmed`;
    const html = `
      <div style="font-family:Arial,sans-serif;color:#2c1a0e;max-width:640px;margin:0 auto">
        <div style="background:#3b2314;padding:24px;color:#fff"><h1 style="margin:0;font-size:22px">The Earth Mitra</h1></div>
        <div style="padding:24px">
          <h2 style="margin:0 0 8px">Your order is confirmed</h2>
          <p style="margin:0 0 20px;color:#555">Thank you${order.guestName ? `, ${escapeHtml(order.guestName)}` : ""}. We have received your payment and are preparing your order.</p>
          <p><strong>Order:</strong> #${orderNumber}<br/><strong>Payment status:</strong> Confirmed<br/><strong>Payment reference:</strong> ${escapeHtml(order.paymentInfo?.razorpay_payment_id || "Paid")}</p>
          <table style="width:100%;border-collapse:collapse;margin:22px 0"><thead><tr><th style="padding:10px;text-align:left;border-bottom:2px solid #ddd">Product</th><th style="padding:10px;border-bottom:2px solid #ddd">Qty</th><th style="padding:10px;text-align:right;border-bottom:2px solid #ddd">Amount</th></tr></thead><tbody>${rows}</tbody></table>
          <p style="text-align:right;line-height:1.8"><span>Subtotal: ${money(order.subtotal)}</span><br/><span>Shipping: ${money(order.shippingFee)}</span>${order.discount ? `<br/><span>Discount: −${money(order.discount)}</span>` : ""}<br/><strong style="font-size:18px">Total paid: ${money(order.totalAmount)}</strong></p>
          <h3 style="margin:24px 0 8px">Delivery address</h3>
          <p style="white-space:pre-line;line-height:1.6;color:#555">${escapeHtml(shippingAddress)}</p>
          <p style="margin-top:28px;color:#777;font-size:13px">We’ll email you again when your order status changes.</p>
        </div>
      </div>`;
    const text = `Your Earth Mitra order #${orderNumber} is confirmed. Payment status: Confirmed. Total paid: ${money(order.totalAmount)}.\n\nItems:\n${order.items.map((item) => `${item.name} × ${item.qty} — ${money(item.price * item.qty)}`).join("\n")}\n\nDelivery address:\n${shippingAddress}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `order-confirmation-${order._id.toString()}`,
      },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [recipient], subject, html, text }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      await Order.updateOne({ _id: orderId, confirmationEmailStatus: "sending" }, { $set: { confirmationEmailStatus: "failed" } });
      console.error("Resend order confirmation failed with status", response.status, result.message || "");
      return { sent: false };
    }

    await Order.updateOne(
      { _id: orderId, confirmationEmailStatus: "sending" },
      { $set: { confirmationEmailStatus: "sent", confirmationEmailSentAt: new Date() } }
    );
    return { sent: true };
  } catch (error) {
    if (order) {
      await Order.updateOne({ _id: orderId, confirmationEmailStatus: "sending" }, { $set: { confirmationEmailStatus: "failed" } }).catch(() => {});
    }
    console.error("Could not send order confirmation email:", error.message);
    return { sent: false };
  }
}

module.exports = { sendOrderConfirmationEmail };
