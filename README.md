# The Earth Mitra

MERN storefront with a Vite/React client and an Express/Mongoose API. The server is organized into `models/`, `routes/`, `controllers/`, `middlewares/`, `config/`, `utils/`, `scripts/`, and `tests/`. The client uses React Router pages and shared components under `client/src/`.

## Local setup

Requirements: Node.js 20.19 or newer (Mongoose 9), npm, and a local or isolated MongoDB database. Cloudinary credentials are needed only for product image uploads; Razorpay credentials are needed for payment API requests.

1. Copy `server/.env.example` to `server/.env` and set `MONGO_URI`, a private `JWT_SECRET`, and `CLIENT_URL`. For customer email sign-in, also set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to a sender verified in Resend.
2. Copy `client/.env.example` to `client/.env`. Set `VITE_API_BASE_URL` to the server's `/api` URL.
3. Install dependencies with `npm install` in both `server` and `client`.
4. Start the server in one terminal with `npm run dev` from `server`.
5. Start the client in another terminal with `npm run dev` from `client`.

The server defaults to port 5000 and client dev server to Vite's port 5173. For production, set exact allowed client origin, use HTTPS, keep server secrets out of `client/.env`, and configure payment and media provider credentials on the server only.

## Current API integration map

| Storefront action | API/data flow |
| --- | --- |
| Home bestsellers | `GET /api/products?limit=4&sort=rating` |
| Product listing, search, filters, sorting, pagination | `GET /api/products?page=N&limit=12&search=...&category=<id>&minPrice=...&maxPrice=...&sort=...` |
| Product detail | `GET /api/products/:slug` |
| Product reviews | `GET /api/products/:id/reviews?page=1&limit=5` |
| Related products | Included in product detail; separate `GET /api/products/:slug/related` is also available |
| Collection detail product grid | `GET /api/products`; filters by the collection's configured category name |

The client API base is controlled by `VITE_API_BASE_URL`. See [the Product Details API reference](server/PRODUCT_API.md) for full request and response contracts, admin access, reviews, schemas, validation, sample records, and rating backfill details.

## Existing backend APIs

Additional server routes exist for authentication, users, categories, cart, wishlist, coupons, orders, and reviews. Protected routes use the server's HTTP-only `token` cookie. Product create/update/delete and image management are admin-only. Product fields and legacy records are described in the API reference.

### Customer email OTP sign-in

The person-icon login popup offers email OTP and a development-only phone test option. Email OTP uses `POST /api/auth/email-otp/request` with `{ "email": "you@example.com" }`, then `POST /api/auth/email-otp/verify` with `{ "email": "you@example.com", "otp": "123456" }`. A successful verification sets the same HTTP-only customer session cookie used by the rest of the site. Codes expire after 10 minutes, have at most five verification attempts, and can be requested once per minute per email. Admin accounts must continue to use the separate admin app's email/password login.

Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `server/.env`. Resend only accepts a sender address authorized for the account; a personal Gmail address may not be accepted as a sender, so use the sender/domain shown as verified in your Resend dashboard. The API key remains server-side. The request endpoint does not reveal whether an email already has an account; a new customer account is created after successful code verification.

## Current integration limits

- The client product listing, home product cards, collection product grid, and product details read real product API data. Blogs and collection descriptions remain local because this backend has no blog or collection content model/API.
- The cart drawer still holds guest cart items in React state; it is not persisted to the server. The server cart API requires an authenticated user.
- Customer email OTP sign-in is available through Resend. The separate phone login option remains a temporary test flow: any non-empty number and OTP create a regular test user and session in development. The backend endpoint is disabled when `NODE_ENV=production`; replace it with real SMS verification before production.
- The separate admin app lives in `admin/` and runs at `http://localhost:5174/login`. It uses the existing email/password login and admin-protected backend APIs. Create/promote an admin using `npm run create-admin` from `server` after setting `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` (at least 12 characters) in `server/.env`; remove those bootstrap values afterward.
- Checkout does not submit a fake order. The server has authenticated Razorpay endpoints, but the client flow is not connected.
- Account profile/order/address screens are not connected to the server yet.

## Commands

From `server`:

```bash
npm run dev
npm test
npm run seed:product-demo
npm run backfill:product-ratings
npm run create-admin
```

The demo seeder requires `SEED_DEMO_DATA=1` and refuses `NODE_ENV=production`. Use only an isolated development database. The rating backfill defaults to dry-run; use `npm run backfill:product-ratings -- --apply` only after reviewing the target database and taking a backup.

From `client`:

```bash
npm run dev
npm run build
```

## Troubleshooting

- If product requests fail, verify MongoDB is reachable, the server is running, and `VITE_API_BASE_URL` points to the server `/api` base.
- For browser credentialed requests, set server `CLIENT_URL` to the exact client origin.
- For image upload failures, configure server Cloudinary values; the product image endpoint accepts up to five image files, 5 MB each.
- Run `npm test` in `server` for route/controller HTTP tests using mocked models. They do not validate a live MongoDB or payment provider.
