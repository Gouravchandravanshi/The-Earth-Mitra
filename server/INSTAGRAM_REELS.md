# Earth Mitra Instagram Reels

This integration reads the store's own professional account. Website customers do not log into Instagram. It uses `INSTAGRAM_ACCESS_TOKEN` from the server environment, independently of the optional saved OAuth connection described in [INSTAGRAM_SETUP.md](INSTAGRAM_SETUP.md).

## Configuration and commands

Set these values in `server/.env` (never in a `VITE_*` variable):

```dotenv
INSTAGRAM_ACCESS_TOKEN=<your real token, stored only here>
INSTAGRAM_ACCOUNT_ID=17841435987087568
INSTAGRAM_API_VERSION=v26.0
```

Restart Express after changing environment variables. No new runtime dependency is required; the service uses Node's existing native fetch.

Run these commands from separate terminals:

```powershell
cd server
npm.cmd start
```

```powershell
cd client
npm.cmd run dev
```

```powershell
cd admin
npm.cmd run dev
```

Open the storefront at `http://localhost:5173/` and analytics at `http://localhost:5173/admin/instagram` (admin sign-in required). The client Vite proxy forwards `/api` to port 5000 and `/admin` to 5174. A single `ngrok http 5173` tunnel can expose all three; update Vite's allowed hostname if the tunnel domain changes. Port 5000 alone exposes the API and has no homepage.

Verification commands:

```powershell
cd server
npm.cmd run test:instagram
npm.cmd test
# In client and admin respectively:
npm.cmd run build
```

The live script reads account identity, media and one owned Reel's insights. It does not publish or modify Instagram content. It prints presence flags instead of signed media URLs, and never prints the token or raw Meta errors. Successful identity/media with unavailable insights is explicitly reported as partial capability, even though the script exits successfully.

## Endpoints

| Endpoint | Access | Result |
| --- | --- | --- |
| `GET /api/instagram/reels?limit=6&after=...` | Public | Account identity, whitelisted Reels, pagination, unavailable fields and cache timestamp |
| `GET /api/instagram/status` | Existing admin session | Safe connection diagnostics, configured account and API version |
| `GET /api/instagram/reels/:id/insights` | Existing admin session | Views, reach, shares and saves, after checking Reel ownership |

Reel fields: `id`, `caption`, `mediaType`, `mediaProductType`, `videoUrl`, `thumbnailUrl`, `permalink`, `timestamp`, `likeCount`, `commentCount`. Missing counts/URLs are `null`. The public endpoint never returns private insights.

Each insight has `available` and `value`; an unavailable metric has `value: null`, a sanitized reason and Meta codes when present. A returned numeric zero remains a real zero. Saves use Meta's `saved` metric. Both lifetime `values` and `total_value` numeric responses are supported.

Use `paging.nextCursor` as the next request's `after`, with the same `limit` (1–12). Do not build a cursor from Meta URLs. Cursors are signed, account/version-bound and expire after 24 hours; token changes invalidate them. The service scans at most three media pages per feed request, preserving continuation even if a page contains no Reels. “Fetched Reels” counts loaded cards, not all Reels on the account.

The service has a bounded, per-process 30-minute cache and coalesces concurrent reads. Restarting Express clears it. Requests have a 15-second timeout per upstream call. Optional unsupported fields are omitted on retry; invalid tokens and mandatory fields fail explicitly. Media URLs are restricted to HTTPS Instagram/Meta CDN hosts. Do not persist signed URLs as permanent media links.

Insights verify the media owner and Reel type before fetching private metrics. If Meta specifically does not support the `owner` field, membership is checked against up to 1,000 account media items; inability to establish ownership fails closed. The public feed is limited to 60 requests per minute per observed IP. In production, configure trusted proxy handling carefully so real clients are not all counted as the proxy.

## UI

`client/src/components/InstagramReels.jsx` is used on the homepage and product detail page. It lazy-loads the feed near the viewport, shows 9:16 thumbnails, assigns video sources only when requested, and uses native playback controls. Playing one Reel pauses others; videos pause when hidden/offscreen. Missing or failed video playback offers the official Instagram permalink. Loading, empty, retry and pagination states are supported.

`admin/src/InstagramAnalytics.jsx` shows connection status, fetched count, likes/comments and opt-in private insights per Reel. Unsupported or denied metrics display “Unavailable”, separately from zero and “Not fetched”. The old OAuth settings page links to this analytics page and identifies its separate token source.

