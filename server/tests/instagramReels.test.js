const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createInstagramService, safeError, TTL } = require('../services/instagramReels');
const { createRouter } = require('../routes/instagramRoutes');

const env = { INSTAGRAM_ACCESS_TOKEN: 'secret-instagram-token', INSTAGRAM_ACCOUNT_ID: '17841435987087568', INSTAGRAM_API_VERSION: 'v26.0' };
const account = { id: env.INSTAGRAM_ACCOUNT_ID, username: 'earth_mitra' };
const reel = { id: '18127541969511169', media_type: 'VIDEO', media_product_type: 'REELS', caption: 'From the farm', media_url: 'https://video.cdninstagram.com/reel.mp4?signature=signed', thumbnail_url: 'https://scontent.cdninstagram.com/poster.jpg', permalink: 'https://www.instagram.com/reel/abc/', timestamp: '2026-10-29T12:06:23+0000', like_count: 0, comments_count: 2 };
const result = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
function setup(handler, extras = {}) {
  const calls = [];
  const service = createInstagramService({ env: { ...env }, ...extras, fetcher: async (value, options) => {
    const url = new URL(value); calls.push({ url, options });
    if (url.pathname === `/v26.0/${account.id}`) return result(account);
    return handler(url, options);
  } });
  return { service, calls };
}
test('account identity verifies token compatibility on the configured Graph origin', async () => {
  const { service, calls } = setup(() => result({}));
  const status = await service.getStatus(); assert.equal(status.tokenCompatible, true); assert.equal(status.account.username, 'earth_mitra');
  assert.equal(calls[0].url.origin, 'https://graph.facebook.com'); assert.equal(calls[0].url.searchParams.has('access_token'), false);
  assert.equal(calls[0].options.headers.Authorization, `Bearer ${env.INSTAGRAM_ACCESS_TOKEN}`);
});
test('public feed filters only Reels and strips tokens, private insights and raw paging URLs', async () => {
  const { service } = setup(() => result({ data: [{ ...reel, caption: env.INSTAGRAM_ACCESS_TOKEN, insights: { views: 999 }, access_token: env.INSTAGRAM_ACCESS_TOKEN }, { id: '123456', media_product_type: 'FEED' }], paging: { next: `https://graph.facebook.com/media?access_token=${env.INSTAGRAM_ACCESS_TOKEN}`, cursors: { after: 'CURSOR1' } } }));
  const page = await service.getReels({ limit: 1 }); const serialized = JSON.stringify(page);
  assert.equal(page.reels.length, 1); assert.equal(page.reels[0].likeCount, 0); assert.ok(!serialized.includes(env.INSTAGRAM_ACCESS_TOKEN));
  assert.ok(!serialized.includes('insights')); assert.ok(!serialized.includes('graph.facebook.com')); assert.equal(page.paging.hasMore, true);
});
test('cache lasts 30 minutes, coalesces concurrent reads and expires', async () => {
  let clock = 1000;
  const { service, calls } = setup(() => result({ data: [reel] }), { now: () => clock });
  await Promise.all([service.getReels(), service.getReels()]); assert.equal(calls.length, 2);
  clock += TTL - 1; await service.getReels(); assert.equal(calls.length, 2);
  clock += 2; await service.getReels(); assert.equal(calls.length, 4);
});
test('pagination signs raw cursors, passes only validated after and rejects tampering', async () => {
  const { service, calls } = setup(url => result({ data: [reel], ...(url.searchParams.get('after') ? {} : { paging: { next: 'https://graph.facebook.com/anything?access_token=secret', cursors: { after: 'NEXT1' } } }) }));
  const first = await service.getReels({ limit: 1 });
  await service.getReels({ limit: 1, after: first.paging.nextCursor });
  assert.equal(calls.at(-1).url.searchParams.get('after'), 'NEXT1');
  await assert.rejects(service.getReels({ limit: 1, after: first.paging.nextCursor + 'x' }), e => e.status === 400);
  await assert.rejects(service.getReels({ limit: 2, after: first.paging.nextCursor }), e => e.status === 400);
});
test('unsupported optional fields are retried without fabricating counts or videos', async () => {
  const { service } = setup(url => url.searchParams.get('fields').includes('like_count')
    ? result({ error: { code: 100, message: '(#100) Tried accessing nonexisting field (like_count)' } }, 400)
    : result({ data: [{ ...reel, like_count: undefined, media_url: undefined }] }));
  const page = await service.getReels(); assert.equal(page.reels[0].likeCount, null); assert.equal(page.reels[0].videoUrl, null);
  assert.deepEqual(page.unavailableFields, ['like_count']);
});
test('unknown required fields and invalid tokens fail explicitly without changing API hosts', async () => {
  const { service, calls } = setup(() => result({ error: { code: 190, error_subcode: 463, message: `Expired token ${env.INSTAGRAM_ACCESS_TOKEN}` } }, 400));
  await assert.rejects(service.getReels(), e => { const safe = safeError(e); assert.equal(safe.metaCode, 190); assert.equal(safe.metaSubcode, 463); assert.ok(!JSON.stringify(safe).includes(env.INSTAGRAM_ACCESS_TOKEN)); return true; });
  assert.ok(calls.every(call => call.url.origin === 'https://graph.facebook.com'));
});
test('private insights verify ownership first and preserve zero versus unavailable metrics', async () => {
  const { service, calls } = setup(url => {
    if (url.pathname.endsWith('/insights')) {
      const metric = url.searchParams.get('metric');
      return metric === 'views' ? result({ data: [{ name: 'views', values: [{ value: 0 }] }] }) : result({ error: { code: 10, message: `Requires instagram_manage_insights ${env.INSTAGRAM_ACCESS_TOKEN}` } }, 403);
    }
    return result({ id: reel.id, owner: { id: account.id }, media_product_type: 'REELS' });
  });
  const insights = await service.getInsights(reel.id);
  assert.deepEqual(insights.metrics.views, { available: true, value: 0 }); assert.equal(insights.metrics.reach.value, null); assert.equal(insights.metrics.reach.metaCode, 10);
  assert.deepEqual(insights.metrics.reach.requiredPermissions, ['instagram_manage_insights']); assert.ok(!JSON.stringify(insights).includes(env.INSTAGRAM_ACCESS_TOKEN));
  assert.ok(calls.findIndex(call => call.url.pathname.endsWith('/insights')) > calls.findIndex(call => call.url.searchParams.get('fields')?.includes('owner')));
});
test('another account Reel is forbidden without any insights request', async () => {
  const { service, calls } = setup(() => result({ id: reel.id, owner: { id: '111111' }, media_product_type: 'REELS' }));
  await assert.rejects(service.getInsights(reel.id), e => e.status === 403);
  assert.equal(calls.filter(call => call.url.pathname.endsWith('/insights')).length, 0);
});
test('ownership falls back to account membership only when owner is unsupported', async () => {
  const { service } = setup(url => {
    if (url.pathname.endsWith('/media')) return result({ data: [reel] });
    if (url.pathname.endsWith('/insights')) return result({ data: [{ name: url.searchParams.get('metric'), total_value: { value: 12 } }] });
    return result({ error: { code: 100, message: 'Tried accessing nonexisting field (owner)' } }, 400);
  });
  assert.equal((await service.getInsights(reel.id)).metrics.views.value, 12);
});
test('expired token during insights is not silently treated as zero or cached', async () => {
  const { service } = setup(url => url.pathname.endsWith('/insights') ? result({ error: { code: 190 } }, 400) : result({ id: reel.id, owner: { id: account.id }, media_product_type: 'REELS' }));
  await assert.rejects(service.getInsights(reel.id), e => e.metaCode === 190);
});
test('external and credential-bearing video URLs are excluded', async () => {
  const { service } = setup(() => result({ data: [{ ...reel, media_url: `https://cdninstagram.com/?access_token=${env.INSTAGRAM_ACCESS_TOKEN}`, thumbnail_url: 'https://attacker.example/x', permalink: 'javascript:alert(1)' }] }));
  const page = await service.getReels(); assert.equal(page.reels[0].videoUrl, null); assert.equal(page.reels[0].thumbnailUrl, null); assert.equal(page.reels[0].permalink, null);
});
test('network errors never expose outbound URLs or credentials', async () => {
  const service = createInstagramService({ env, fetcher: async () => { throw new Error(`https://graph.facebook.com/?access_token=${env.INSTAGRAM_ACCESS_TOKEN}`); } });
  await assert.rejects(service.getReels(), e => e.code === 'INSTAGRAM_NETWORK_ERROR' && !e.message.includes(env.INSTAGRAM_ACCESS_TOKEN));
});

