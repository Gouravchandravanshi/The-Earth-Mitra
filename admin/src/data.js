const S = ['Active', 'Draft'], num = 'number'
const f = (l, t, o, span, n, required = false) => ({ l, t, o, span, n, required })
export const dash = {
  stats: [['Revenue', '₹4,82,300', '+12.4% vs last month'], ['Orders', '1,284', '+8.1%'], ['Customers', '3,902', '+5.6%'], ['Low stock items', '14', 'Needs attention']],
  bars: [40, 55, 35, 70, 60, 85, 75],
  recent: [['#1042', '₹1,240', 'Pending'], ['#1041', '₹860', 'Shipped'], ['#1040', '₹2,150', 'Delivered']],
}
export const lists = {
  products: { api: { path: '/products/admin?page=1&limit=100', key: 'products', map: p => [p.name, p.category?.name || '-', '₹' + p.price, p.stock, p.stock === 0 ? 'Out of stock' : 'Active'] }, title: 'Products', sub: 'Manage your catalogue', cta: { label: 'Add product', to: '/products/new' }, cols: ['Product', 'Category', 'Price', 'Stock', 'Status'],
    rows: [['Neem Comb', 'Personal care', '₹249', '120', 'Active'], ['Bamboo Toothbrush Set', 'Personal care', '₹199', '8', 'Active'], ['Jute Tote Bag', 'Home', '₹349', '0', 'Draft']] },
  collections: { title: 'Collections', sub: 'Group products for your storefront', cta: { label: 'Create collection', to: '/collections/new' }, cols: ['Collection', 'Type', 'Products', 'Status'],
    rows: [['Plastic-free Home', 'Manual', '12', 'Active'], ['Under ₹300', 'Automated', '34', 'Active'], ['Festive Gifts', 'Manual', '9', 'Draft']] },
  categories: { api: { path: '/categories', create: '/categories', key: 'categories', map: c => [c.name, c.slug, c.productCount ?? '—', 'Active'] }, title: 'Categories', cta: { label: 'Add category' }, panel: { title: 'New category', cta: 'Create category', fields: [f('Name', 'text', null, true, 'name')] }, cols: ['Category', 'Slug', 'Products', 'Status'],
    rows: [['Personal care', 'personal-care', '48', 'Active'], ['Home', 'home', '36', 'Active'], ['Kitchen', 'kitchen', '21', 'Draft']] },
  inventory: { api: { path: '/products/admin?page=1&limit=100', key: 'products', type: 'inventory', map: p => [p.name, p.sku || '—', p.stock, p.stock <= 0 ? 'Out of stock' : p.stock <= 10 ? 'Low stock' : 'In stock'] }, title: 'Inventory', sub: 'Click a row to adjust stock', cols: ['Product', 'SKU', 'On hand', 'Status'], panel: { title: 'Adjust stock', cta: 'Update stock', fields: [f('Change (+/-)', num, null, false, 'change'), f('Reason', 'select', ['Restock', 'Damaged', 'Correction'], false, 'reason'), f('Note', 'area', null, true, 'note')] },
    rows: [['Neem Comb', 'EM-001', '120', 'In stock'], ['Bamboo Toothbrush Set', 'EM-014', '8', 'Low stock'], ['Jute Tote Bag', 'EM-032', '0', 'Out of stock']] },
  orders: { api: { path: '/orders/all', key: 'orders', map: o => ['#' + (o.orderNumber || o._id.slice(-8).toUpperCase()), o.user?.name || o.user?.email || o.guestName || o.guestEmail || 'Guest customer', new Date(o.createdAt).toLocaleDateString(), '₹' + o.totalAmount, o.paymentInfo?.status || 'pending', o.status === 'processing' ? 'Pending' : o.status === 'cancelled' ? 'Cancelled' : o.status] }, title: 'Orders', tabs: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], cols: ['Order', 'Customer', 'Date', 'Total', 'Payment', 'Status'], rowTo: (r, order) => order?._id ? `/orders/${order._id}` : null,
    rows: [['#1042', 'Aarav Sharma', '28 Sep', '₹1,240', 'Paid', 'Pending'], ['#1041', 'Neha Verma', '27 Sep', '₹860', 'Paid', 'Shipped'], ['#1040', 'Rohan Jain', '26 Sep', '₹2,150', 'Paid', 'Delivered'], ['#1039', 'Isha Patel', '25 Sep', '₹499', 'Failed', 'Cancelled']] },
  returns: { title: 'Returns & Refunds', cols: ['Request', 'Order', 'Reason', 'Amount', 'Status'], panel: { side: true, title: 'Return request', cta: 'Approve refund', fields: [f('Resolution', 'select', ['Refund', 'Replace', 'Reject'], true), f('Refund amount', num), f('Note', 'area', null, true)] },
    rows: [['RR-21', '#1038', 'Damaged item', '₹349', 'Open'], ['RR-20', '#1031', 'Wrong size', '₹899', 'Approved'], ['RR-19', '#1027', 'Not needed', '₹199', 'Rejected']] },
  payments: { api: { path: '/orders/all', key: 'orders', map: o => [o.paymentInfo?.razorpay_payment_id || '—', '#' + o._id.slice(-6), 'Razorpay', '₹' + o.totalAmount, o.paymentInfo?.status || 'pending'] }, title: 'Payments', cols: ['Transaction', 'Order', 'Method', 'Amount', 'Status'], panel: { side: true, title: 'Transaction', cta: 'Close', fields: [f('Razorpay payment ID'), f('Method'), f('Amount')] },
    rows: [['pay_Qx81', '#1042', 'UPI', '₹1,240', 'Paid'], ['pay_Qx80', '#1041', 'Card', '₹860', 'Paid'], ['pay_Qx7z', '#1039', 'Netbanking', '₹499', 'Failed']] },
  customers: { api: { path: '/users/admin?page=1&limit=100', key: 'users', map: u => [u.name, u.email, '—', '—'] }, title: 'Customers', cols: ['Name', 'Email', 'Orders', 'Spent'],
    rows: [['Aarav Sharma', 'aarav@mail.com', '6', '₹7,420'], ['Neha Verma', 'neha@mail.com', '3', '₹2,310'], ['Rohan Jain', 'rohan@mail.com', '9', '₹11,050']] },
  coupons: { api: { path: '/coupons', key: 'coupons', map: c => [c.code, c.discountType === 'percent' ? 'Percent' : 'Flat', c.discountValue, c.usedCount ?? 0, c.isActive === false ? 'Draft' : 'Active'] }, title: 'Coupons', cta: { label: 'Create coupon', to: '/coupons/new' }, cols: ['Code', 'Type', 'Value', 'Used', 'Status'],
    rows: [['GREEN10', 'Percent', '10%', '142', 'Active'], ['WELCOME100', 'Flat', '₹100', '88', 'Active'], ['DIWALI20', 'Percent', '20%', '0', 'Scheduled']] },
  reviews: { api: { path: '/reviews?page=1&limit=100', key: 'reviews', type: 'reviews', map: r => [r.product?.name || '—', r.user?.name || '—', r.rating + '/5', r.comment, r.isApproved === false ? 'Hidden' : 'Published'] }, title: 'Reviews moderation', cols: ['Product', 'Customer', 'Rating', 'Review', 'Status'], panel: { title: 'Moderate review', cta: 'Save status', fields: [f('Status', 'select', ['Published', 'Hidden'], true, 'status')] },
    rows: [['Neem Comb', 'Neha V.', '5/5', 'Lovely quality', 'Published'], ['Jute Tote Bag', 'Rohan J.', '2/5', 'Handle tore', 'Pending'], ['Bamboo Toothbrush Set', 'Isha P.', '4/5', 'Good value', 'Published']] },
  banners: { title: 'Banners & Homepage', cta: { label: 'Add banner' }, panel: { title: 'Banner', cta: 'Save', fields: [f('Title', 'text', null, true), f('Image', 'file', null, true), f('Link', 'text', null, true), f('Placement', 'select', ['Hero', 'Top strip', 'Mid page'])] },
    cols: ['Banner', 'Placement', 'Schedule', 'Status'], rows: [['Festive Sale', 'Hero', '1–15 Oct', 'Scheduled'], ['Free shipping ₹499+', 'Top strip', 'Always', 'Active']] },
  analytics: { charts: true, title: 'Analytics', sub: 'Month on month', cols: ['Metric', 'This month', 'Last month', 'Change'],
    rows: [['Revenue', '₹4,82,300', '₹4,29,000', '+12.4%'], ['Orders', '1,284', '1,188', '+8.1%'], ['Conversion', '3.2%', '2.9%', '+0.3%'], ['Avg order value', '₹376', '₹361', '+4.2%']] },
}
export const forms = {
  'products/new': { api: { url: '/products', kind: 'product' }, title: 'Add product', save: 'Create product', sections: [
    { t: 'Basic info', f: [f('Name', 'text', null, true, 'name', true), f('Description', 'area', null, true, 'description', true), f('Category', 'select', [], false, 'category', true), f('SKU', 'text', null, false, 'sku'), f('MRP (₹)', num, null, false, 'mrp', true), f('Overall price (₹)', num, null, false, 'price', true), f('Discounted price (₹)', num, null, false, 'discountPrice'), f('Stock', num, null, false, 'stock')] },
    { t: 'Product details', f: [f('Pack contains (comma separated)', 'text', null, false, 'packContains'), f('Ideal for making (comma separated)', 'text', null, false, 'suitableUses')] },
    { t: 'Eco details', f: [f('Origin', 'text', null, false, 'origin'), f('Certifications (comma separated)', 'text', null, false, 'certifications'), f('Eco certified', 'check', null, false, 'eco_certified')] },
    { t: 'Allergen information', f: [f('Status', 'select', [{ value: 'unknown', label: 'Not specified' }, { value: 'contains', label: 'Contains allergens' }, { value: 'none_confirmed', label: 'No known allergens' }], false, 'allergenStatus'), f('Allergens (comma separated)', 'text', null, false, 'allergens'), f('Warnings (comma separated)', 'text', null, true, 'allergenWarnings')] },
    { t: 'Storage conditions', f: [f('Instructions', 'area', null, true, 'storageInstructions'), f('Minimum temperature (°C)', num, null, false, 'minTemperatureC'), f('Maximum temperature (°C)', num, null, false, 'maxTemperatureC')] },
    { t: 'Frequently asked questions', f: [f('One question and answer per line, separated with |', 'area', null, true, 'faqs')] },
    { t: 'Images', f: [f('Upload images', 'file', null, true, 'images')] }] },
  'coupons/new': { api: { url: '/coupons', json: true, kind: 'coupon' }, title: 'Create coupon', sections: [{ t: 'Coupon', f: [f('Code', 'text', null, false, 'code'), f('Type', 'select', ['percent', 'flat'], false, 'discountType'), f('Value', num, null, false, 'discountValue'), f('Min order (₹)', num, null, false, 'minOrderAmount'), f('Usage limit', num, null, false, 'usageLimit'), f('Expiry', 'datetime-local', null, false, 'expiresAt'), f('Active', 'check', null, false, 'isActive')] }] },
}
const refund = { l: 'Refund', v: 'ghost', text: 'Refund this order to the original payment method.', fields: [f('Amount (₹)', num), f('Reason', 'text')] }
export const details = {
  order: { title: 'Order #1042', sub: '28 Sep · Aarav Sharma', actions: [refund, { l: 'Cancel order', v: 'danger', text: 'Cancel this order? This cannot be undone.', fields: [] }],
    table: { t: 'Items', cols: ['Item', 'Qty', 'Price'], rows: [['Neem Comb', '2', '₹498'], ['Jute Tote Bag', '1', '₹349']] },
    meta: [['Status', 'Pending'], ['Payment', 'Paid · UPI'], ['Total', '₹1,240'], ['Ship to', 'Indore, MP']] },
  customer: { title: 'Aarav Sharma', sub: 'Customer since Jan 2026', actions: [{ l: 'Send email', v: 'ghost', text: 'Send a message to this customer.', fields: [f('Subject', 'text', null, true), f('Message', 'area', null, true)] }],
    table: { t: 'Orders', cols: ['Order', 'Date', 'Total', 'Status'], rows: [['#1042', '28 Sep', '₹1,240', 'Pending'], ['#1030', '12 Sep', '₹860', 'Delivered']] },
    meta: [['Email', 'aarav@mail.com'], ['Orders', '6'], ['Spent', '₹7,420'], ['City', 'Indore']] },
}
export const settings = {
  general: { tab: 'General', title: 'General settings', sections: [{ t: 'Store', f: [f('Store name'), f('Support email', 'email'), f('Phone'), f('Address', 'area', null, true)] }] },
  shipping: { tab: 'Shipping & Tax', title: 'Shipping & Tax', sections: [{ t: 'Shipping', f: [f('Flat rate (₹)', num), f('Free shipping above (₹)', num)] }, { t: 'Tax', f: [f('GST %', num), f('GSTIN')] }] },
  payments: { tab: 'Payments', title: 'Payments', sections: [{ t: 'Razorpay', f: [f('Key ID'), f('Key secret', 'password'), f('Cash on delivery', 'check')] }] },
  notifications: { tab: 'Notifications', title: 'Notifications', sections: [{ t: 'Email me when', f: [f('New order', 'check'), f('Low stock', 'check'), f('New review', 'check'), f('Refund requested', 'check')] }] },
  team: { tab: 'Team & Roles', title: 'Team & Roles', cta: { label: 'Invite member' }, panel: { title: 'Invite member', cta: 'Send invite', fields: [f('Email', 'email', null, true), f('Role', 'select', ['Admin', 'Manager', 'Support'], true)] },
    cols: ['Name', 'Email', 'Role', 'Status'], rows: [['Gourav', 'gourav@earthmitra.in', 'Admin', 'Active'], ['Meera', 'meera@earthmitra.in', 'Manager', 'Active'], ['Dev', 'dev@earthmitra.in', 'Support', 'Pending']] },
  permissions: { tab: 'Permissions', title: 'Permission matrix', cols: ['Permission', 'Admin', 'Manager', 'Support'],
    rows: [['Manage products', '✓', '✓', '—'], ['Manage orders', '✓', '✓', '✓'], ['Issue refunds', '✓', '✓', '—'], ['Edit settings', '✓', '—', '—']] },
  activity: { tab: 'Activity Log', title: 'Activity log', cols: ['When', 'User', 'Action'],
    rows: [['Today 10:12', 'Gourav', 'Updated product Neem Comb'], ['Today 09:40', 'Meera', 'Approved refund RR-20'], ['Yesterday', 'Gourav', 'Created coupon GREEN10']] },
}
