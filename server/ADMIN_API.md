# Admin API

The admin page in `client/src/pages/AdminPage.jsx` uses the endpoints below. All writes and admin data reads require the authenticated HTTP-only `token` cookie and an account with `role: "admin"`. The frontend sends credentials with API requests; sign in at `/admin/login` first.

Create or promote an admin account from `server/` by setting `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` (at least 12 characters) in `.env`, then running:

```sh
npm run create-admin
```

Remove the bootstrap values from `.env` after the account is created. Admin login uses the existing `POST /api/auth/login` email/password endpoint; OTP is not used.

## Endpoints used by the panel

| Method and path | Access | Request | Response |
| --- | --- | --- | --- |
| `GET /api/admin/dashboard` | Admin | None | Live product, category, customer, order, paid revenue, recent-order, and low-stock summaries |
| `GET /api/products/admin?page=1&limit=100` | Admin | Optional page and limit (1–100) | `{ products, page, limit, total, totalPages }` |
| `POST /api/products` | Admin | Product fields: `name`, `description`, `price`, `category`, and optional SKU, discount, stock, images, variants, and product detail fields | Created product |
| `PUT /api/products/:id` | Admin | Only editable product fields | Updated product |
| `DELETE /api/products/:id` | Admin | None | `{ message }` |
| `GET /api/categories` | Public | None | Category array |
| `POST /api/categories` | Admin | `{ name, image?, parentCategory? }` | Created category |
| `PUT /api/categories/:id` | Admin | Partial category fields | Updated category |
| `DELETE /api/categories/:id` | Admin | None | `{ message }`; returns `409` if products or child categories still reference it |
| `GET /api/orders/all` | Admin | None | Newest-first order array with customer and product references populated |
| `PUT /api/orders/:id/status` | Admin | `{ "status": "processing" | "shipped" | "delivered" | "cancelled" }` | `{ message, order }` |
| `GET /api/coupons` | Admin | None | Newest-first coupon array |
| `POST /api/coupons` | Admin | `{ code, discountType, discountValue, minOrderAmount, usageLimit, expiresAt }` | Created coupon |
| `PUT /api/coupons/:id/toggle` | Admin | None | `{ message, coupon }` |
| `DELETE /api/coupons/:id` | Admin | None | `{ message }` |
| `GET /api/users/admin?page=1&limit=100` | Admin | Optional page and limit (1–100) | `{ users, page, limit, total, totalPages }`; password hashes are never selected |
| `GET /api/reviews?page=1&limit=100` | Admin | Optional page and limit (1–100) | `{ reviews, page, limit, total, totalPages }` |
| `PUT /api/reviews/:reviewId/visibility` | Admin | `{ "isApproved": true | false }` | Updated review and recalculated public rating summary |

`GET /api/orders/all` is the panel's admin order listing endpoint. `GET /api/orders` is also an admin-only alias for clients that use the collection root.

Invalid inputs return `400`, missing records return `404`, duplicate category or coupon identifiers return `409`, and protected routes return `401` when signed out or `403` for a non-admin account. Product, category, order, and coupon records are read from the configured MongoDB database; the admin APIs do not fabricate records.

## Setup

1. Configure `MONGO_URI` and a private `JWT_SECRET` in `server/.env`.
2. Configure the browser origin in `CLIENT_URL` and the API URL in `client/.env` if the default local setup does not apply.
3. Start the server and client, create the admin account once, then sign in at `/admin/login`.

The admin panel currently loads all orders and coupons as arrays and loads up to the first 100 products. If the catalog grows beyond that, add pagination controls to the panel alongside paginated endpoints.
