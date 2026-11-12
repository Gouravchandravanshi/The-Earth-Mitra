require('dotenv').config({ path: require('path').resolve(__dirname, '../.env'), quiet: true });
const { instagram, configuration, safeError, GRAPH_ORIGIN } = require('../services/instagramReels');

async function main() {
  const config = configuration();
  console.log(`Instagram read-only API test (${config.version}, ${GRAPH_ORIGIN})`);
  console.log('Access token: present (hidden)');
  const status = await instagram.getStatus();
  console.log(`Account verified: @${status.account.username} (${status.account.id})`);
  console.log('Token compatibility: confirmed on graph.facebook.com; no alternate authentication attempted.');
  const page = await instagram.getReels({ limit: 6 });
  console.log(`Recent Reels fetched: ${page.reels.length}; more pages: ${page.paging.hasMore ? 'yes' : 'no'}`);
  if (page.unavailableFields.length) console.log(`Unavailable fields: ${page.unavailableFields.join(', ')}`);
  for (const reel of page.reels) console.log(JSON.stringify({ id: reel.id, mediaType: reel.mediaType, mediaProductType: reel.mediaProductType, hasCaption: Boolean(reel.caption), hasVideo: Boolean(reel.videoUrl), hasThumbnail: Boolean(reel.thumbnailUrl), hasPermalink: Boolean(reel.permalink), timestamp: reel.timestamp, likes: reel.likeCount, comments: reel.commentCount }));
  if (page.reels[0]) {
    try {
      const insights = await instagram.getInsights(page.reels[0].id);
      for (const [name, metric] of Object.entries(insights.metrics)) console.log(`${name}: ${metric.available ? metric.value : `unavailable — ${metric.reason}${metric.metaCode != null ? ` [Meta code ${metric.metaCode}]` : ''}${metric.requiredPermissions?.length ? ` Required: ${metric.requiredPermissions.join(', ')}` : ''}`}`);
    } catch (error) { console.log('Insights unavailable: ' + JSON.stringify(safeError(error))); }
  } else console.log('No Reels in the scanned recent media pages; playback and insights require a Reel.');
  console.log('Signed media URLs, captions, access tokens and raw Meta responses were not printed.');
}
main().catch(error => { console.error(JSON.stringify(safeError(error))); process.exitCode = 1; });
