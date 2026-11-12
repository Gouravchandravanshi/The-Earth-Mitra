const crypto = require('crypto');

const GRAPH_ORIGIN = 'https://graph.facebook.com';
const TTL = 30 * 60 * 1000;
const MEDIA_FIELDS = ['id', 'caption', 'media_type', 'media_product_type', 'media_url', 'thumbnail_url', 'permalink', 'timestamp', 'like_count', 'comments_count'];
const OPTIONAL_FIELDS = MEDIA_FIELDS.filter(field => !['id', 'media_type', 'media_product_type'].includes(field));
const METRICS = { views: 'views', reach: 'reach', shares: 'shares', saves: 'saved' };
const fail = (message, status = 503, code = 'INSTAGRAM_UNAVAILABLE', details = {}) => Object.assign(new Error(message), { status, code, ...details });

function configuration(env = process.env) {
  const token = env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const accountId = env.INSTAGRAM_ACCOUNT_ID?.trim();
  const version = env.INSTAGRAM_API_VERSION?.trim() || 'v26.0';
  if (!token || /^your_|placeholder|^<.+>$/i.test(token)) throw fail('Add a valid INSTAGRAM_ACCESS_TOKEN to server/.env.', 503, 'INSTAGRAM_NOT_CONFIGURED');
  if (!/^\d{5,30}$/.test(accountId || '')) throw fail('Set INSTAGRAM_ACCOUNT_ID to your professional Instagram account ID.', 503, 'INSTAGRAM_NOT_CONFIGURED');
  if (!/^v\d+\.0$/.test(version)) throw fail('INSTAGRAM_API_VERSION must look like v26.0.', 503, 'INSTAGRAM_NOT_CONFIGURED');
  return { token, accountId, version, fingerprint: crypto.createHash('sha256').update(`${token}:${accountId}:${version}`).digest('hex') };
}

function providerError(error = {}, httpStatus = 502) {
  const metaCode = Number.isFinite(Number(error.code)) ? Number(error.code) : null;
  const metaSubcode = Number.isFinite(Number(error.error_subcode)) ? Number(error.error_subcode) : null;
  let message = 'Meta could not complete this Instagram request.';
  if (metaCode === 190 || httpStatus === 401) message = 'Meta rejected the access token. Check expiry, revocation and compatibility with graph.facebook.com / Unified Login. No alternate login method was attempted.';
  else if ([10, 200, 294].includes(metaCode) || httpStatus === 403) message = 'Meta denied this request. Check the granted Instagram permissions and access to the configured professional account.';
  else if (metaCode === 100) message = 'Meta rejected a field, metric, account ID or parameter for this API version. Check the configured account and supported fields.';
  else if ([4, 17, 32, 613].includes(metaCode) || httpStatus === 429) message = 'Meta rate limit reached. Please retry later.';
  // Never forward Meta's raw message, request URL, paging URLs or response body.
  const rawMessage = String(error.message || '');
  const unsupportedField = metaCode === 100 && /nonexisting field|non-existing field|unknown field|does not exist.*field/i.test(rawMessage)
    ? [...OPTIONAL_FIELDS, 'owner'].find(field => new RegExp(`\\b${field}\\b`).test(rawMessage)) : undefined;
  const requiredPermissions = ['instagram_manage_insights', 'instagram_business_manage_insights', 'instagram_basic', 'pages_read_engagement', 'pages_show_list', 'business_management'].filter(permission => new RegExp(`\\b${permission}\\b`).test(rawMessage));
  return fail(message, 502, 'INSTAGRAM_META_ERROR', { metaCode, metaSubcode, unsupportedField, requiredPermissions });
}

function safeError(error) {
  return { message: error?.code ? error.message : 'Instagram is temporarily unavailable.', code: error?.code || 'INSTAGRAM_UNAVAILABLE',
    ...(error?.metaCode != null ? { metaCode: error.metaCode } : {}), ...(error?.metaSubcode != null ? { metaSubcode: error.metaSubcode } : {}), ...(error?.requiredPermissions?.length ? { requiredPermissions: error.requiredPermissions } : {}) };
}

function safeUrl(value, config, kind = 'media') {
  if (typeof value !== 'string' || value.includes(config.token) || value.includes(encodeURIComponent(config.token))) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const domains = kind === 'permalink' ? ['instagram.com'] : ['cdninstagram.com', 'fbcdn.net', 'instagram.com'];
    if (!domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) return null;
    for (const key of [...url.searchParams.keys()]) {
      if (/access_token|appsecret|authorization/i.test(key)) url.searchParams.delete(key);
      else if (url.searchParams.get(key)?.includes(config.token)) return null;
    }
    url.hash = '';
    return url.toString();
  } catch { return null; }
}

