const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const { syncTracking, recordEvent, parseDate } = require('../services/shipmentTracking');
const router = express.Router();
router.post('/courier-events', async (req, res) => {
  const expected = process.env.SHIPROCKET_WEBHOOK_KEY, actual = req.get('x-api-key') || '';
  if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return res.sendStatus(401);
  const event = req.body;
  if (!event || typeof event.awb !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(event.awb)) return res.status(400).json({ message: 'Invalid AWB.' });
  try {
    const order = await Order.findOne({ 'shipping.awb': event.awb });
    if (!order) return res.sendStatus(200);
    const eventKey = crypto.createHash('sha256').update(JSON.stringify([event.awb, event.current_status, event.current_timestamp, event.scans])).digest('hex');
    await recordEvent(order._id, { eventKey, status: String(event.current_status || event.shipment_status || 'Update received').slice(0, 200), at: parseDate(event.current_timestamp) || new Date(), location: String(event.location || '').slice(0, 200) });
    // Webhooks are notifications; query current provider state to handle late events.
    await syncTracking(order);
    return res.sendStatus(200);
  } catch { return res.status(503).json({ message: 'Tracking reconciliation is unavailable; retry this event.' }); }
});
module.exports = router;
