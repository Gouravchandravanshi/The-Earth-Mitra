const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const oauth = require('../services/instagramOAuth');
const { createRouter } = require('../routes/instagramAuth');
const env = {
  META_APP_ID: '123456', META_APP_SECRET: 'test-app-secret', META_LOGIN_CONFIG_ID: '789012', META_GRAPH_VERSION: 'v25.0',
  INSTAGRAM_REDIRECT_URI: 'https://example.test/api/auth/instagram/callback', INSTAGRAM_TOKEN_ENCRYPTION_KEY: 'ab'.repeat(32),
};
const adminId = '507f1f77bcf86cd799439099';
let attempts, connection, exchanges, role, server, base, exchangeError;
const query = value => ({ lean: async () => value });
const Connection = {
  findById: () => query(connection),
  findByIdAndUpdate: async (id, change) => { connection = { ...change.$set }; },
  deleteOne: async () => { connection = null; },
};
const Attempt = {
  create: async value => attempts.set(value._id, value),
  findOneAndDelete: async filter => {
    const value = attempts.get(filter._id);
    if (!value || value.browserHash !== filter.browserHash || value.expiresAt <= filter.expiresAt.$gt) return null;
    attempts.delete(filter._id); return value;
  },
};
const Users = { findById: () => ({ select: async () => ({ _id: adminId, role }) }) };
const service = { ...oauth, exchangeCode: async () => { exchanges++; if (exchangeError) throw exchangeError; return { token: 'private-provider-token', tokenType: 'bearer', expiresAt: new Date(Date.now() + 3600000) }; } };
const auth = [(req, res, next) => {
  if (req.get('x-test-session') !== 'admin') return res.status(req.get('x-test-session') ? 403 : 401).json({ message: 'Not authorized' });
  req.user = { _id: adminId }; next();
}];
const app = express(); app.use(express.json()); app.use(cookieParser());
app.use('/api/auth/instagram', createRouter({ Connection, Attempt, Users, service, auth, env }));
test.before(async () => { server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}/api/auth/instagram`; });
test.beforeEach(() => { attempts = new Map(); connection = null; exchanges = 0; role = 'admin'; exchangeError = null; });
test.after(async () => { await new Promise(resolve => server.close(resolve)); });
async function start(origin = 'https://example.test') {
  const r = await fetch(`${base}/connect`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-test-session': 'admin' }, body: JSON.stringify({ origin }) });
  const data = await r.json();
  return { response: r, data, cookie: r.headers.get('set-cookie')?.split(';')[0], state: data.authorizationUrl ? new URL(data.authorizationUrl).searchParams.get('state') : null };
}
const callback = (started, query = 'code=one-time-code') => fetch(`${base}/callback?${query}&state=${started.state}`, { headers: { Cookie: started.cookie || '' } });

test('direct callback confirms the tunnel without calling Meta or exposing secrets', async () => {
  const r = await fetch(`${base}/callback`); assert.equal(r.status, 400);
  assert.equal(await r.text(), 'No Instagram authorization code received.'); assert.equal(exchanges, 0);
});
test('connect and status require an administrator', async () => {
  assert.equal((await fetch(`${base}/status`)).status, 401);
  assert.equal((await fetch(`${base}/connect`, { method: 'POST', headers: { 'x-test-session': 'customer' } })).status, 403);
});
test('connect builds a config-based login URL with exact redirect and a secure Lax browser cookie', async () => {
  const result = await start(); assert.equal(result.response.status, 200);
  const url = new URL(result.data.authorizationUrl);
  assert.equal(url.origin, 'https://www.facebook.com'); assert.equal(url.searchParams.get('config_id'), env.META_LOGIN_CONFIG_ID);
  assert.equal(url.searchParams.get('redirect_uri'), env.INSTAGRAM_REDIRECT_URI);
  assert.equal(url.searchParams.get('scope'), null); assert.equal(url.searchParams.get('client_secret'), null);
  assert.match(result.response.headers.get('set-cookie'), /HttpOnly/); assert.match(result.response.headers.get('set-cookie'), /Secure/); assert.match(result.response.headers.get('set-cookie'), /SameSite=Lax/);
  assert.notEqual([...attempts.keys()][0], result.state);
});
test('connection must start on the same public domain as its callback', async () => {
  const result = await start('http://localhost:5173'); assert.equal(result.response.status, 409); assert.equal(attempts.size, 0);
});
test('callback exchanges once, encrypts persistently and never returns tokens', async () => {
  const started = await start(); const r = await callback(started); const body = await r.text();
  assert.equal(r.status, 200); assert.match(body, /authorization succeeded/); assert.equal(exchanges, 1);
  assert.ok(!body.includes('private-provider-token')); assert.ok(!connection.encryptedToken.includes('private-provider-token'));
  assert.equal(oauth.decryptToken(connection.encryptedToken, env.INSTAGRAM_TOKEN_ENCRYPTION_KEY), 'private-provider-token');
  assert.equal(connection.connectedBy, adminId);
  assert.equal((await callback(started)).status, 400); assert.equal(exchanges, 1);
});
test('missing state, a different browser and expired attempts are rejected before token exchange', async () => {
  assert.equal((await fetch(`${base}/callback?code=x`)).status, 400);
  const started = await start();
  assert.equal((await callback({ ...started, cookie: `instagram_oauth_browser=${'0'.repeat(64)}` })).status, 400);
  [...attempts.values()][0].expiresAt = new Date(Date.now() - 1000);
  assert.equal((await callback(started)).status, 400); assert.equal(exchanges, 0);
});
test('revoked admin privileges prevent authorization completion', async () => {
  const started = await start(); role = 'user'; assert.equal((await callback(started)).status, 403); assert.equal(exchanges, 0);
});
test('provider denial is handled as text without reflecting untrusted error HTML', async () => {
  const started = await start(); const r = await callback(started, 'error=access_denied&error_description=%3Cscript%3E');
  assert.equal(r.status, 400); assert.ok(!(await r.text()).includes('<script>')); assert.equal(exchanges, 0);
});
test('status never serializes encrypted tokens or the app secret', async () => {
  const started = await start(); await callback(started);
  const r = await fetch(`${base}/status`, { headers: { 'x-test-session': 'admin' } }); const text = await r.text();
  assert.equal(JSON.parse(text).connected, true); assert.ok(!text.includes('encryptedToken')); assert.ok(!text.includes('test-app-secret')); assert.ok(!text.includes('private-provider-token'));
});
test('Meta exchange preserves exact redirect, handles provider errors and does not leak secrets', async () => {
  const config = oauth.configuration(env); let sent;
  const result = await oauth.exchangeCode('unique-code', config, async url => { sent = new URL(url); return { ok: true, json: async () => ({ access_token: 'secret-token', expires_in: 3600 }) }; });
  assert.equal(result.token, 'secret-token'); assert.equal(sent.searchParams.get('redirect_uri'), env.INSTAGRAM_REDIRECT_URI);
  await assert.rejects(oauth.exchangeCode('unique-code', config, async () => ({ ok: false, json: async () => ({ error: { code: 100, message: 'test-app-secret leaked upstream' } }) })), e => e.status === 502 && !e.message.includes('test-app-secret'));
});
test('token encryption is authenticated and configuration rejects an invalid callback or key', () => {
  const encrypted = oauth.encryptToken('test-token', env.INSTAGRAM_TOKEN_ENCRYPTION_KEY);
  assert.throws(() => oauth.decryptToken(encrypted, 'cd'.repeat(32)));
  const tampered = JSON.parse(encrypted); tampered.ciphertext = Buffer.from('tampered').toString('base64');
  assert.throws(() => oauth.decryptToken(JSON.stringify(tampered), env.INSTAGRAM_TOKEN_ENCRYPTION_KEY));
  assert.throws(() => oauth.configuration({ ...env, INSTAGRAM_REDIRECT_URI: env.INSTAGRAM_REDIRECT_URI + '/' }), /exactly/);
  assert.throws(() => oauth.configuration({ ...env, INSTAGRAM_TOKEN_ENCRYPTION_KEY: 'short' }), /32-byte/);
});

test('example credentials are not treated as configured Meta credentials', () => {
  assert.throws(() => oauth.configuration({ ...env, META_APP_ID: 'your_meta_app_id', META_APP_SECRET: 'your_meta_app_secret' }), /Replace the example values/);
});