## Live API results — 10 November 2026

The configured token successfully verified `@earth_mitra`, account `17841435987087568`, against `https://graph.facebook.com/v26.0`. No alternate authentication method was attempted.

| Reel | Video URL available | Likes | Comments |
| --- | --- | --- | --- |
| `18127541969511169` | Yes | 7 | 2 |
| `18107849798076516` | Yes | 7 | 0 |
| `17885974857666438` | No | 6 | 1 |

All three returned captions, thumbnails and permalinks. Recent media pagination reported no further page. Views, reach, shares and saves on the first Reel returned **Meta code 10**, an authorization/permission denial. No metric values were fabricated. Meta's response did not identify a specific missing permission, so the exact missing grant has not been established.

Verification completed: all 57 backend tests passed; client and admin production builds passed. Headless Chromium played both available live videos (playback time advanced), confirmed that starting the second paused the first, and verified the third Reel's Instagram fallback. No video source/media request was loaded before clicking play. The 390px mobile layout retained 9:16 cards; a hidden accessibility-label overflow was fixed and document width verified at 390px. The real admin login loaded the connection, all three Reels and code-10 insight messages. Anonymous status requests returned 401. The observed browser requests/text responses and public feed contained no configured Instagram token; the public feed contained no private insights. No browser runtime errors were observed. This is a Chromium desktop/mobile-viewport check, not testing on every physical device.

The initial client build found an unavailable branded `Instagram` icon in its installed lucide-react version; the component now uses the supported Camera icon. The remaining client build notice concerns the existing main bundle exceeding 500 kB; it does not fail the build. Optional local browser QA artifacts are in the Git-ignored `server/node_modules/.cache/instagram-qa` directory and are not runtime dependencies.

Check the selected Unified Login configuration's insights permissions (including `instagram_manage_insights` for the Facebook Graph flow), the grants on the generated token, professional-account/business access, and any required app access/review status. Reauthorize/regenerate the token after correcting access, update only the backend environment, restart and rerun the live test. Adding a permission in the dashboard alone does not grant it to an already-issued token. Do not switch to standalone Instagram Login to hide this error.

Other errors: Meta 190 means rejected/expired/revoked or incompatible token; 100 concerns fields/metrics/parameters/account IDs; 4/17/32/613 indicate rate limiting. The admin API and test script retain exact code/subcode while replacing raw messages. An unavailable video needs no token exposed to the browser: the existing Instagram link is the fallback.

## Production

1. Store the token/account/version in your hosting provider's backend secrets/environment and keep `.env` excluded from Git. Do not put credentials in frontend build variables.
2. Build client with `VITE_API_BASE_URL=/api` and admin with `VITE_API_URL=/api` when using one origin. Set these explicitly: the existing production defaults otherwise target port 5000.
3. Serve the built storefront over HTTPS and reverse-proxy `/api/*` to Express. If serving admin at `/admin/`, build it with `npm.cmd run build -- --base=/admin/`, serve that output there, and configure its SPA fallback. Alternatively deploy admin at its own root and set its API origin/CORS accordingly.
4. Set `NODE_ENV=production`, `CLIENT_URL`/`CLIENT_URLS` to the actual allowed storefront/admin origins, and preserve secure HTTP-only admin cookies. Do not use Vite's development servers as production hosting.
5. If optional OAuth is used, register the exact production HTTPS callback in Meta and update `INSTAGRAM_REDIRECT_URI`. The environment-token Reels feed does not require an OAuth callback per visitor.
6. Monitor token expiry and Meta errors. Cache is local to each process; use a shared cache/rate limiter if scaling across instances. Avoid logging response bodies, Authorization headers or signed media URLs.

## Files for this integration

- Backend: `services/instagramReels.js`, `routes/instagramRoutes.js`, route registration in `index.js`, `scripts/testInstagram.js`, `tests/instagramReels.test.js`, `package.json`, `.env.example`.
- Storefront: `src/components/InstagramReels.jsx`, `src/api.js`, `src/pages/HomePage.jsx`, `src/pages/ProductDetailPage.jsx`, `.env.example`.
- Admin: `src/InstagramAnalytics.jsx`, `src/InstagramSettings.jsx`, `src/App.jsx`, `src/Layout.jsx`.
- Documentation: this file and the cross-reference in `INSTAGRAM_SETUP.md`.

Existing unrelated workspace changes were retained.
