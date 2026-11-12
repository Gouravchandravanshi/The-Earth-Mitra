# Instagram Unified Login (local ngrok setup)

The existing Vite proxy supports one public origin:

```text
ngrok HTTPS domain -> Vite :5173
  /                         -> storefront
  /admin/                   -> admin Vite :5174
  /api/*                    -> Express :5000
  /api/auth/instagram/callback -> Express OAuth callback
```

`ngrok http 5000` exposes only Express. Express has no `/` homepage, so visiting its root gives `Cannot GET /`. That response does not indicate a backend crash. For the combined website, admin and API, use **`ngrok http 5173`** and keep all three local servers running. The existing frontend `allowedHosts` includes `liqueur-tubeless-unharmed.ngrok-free.dev`; update it if your ngrok hostname changes.

## Current redirect URL

```text
https://liqueur-tubeless-unharmed.ngrok-free.dev/api/auth/instagram/callback
```

Register that exact value in Meta Developers > Earth Mitra Farmers > Instagram API > API setup with Unified login. No trailing slash. The server uses the exact `INSTAGRAM_REDIRECT_URI` for both authorization and code exchange.

## Fill server/.env

```dotenv
META_APP_ID=
META_APP_SECRET=
META_LOGIN_CONFIG_ID=
META_GRAPH_VERSION=v25.0
INSTAGRAM_REDIRECT_URI=https://liqueur-tubeless-unharmed.ngrok-free.dev/api/auth/instagram/callback
INSTAGRAM_TOKEN_ENCRYPTION_KEY=<already generated locally>
```

- App ID and App Secret: your Meta app's Settings > Basic.
- Configuration ID: the selected Instagram Unified Login / Facebook Login for Business configuration. If the generated Meta login URL contains `config_id=...`, use that value. This is not the App ID.
- Permissions are configured in Meta's configuration, not added as a standalone `scope` list. Ensure the permissions required for the desired Instagram insights are included in your configuration. The sample supplied for this task mentions `instagram_manage_insights`; actual granted permissions and account access still require validation with your app.
- Keep the generated encryption key stable and private. Tokens are encrypted with AES-256-GCM in MongoDB. Changing the key requires reconnecting existing accounts.
- `v25.0` follows the supplied Meta setup example and is configurable. This implementation targets the supplied Unified Login/Facebook code-exchange flow; it does not use the standalone `api.instagram.com` flow.

Restart the backend after filling the variables. No new npm package is required: Express, dotenv and Mongoose are already present; outbound requests use Node's built-in fetch.

## Connect

1. Open `https://liqueur-tubeless-unharmed.ngrok-free.dev/admin/settings/instagram` and sign in as admin on this public domain. A localhost login cookie is not sent to the ngrok hostname.
2. Click **Connect Instagram**. This creates a short-lived, one-use state and browser cookie, then redirects to Meta with `config_id`.
3. Complete Meta's login/consent screens.
4. The callback exchanges the authorization code and stores the token encrypted. Success is shown as plain text; neither tokens nor app secrets are returned to the browser.
5. Return to the admin Instagram page and refresh its connection status.

Use the app's Connect button rather than a copied static Meta Login URL: a static URL has no browser-bound state from this server and will be rejected. The callback checks the initiating admin's current role without relying on the normal `SameSite=Strict` session cookie during Meta's cross-site redirect. Its separate temporary OAuth cookie uses `Secure`, `HttpOnly` and `SameSite=Lax`.

## Check the tunnel

Visit `/api/health`: expect a successful health response.

Visit `/api/auth/instagram/callback` without parameters: expect HTTP **400** and `No Instagram authorization code received.` This is the intended diagnostic response, not a failed tunnel.

## Implemented endpoints

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/auth/instagram/status` | Admin; sanitized configuration and connection state |
| POST | `/api/auth/instagram/connect` | Admin; body `{ "origin": "https://your-ngrok-host" }` |
| GET | `/api/auth/instagram/callback` | Browser-bound one-time OAuth state, then recheck admin role |
| DELETE | `/api/auth/instagram/connection` | Admin; removes local stored token, does not revoke access at Meta |

This page documents the optional OAuth connection flow. The own-account Reels feed and admin insights are now implemented separately using `INSTAGRAM_ACCESS_TOKEN` from the backend environment; see [Instagram Reels setup, API and live results](INSTAGRAM_REELS.md). That feed does not automatically use the OAuth token saved here. Provider tokens can expire or be revoked; the OAuth UI displays the reported expiry and supports reconnecting.

Verification: automated tests cover authorization, CSRF/state binding, one-use callbacks, expired attempts, revoked admin roles, denial handling, secret redaction and authenticated encryption. Run `npm.cmd test` in `server` and `npm.cmd run build` in `admin`.

Verified in this session: 44 backend tests passed, admin production build passed, and the public ngrok homepage, admin path and `/api/health` returned HTTP 200. The public callback returned the expected HTTP 400 missing-code message. The actual `.env` redirect placeholder was replaced with the working URL above and the supplied Configuration ID was saved. Validation then found that App ID and App Secret still contained example placeholders; replace them with real credentials from Meta Settings > Basic. No Instagram user token exchange has been completed; the user must finish Meta consent from the Connect button.

Optional read-only credential/status check: `node scripts/checkInstagram.js`. It validates Meta app credentials without printing the application token, then checks the running backend's admin Instagram status. It does not perform Instagram account consent.

Reference routes for checking the Meta dashboard configuration: [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/) and [manual code exchange](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/). Meta's documentation returned rate-limit/access errors during this session, so no live Unified Login compatibility claim is made before your real account authorization test.
