const express = require('express');
const { serviceability, pinPattern } = require('../services/shiprocket');
const { resolveSettings } = require('../services/shippingSettings');
const router = express.Router();
const buckets = new Map(), cache = new Map();
router.get('/check', async (req, res) => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.until < now) buckets.delete(key);
  const bucket = buckets.get(req.ip) || { count: 0, until: now + 60000 };
  buckets.set(req.ip, bucket);
  if (++bucket.count > 20) return res.status(429).json({ message: 'Too many checks. Try again in a minute.' });
  const pincode = String(req.query.pincode || '');
  if (!pinPattern.test(pincode)) return res.status(400).json({ message: 'Enter a valid 6-digit Indian PIN code.' });
  try {
    const settings = await resolveSettings();
    const weightKg = Number(process.env.PUBLIC_DELIVERY_CHECK_WEIGHT_KG || 5);
    const key = `${settings.pickupPincode}:${pincode}:${weightKg}`;
    const cached = cache.get(key);
    if (cached?.until > now) return res.json(cached.data);
    const couriers = await serviceability(settings, pincode, { weightKg, lengthCm: 20, breadthCm: 20, heightCm: 20 });
    const data = { pincode, deliverable: couriers.length > 0, courierCount: couriers.length, checkedFor: { weightKg, paymentMethod: 'Prepaid' }, message: couriers.length ? 'Delivery may be available. Final availability is checked for your cart before payment.' : 'No courier found for this preview parcel. Final availability depends on your cart.' };
    for (const [key, entry] of cache) if (entry.until < now) cache.delete(key);
    if (cache.size < 1000) cache.set(key, { until: now + 120000, data });
    return res.json(data);
  } catch { return res.status(503).json({ message: 'Delivery check is temporarily unavailable. Please retry shortly.' }); }
});
module.exports = router;
