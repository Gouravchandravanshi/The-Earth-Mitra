const express = require('express');
const crypto = require('crypto');
const InstagramConnection = require('../models/InstagramConnection');
const InstagramOAuthAttempt = require('../models/InstagramOAuthAttempt');
const User = require('../models/User');
const { protect, adminOnly } = require('../middlewares/auth');
const oauth = require('../services/instagramOAuth');

const COOKIE = 'instagram_oauth_browser';
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/auth/instagram', maxAge: 10 * 60 * 1000 };
const wrap = handler => async (req, res, next) => { try { await handler(req, res); } catch (error) { next(error); } };

function createRouter({ Connection = InstagramConnection, Attempt = InstagramOAuthAttempt, Users = User, service = oauth, auth = [protect, adminOnly], env = process.env } = {}) {
  const router = express.Router();
  router.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' });
    next();
  });

  router.get('/status', ...auth, wrap(async (req, res) => {
    const connection = await Connection.findById('instagram').lean();
    let config, configurationError;
    try { config = service.configuration(env); } catch (error) { configurationError = error.message; }
    const matchesConfig = connection && config && connection.appId === config.appId && connection.configId === config.configId;
    const expired = Boolean(connection?.expiresAt && new Date(connection.expiresAt) <= new Date());
    res.json({ configured: Boolean(config), configurationError, redirectUri: env.INSTAGRAM_REDIRECT_URI || '',
      missing: oauth.requiredKeys.filter(key => !env[key]?.trim()),
      connected: Boolean(matchesConfig && !expired), expired,
      connection: connection ? { connectedAt: connection.connectedAt, expiresAt: connection.expiresAt, appId: connection.appId } : null });
  }));

  router.post('/connect', ...auth, wrap(async (req, res) => {
    const config = service.configuration(env);
    // A host-scoped OAuth cookie must be issued on the callback's hostname.
    if (req.body?.origin !== config.publicOrigin) throw oauth.fail(`Open the admin on ${config.publicOrigin}/admin/settings/instagram before connecting.`, 409);
    const state = crypto.randomBytes(32).toString('hex'), browser = crypto.randomBytes(32).toString('hex');
    await Attempt.create({ _id: oauth.hash(state), browserHash: oauth.hash(browser), adminId: req.user._id,
      redirectUri: config.redirectUri, appId: config.appId, configId: config.configId, expiresAt: new Date(Date.now() + cookieOptions.maxAge) });
    res.cookie(COOKIE, browser, cookieOptions);
    res.json({ authorizationUrl: service.authorizationUrl(config, state) });
  }));

  router.get('/callback', wrap(async (req, res) => {
    // A direct visit is a useful public tunnel check; it never exposes a token.
    if (!req.query.code && !req.query.error) return res.status(400).type('text/plain').send('No Instagram authorization code received.');
    const { state, code, error } = req.query;
    const browser = req.cookies?.[COOKIE];
    if (typeof state !== 'string' || !/^[a-f0-9]{64}$/.test(state) || typeof browser !== 'string' || !/^[a-f0-9]{64}$/.test(browser)) {
      return res.status(400).type('text/plain').send('Instagram authorization state is missing or invalid. Start from Admin > Instagram > Connect Instagram on this public domain.');
    }
    if (!error && (typeof code !== 'string' || !code || code.length > 4096)) throw oauth.fail('Invalid Instagram authorization code.');
    const attempt = await Attempt.findOneAndDelete({ _id: oauth.hash(state), browserHash: oauth.hash(browser), expiresAt: { $gt: new Date() } });
    if (!attempt) throw oauth.fail('This Instagram authorization has expired or was already used. Start Connect Instagram again.');
    res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
    const admin = await Users.findById(attempt.adminId).select('_id role');
    if (!admin || admin.role !== 'admin') throw oauth.fail('The initiating admin is no longer authorized.', 403);
    if (error) return res.status(400).type('text/plain').send('Instagram authorization was not granted. Return to the admin and try again.');
    const config = service.configuration(env);
    if (config.appId !== attempt.appId || config.configId !== attempt.configId || config.redirectUri !== attempt.redirectUri) throw oauth.fail('Instagram settings changed during authorization. Start Connect Instagram again.', 409);
    const credentials = await service.exchangeCode(code, config);
    await Connection.findByIdAndUpdate('instagram', { $set: {
      appId: config.appId, configId: config.configId, encryptedToken: service.encryptToken(credentials.token, config.encryptionKey),
      tokenType: credentials.tokenType, expiresAt: credentials.expiresAt, connectedAt: new Date(), connectedBy: admin._id,
    } }, { upsert: true, runValidators: true });
    // Do not depend on the normal Strict session cookie on a cross-site OAuth redirect.
    // The one-time, browser-bound attempt identifies the already-authorized admin.
    return res.type('text/plain').send('Instagram authorization succeeded. Your backend received and securely stored an access token. Return to Admin > Instagram and refresh the connection status.');
  }));

  router.delete('/connection', ...auth, wrap(async (req, res) => {
    await Connection.deleteOne({ _id: 'instagram' });
    res.json({ message: 'The locally stored Instagram connection was removed. Remove the app in Meta settings as well if you want to revoke its access.' });
  }));

  router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const message = error.status ? error.message : 'Unable to complete Instagram authorization. Please retry from the admin.';
    if (req.path === '/callback') return res.status(error.status || 500).type('text/plain').send(message);
    return res.status(error.status || 500).json({ message });
  });
  return router;
}

module.exports = createRouter();
module.exports.createRouter = createRouter;
