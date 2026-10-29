# Earth Mitra Admin

This standalone Vite app runs at `http://localhost:5174` and talks to the Express API in `server/`.

## Run locally

1. Start the server from `server/` with `npm run dev` and make sure its `.env` has `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL=http://localhost:5173` (development CORS also allows this admin app on port 5174). For separate production storefront/admin origins, list both in `CLIENT_URLS`.
2. Create an admin account once from `server/`: set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`, then run `npm run create-admin`. Remove the temporary `ADMIN_*` values afterward.
3. In `admin/`, run `npm install` and `npm run dev`, then open `http://localhost:5174/login` and use that admin account's email and password.

The API uses the server's HTTP-only `token` cookie. Keep the client and API on the same hostname (`localhost` or `127.0.0.1`) so the browser sends the cookie. `VITE_API_URL` can override the default API URL; see `.env.example`.

## Connected screens

The dashboard, products, categories, inventory, orders, payments, customers, coupons, and review moderation screens read live database data. Product creation, category creation, coupon creation, inventory adjustment, and review visibility changes use the corresponding protected API endpoints. Product images use the server's configured Cloudinary upload endpoint.

Collections, returns, banners, and most settings/team/activity screens remain UI prototypes because this project does not yet have matching server models and APIs. They display example content and do not save records. The order detail view is also still a prototype.
