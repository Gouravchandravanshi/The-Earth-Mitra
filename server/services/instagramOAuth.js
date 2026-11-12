const crypto = require('crypto');

const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const requiredKeys = ['META_APP_ID', 'META_APP_SECRET', 'META_LOGIN_CONFIG_ID', 'INSTAGRAM_REDIRECT_URI', 'INSTAGRAM_TOKEN_ENCRYPTION_KEY'];
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');

function configuration(env = process.env) {
  const missing = requiredKeys.filter(key => !env[key]?.trim());
  if (missing.length) throw fail(`Add ${missing.join(', ')} to server/.env, then restart the backend.`, 503);
  const placeholders = requiredKeys.filter(key => /^your_|placeholder|^<.+>$/i.test(env[key].trim()));
  if (placeholders.length) throw fail(`Replace the example values for ${placeholders.join(', ')} in server/.env with your real Meta app settings, then restart the backend.`, 503);
  if (!/^\d+$/.test(env.META_APP_ID) || !/^\d+$/.test(env.META_LOGIN_CONFIG_ID)) throw fail('Meta App ID and Unified Login Configuration ID must be numeric.', 503);
  let redirect;
  try { redirect = new URL(env.INSTAGRAM_REDIRECT_URI); } catch { throw fail('INSTAGRAM_REDIRECT_URI is not a valid URL.', 503); }
  if (redirect.protocol !== 'https:' || redirect.pathname !== '/api/auth/instagram/callback' || redirect.search || redirect.hash || redirect.username || redirect.password) {
    throw fail('Use an HTTPS INSTAGRAM_REDIRECT_URI ending exactly in /api/auth/instagram/callback, without a trailing slash or query.', 503);
  }
  const version = env.META_GRAPH_VERSION || 'v25.0';
  if (!/^v\d+\.0$/.test(version)) throw fail('META_GRAPH_VERSION must look like v25.0.', 503);
  if (!/^[a-fA-F0-9]{64}$/.test(env.INSTAGRAM_TOKEN_ENCRYPTION_KEY)) throw fail('INSTAGRAM_TOKEN_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hexadecimal characters.', 503);
  return { appId: env.META_APP_ID, secret: env.META_APP_SECRET, configId: env.META_LOGIN_CONFIG_ID, redirectUri: env.INSTAGRAM_REDIRECT_URI, publicOrigin: redirect.origin, version, encryptionKey: env.INSTAGRAM_TOKEN_ENCRYPTION_KEY };
}

function authorizationUrl(config, state) {
  const url = new URL(`https://www.facebook.com/${config.version}/dialog/oauth`);
  url.search = new URLSearchParams({ client_id: config.appId, config_id: config.configId,
    redirect_uri: config.redirectUri, response_type: 'code', override_default_response_type: 'true', state }).toString();
  // Unified Login permissions come from the Meta configuration, not a scope list.
  return url.toString();
}

async function exchangeCode(code, config, fetcher = (...args) => fetch(...args)) {
  const url = new URL(`https://graph.facebook.com/${config.version}/oauth/access_token`);
  url.search = new URLSearchParams({ client_id: config.appId, client_secret: config.secret, redirect_uri: config.redirectUri, code }).toString();
  let response, data;
  try {
    response = await fetcher(url.toString(), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000), redirect: 'error' });
    data = await response.json();
  } catch { throw fail('Could not reach Meta for token exchange. Start Connect Instagram again.', 502); }
  if (!response.ok || data.error || typeof data.access_token !== 'string' || !data.access_token) {
    const providerCode = Number(data.error?.code);
    throw fail(`Meta rejected the authorization code${Number.isFinite(providerCode) ? ` (code ${providerCode})` : ''}. Check the App ID, App Secret and exact redirect URL, then reconnect.`, 502);
  }
  const seconds = Number(data.expires_in);
  return { token: data.access_token, tokenType: typeof data.token_type === 'string' ? data.token_type.slice(0, 40) : 'bearer', expiresAt: Number.isFinite(seconds) && seconds > 0 ? new Date(Date.now() + seconds * 1000) : null };
}

function encryptToken(token, keyHex) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
  cipher.setAAD(Buffer.from('earth-mitra:instagram:v1'));
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') });
}

function decryptToken(encrypted, keyHex) {
  const value = JSON.parse(encrypted);
  if (value.v !== 1) throw new Error('Unsupported token encryption version');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), Buffer.from(value.iv, 'base64'));
  decipher.setAAD(Buffer.from('earth-mitra:instagram:v1'));
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(value.ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

module.exports = { configuration, authorizationUrl, exchangeCode, encryptToken, decryptToken, hash, fail, requiredKeys };
