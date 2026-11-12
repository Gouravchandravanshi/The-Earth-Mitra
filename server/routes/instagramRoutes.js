const express = require('express');
const { protect, adminOnly } = require('../middlewares/auth');
const { instagram, configuration, safeError } = require('../services/instagramReels');

function createRouter({ service = instagram, auth = [protect, adminOnly] } = {}) {
  const router = express.Router(); const buckets = new Map();
  const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (error) { next(error); } };
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/reels', (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of buckets) if (value.until <= now) buckets.delete(key);
    if (buckets.size >= 5000 && !buckets.has(req.ip)) return res.status(429).json({ message: 'Please retry shortly.' });
    const bucket = buckets.get(req.ip) || { count: 0, until: now + 60000 }; buckets.set(req.ip, bucket);
    if (++bucket.count > 60) return res.set('Retry-After', '60').status(429).json({ message: 'Too many Instagram requests. Retry in a minute.' });
    next();
  }, wrap(async (req, res) => res.json(await service.getReels({ limit: req.query.limit ?? 6, after: req.query.after }))));
  router.get('/status', ...auth, async (req, res) => {
    try { return res.json(await service.getStatus()); }
    catch (error) {
      let configured = true; try { configuration(); } catch { configured = false; }
      return res.status(error.status || 503).json({ configured, connected: false, ...safeError(error) });
    }
  });
  router.get('/reels/:id/insights', ...auth, wrap(async (req, res) => res.json(await service.getInsights(req.params.id))));
  router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    // Public feed errors do not reveal configuration or account diagnostics.
    if (req.path === '/reels') return res.status(error.status || 503).json({ message: error.status === 400 ? error.message : 'Instagram Reels are temporarily unavailable. Please try again later.', code: error.code || 'INSTAGRAM_UNAVAILABLE' });
    res.status(error.status || 503).json(safeError(error));
  });
  return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;