function publicReel(item, config) {
  const count = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  return { id: String(item.id), caption: typeof item.caption === 'string' ? item.caption.split(config.token).join('[redacted]') : '',
    mediaType: item.media_type || null, mediaProductType: item.media_product_type,
    videoUrl: item.media_type === 'VIDEO' ? safeUrl(item.media_url, config) : null,
    thumbnailUrl: safeUrl(item.thumbnail_url, config), permalink: safeUrl(item.permalink, config, 'permalink'),
    timestamp: typeof item.timestamp === 'string' && !Number.isNaN(Date.parse(item.timestamp)) ? new Date(item.timestamp).toISOString() : null,
    likeCount: count(item.like_count), commentCount: count(item.comments_count) };
}

function createInstagramService({ fetcher = (...args) => fetch(...args), env = process.env, now = () => Date.now(), ttl = TTL } = {}) {
  const cache = new Map(), pending = new Map();
  async function cached(key, load) {
    const entry = cache.get(key);
    if (entry && entry.until > now()) return entry.value;
    if (pending.has(key)) return pending.get(key);
    const promise = (async () => {
      const value = await load();
      for (const [key, item] of cache) if (item.until <= now()) cache.delete(key);
      if (cache.size >= 200) cache.delete(cache.keys().next().value);
      cache.set(key, { value, until: now() + ttl }); return value;
    })().finally(() => pending.delete(key));
    pending.set(key, promise); return promise;
  }
  async function graph(config, path, params = {}) {
    const url = new URL(`${GRAPH_ORIGIN}/${config.version}/${path}`);
    for (const [key, value] of Object.entries(params)) if (value != null) url.searchParams.set(key, String(value));
    let response, data;
    try {
      response = await fetcher(url.toString(), { headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15000), redirect: 'error' });
      data = await response.json();
    } catch { throw fail('Instagram could not be reached within the request timeout. Please retry.', 503, 'INSTAGRAM_NETWORK_ERROR'); }
    if (!response.ok || data.error) throw providerError(data.error, response.status);
    return data;
  }
  async function getProfile(config = configuration(env)) {
    return cached(`${config.fingerprint}:profile`, async () => {
      const data = await graph(config, config.accountId, { fields: 'id,username' });
      if (String(data.id) !== config.accountId || typeof data.username !== 'string' || !/^[A-Za-z0-9._]+$/.test(data.username)) {
        throw fail('Meta did not confirm the configured Instagram account identity. Verify the account ID and Unified Login token.', 502, 'INSTAGRAM_ACCOUNT_MISMATCH');
      }
      return { id: String(data.id), username: data.username };
    });
  }
  function encodeCursor(after, limit, config) {
    const payload = Buffer.from(JSON.stringify({ after, limit, expires: now() + 24 * 3600000 })).toString('base64url');
    const signature = crypto.createHmac('sha256', config.token).update(`${config.accountId}:${config.version}:${payload}`).digest('base64url');
    return `${payload}.${signature}`;
  }
  function decodeCursor(cursor, limit, config) {
    if (!cursor) return undefined;
    try {
      if (typeof cursor !== 'string' || cursor.length > 6000) throw new Error();
      const [payload, signature, extra] = cursor.split('.');
      const expected = crypto.createHmac('sha256', config.token).update(`${config.accountId}:${config.version}:${payload}`).digest('base64url');
      if (extra || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error();
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (data.expires <= now() || data.limit !== limit || typeof data.after !== 'string' || !/^[A-Za-z0-9_+=\/-]{1,3000}$/.test(data.after) || data.after.includes(config.token)) throw new Error();
      return data.after;
    } catch { throw fail('This Instagram page cursor is invalid or expired. Reload the first page.', 400, 'INVALID_CURSOR'); }
  }
  async function mediaPage(config, limit, after, fields = MEDIA_FIELDS) {
    let selected = [...fields], unavailable = [];
    for (;;) {
      try {
        const data = await graph(config, `${config.accountId}/media`, { fields: selected.join(','), limit, after });
        if (!Array.isArray(data.data)) throw fail('Meta returned an unexpected media response.', 502, 'INSTAGRAM_RESPONSE_ERROR');
        // Never follow paging.next: it can contain the token and an arbitrary URL.
        const next = data.paging?.next && data.paging?.cursors?.after;
        return { items: data.data, after: typeof next === 'string' && /^[A-Za-z0-9_+=\/-]{1,3000}$/.test(next) && !next.includes(config.token) ? next : null, unavailable };
      } catch (error) {
        if (!error.unsupportedField || !selected.includes(error.unsupportedField) || !OPTIONAL_FIELDS.includes(error.unsupportedField)) throw error;
        selected = selected.filter(field => field !== error.unsupportedField); unavailable.push(error.unsupportedField);
      }
    }
  }
  async function getReels({ limit = 6, after: cursor } = {}) {
    const config = configuration(env); limit = Number(limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 12) throw fail('limit must be an integer from 1 to 12.', 400, 'INVALID_LIMIT');
    const after = decodeCursor(cursor, limit, config);
    return cached(`${config.fingerprint}:reels:${limit}:${after || ''}`, async () => {
      const account = await getProfile(config); const reels = [], unavailable = new Set();
      let next = after; const visited = new Set();
      for (let page = 0; page < 3; page++) {
        const result = await mediaPage(config, limit - reels.length, next);
        result.unavailable.forEach(field => unavailable.add(field));
        for (const item of result.items) if (item.media_product_type === 'REELS' && /^\d{5,30}$/.test(String(item.id)) && !reels.some(reel => reel.id === String(item.id))) reels.push(publicReel(item, config));
        next = result.after;
        if (!next || reels.length >= limit || visited.has(next)) break;
        visited.add(next);
      }
      return { account, reels, paging: { nextCursor: next ? encodeCursor(next, limit, config) : null, hasMore: Boolean(next) }, unavailableFields: [...unavailable], fetchedAt: new Date(now()).toISOString(), cacheSeconds: ttl / 1000 };
    });
  }
  async function verifyOwnership(config, id) {
    return cached(`${config.fingerprint}:owner:${id}`, async () => {
      try {
        const media = await graph(config, id, { fields: 'id,owner,media_product_type' });
        if (String(media.id) !== id || String(media.owner?.id || media.owner) !== config.accountId || media.media_product_type !== 'REELS') throw fail('This Reel does not belong to the configured Instagram account.', 403, 'REEL_NOT_OWNED');
        return true;
      } catch (error) {
        if (error.unsupportedField !== 'owner') throw error;
        // Some app configurations do not expose owner. Verify membership instead.
        let after; const seen = new Set();
        for (let page = 0; page < 10; page++) {
          const result = await mediaPage(config, 100, after, ['id', 'media_product_type']);
          if (result.items.some(item => String(item.id) === id && item.media_product_type === 'REELS')) return true;
          if (!result.after || seen.has(result.after)) break;
          after = result.after; seen.add(after);
        }
        throw fail('Reel ownership could not be verified in this account. No insights were requested.', 403, 'REEL_NOT_OWNED');
      }
    });
  }
  async function getInsights(id) {
    const config = configuration(env);
    if (typeof id !== 'string' || !/^\d{5,30}$/.test(id)) throw fail('Invalid Instagram Reel ID.', 400, 'INVALID_REEL_ID');
    return cached(`${config.fingerprint}:insights:${id}`, async () => {
      await getProfile(config); await verifyOwnership(config, id);
      const metrics = {};
      await Promise.all(Object.entries(METRICS).map(async ([label, metric]) => {
        try {
          const data = await graph(config, `${id}/insights`, { metric });
          const result = data.data?.find(item => item.name === metric);
          const value = result?.total_value?.value ?? result?.values?.[0]?.value;
          metrics[label] = typeof value === 'number' && Number.isFinite(value)
            ? { value, available: true } : { value: null, available: false, reason: 'Meta did not return this metric.' };
        } catch (error) {
          if (error.metaCode === 190) throw error;
          metrics[label] = { value: null, available: false, reason: safeError(error).message, ...safeError(error) };
        }
      }));
      return { id, accountId: config.accountId, metrics, fetchedAt: new Date(now()).toISOString(), cacheSeconds: ttl / 1000 };
    });
  }
  async function getStatus() {
    const config = configuration(env); const account = await getProfile(config);
    return { configured: true, connected: true, account, apiOrigin: GRAPH_ORIGIN, apiVersion: config.version, tokenCompatible: true, cacheSeconds: ttl / 1000 };
  }
  return { getProfile, getReels, getInsights, getStatus };
}

const instagram = createInstagramService();
module.exports = { instagram, createInstagramService, configuration, providerError, safeError, safeUrl, publicReel, GRAPH_ORIGIN, TTL };