test('HTTP routes keep public Reels separate from authenticated admin diagnostics and insights', async () => {
  const oldSecret = process.env.JWT_SECRET, original = User.findById;
  process.env.JWT_SECRET = 'reels-test-only-secret';
  User.findById = id => ({ select: async () => ({ _id: id, role: id === 'admin' ? 'admin' : 'user' }) });
  const service = { getReels: async () => ({ reels: [] }), getStatus: async () => ({ connected: true }), getInsights: async () => ({ metrics: { views: 1 } }) };
  const app = express(); app.use(cookieParser()); app.use('/api/instagram', createRouter({ service }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/instagram`;
  try {
    assert.equal((await fetch(`${base}/reels`)).status, 200);
    for (const path of ['/status', `/reels/${reel.id}/insights`]) {
      assert.equal((await fetch(base + path)).status, 401);
      const userCookie = `token=${jwt.sign({ id: 'customer' }, process.env.JWT_SECRET)}`;
      assert.equal((await fetch(base + path, { headers: { Cookie: userCookie } })).status, 403);
      const adminCookie = `token=${jwt.sign({ id: 'admin' }, process.env.JWT_SECRET)}`;
      assert.equal((await fetch(base + path, { headers: { Cookie: adminCookie } })).status, 200);
    }
  } finally { User.findById = original; if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret; await new Promise(resolve => server.close(resolve)); }
});
