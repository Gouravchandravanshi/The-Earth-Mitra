// Read-only setup checks. Does not perform Instagram user consent or store tokens.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { configuration } = require('../services/instagramOAuth');
const User = require('../models/User');

async function main() {
  const config = configuration();
  console.log(JSON.stringify({ check: 'configuration', ready: true, redirectUri: config.redirectUri }));
  const url = new URL(`https://graph.facebook.com/${config.version}/oauth/access_token`);
  url.search = new URLSearchParams({ client_id: config.appId, client_secret: config.secret, grant_type: 'client_credentials' }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error' });
  const result = await response.json();
  const valid = response.ok && Boolean(result.access_token) && !result.error;
  console.log(JSON.stringify({ check: 'meta_app_credentials', status: response.status, valid, ...(result.error ? { providerCode: Number(result.error.code) || undefined } : {}) }));
  if (!valid) { process.exitCode = 1; return; }
  // The returned application token is deliberately never logged or persisted.
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, autoIndex: false });
  const admin = await User.findOne({ role: 'admin' }).select('_id');
  if (!admin) { console.log(JSON.stringify({ check: 'admin_status', skipped: true, reason: 'No admin user found' })); return; }
  const token = jwt.sign({ id: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: '1m' });
  const statusResponse = await fetch(`http://127.0.0.1:${process.env.PORT || 5000}/api/auth/instagram/status`, { headers: { Cookie: `token=${token}` }, signal: AbortSignal.timeout(10000) });
  const status = await statusResponse.json();
  console.log(JSON.stringify({ check: 'running_backend_instagram_status', status: statusResponse.status, configured: status.configured, connected: status.connected, missing: status.missing, redirectMatches: status.redirectUri === config.redirectUri }));
  if (!statusResponse.ok || !status.configured || status.redirectUri !== config.redirectUri) process.exitCode = 1;
}

main().catch(() => { console.error('Instagram setup check could not finish. No credentials or tokens were logged.'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
