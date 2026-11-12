# Shiprocket integration

Implemented in the existing Express/Mongoose backend and React admin. The supplied ZIP is used as a starter reference; its placeholder authentication and separate order model are not installed. Existing admin cookie/JWT authentication protects all shipping and billing operations.

## Run locally (PowerShell)

Run these in three terminals from the repository root:

```powershell
cd server
npm.cmd run dev
```

```powershell
cd admin
npm.cmd run dev
```

```powershell
cd client
npm.cmd run dev
```

Open `http://localhost:5173/admin/` or `http://localhost:5174/admin/`, then sign in with an existing admin account. Storefront: `http://localhost:5173/`.

## Account setup required

Temporary checkout mode: the local `server/.env` now has `SHIPROCKET_CHECKOUT_CHECK_ENABLED=false`. Both guest and signed-in checkout skip the Shiprocket courier lookup and accept products without parcel measurements. Available trusted measurements are still saved; absent measurements must be added in admin before dispatch. The checkout delivery-check widget is removed. Address/PIN format, stock, prices and Razorpay payment verification remain required. Product-page delivery lookup remains an optional manual tool; its result does not gate checkout.

To restore the mandatory check, set `SHIPROCKET_CHECKOUT_CHECK_ENABLED=true` and restart the backend. Omitting the variable also enables the check by default. Admin shipment creation, courier selection and dispatch validation are unaffected by this checkout-only setting.

1. Keep `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` in `server/.env` only. Use a Shiprocket API user.
2. Add and verify your real warehouse in Shiprocket Settings > Pickup Address. In admin **Shipping & Tax**, refresh the connection, select the warehouse, fill invoice seller information, and save. A single active or primary warehouse is also resolved automatically when no saved warehouse exists. No fake warehouse is used.
3. Edit each product under **Products** and enter its packed weight in kg and length/breadth/height in cm, including packaging. Checkout packs units vertically, sums weights and heights, and uses maximum length/breadth. Verify the actual combined packaging in the order screen before approval. Missing measurements block payment initiation when the checkout check is enabled; during temporary bypass they can be entered before admin dispatch.
4. A random `SHIPROCKET_WEBHOOK_KEY` is configured locally in ignored `server/.env`. Configure your public HTTPS backend URL + `/api/webhooks/courier-events` in Shiprocket and send that same secret in `x-api-key`. Localhost cannot receive external webhooks; the admin **Sync tracking** button works without a webhook.
5. Optional environment entries are documented in `.env.shiprocket.example`. Do not put credentials in frontend environment variables.

## Admin order process

Open **Orders > an order**. Save actual packed measurements, approve the paid order, create its shipment, check courier rates, assign a courier/AWB, request pickup, and generate label/manifest. AWB assignment can debit the Shiprocket wallet; pickup contacts the courier. The integration does not automatically trigger either during checkout.

**Invoices & Billing** shows real stored totals, recorded payment status and quoted freight. Download an order PDF after approval. After shipment creation, generate the provider invoice as well. Local PDFs are billing summaries, not a GST tax calculation system: existing orders have no per-item HSN/tax snapshots. Seller GSTIN alone does not create a tax breakup. Invoice numbers are stable and unique by order ID.

Cancellation calls Shiprocket and verifies its result. It does not refund a Razorpay payment or restock inventory. COD delivery does not set payment to paid. Carrier quotes are not wallet or settlement statements.

## API routes

All paths below are prefixed with `/api/admin/shipping` and require an admin session.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/settings` | Saved warehouse/seller and configuration flags |
| PUT | `/settings` | Select a warehouse verified against the live account; save seller fields |
| GET | `/connection` | Authenticate and list live pickup locations |
| GET | `/billing?page=1` | Paginated billing records and aggregate totals |
| GET | `/orders` | Recent orders |
| GET | `/orders/:id` | Order details |
| PUT | `/orders/:id/parcel` | Save `weightKg`, `lengthCm`, `breadthCm`, `heightCm`; reset approval |
| POST | `/orders/:id/approve` | Validate paid/COD, parcel, address and billing |
| GET | `/orders/:id/couriers` | Courier availability and estimated rates |
| POST | `/orders/:id/create-shipment` | Create or link the exact reference `EM-<Mongo order ID>` |
| POST | `/orders/:id/assign-courier` | Assign AWB with `{ "courierId": 123 }` |
| POST | `/orders/:id/pickup` | Request courier pickup |
| POST | `/orders/:id/label` | Generate shipping label |
| POST | `/orders/:id/manifest` | Generate manifest |
| POST | `/orders/:id/print-manifest` | Print generated manifest |
| POST | `/orders/:id/invoice` | Generate Shiprocket invoice |
| GET | `/orders/:id/invoice.pdf` | Download local order billing PDF |
| GET | `/orders/:id/track` | Fetch and persist current tracking/history |
| POST | `/orders/:id/reconcile` | Recover interrupted provider operations |
| POST | `/orders/:id/cancel` | Cancel and confirm remote cancellation |

Public preview: `GET /api/delivery/check?pincode=462001`. This uses a 5 kg prepaid preview, a short response cache and a per-process rate limiter. It does not guarantee final eligibility. The server independently checks trusted cart measurements before initiating payment. For multiple backend instances use shared rate limiting/caching.

Webhook: `POST /api/webhooks/courier-events` with `x-api-key`. Events are deduplicated and current carrier tracking is fetched before applying status, so stale notifications do not blindly overwrite newer delivery state. Tracking RTO statuses does not mark them delivered. Webhook failures return 503 for provider retry.

Authenticated checkout `/api/orders/create-razorpay-order` now requires `shippingAddress` (and optional `billingAddress`) and uses the same persisted checkout snapshot as guest checkout. It reads items from the server cart, takes email from the session, and returns the Razorpay amount in paise. Its verify endpoint only accepts the owner's saved checkout session. Already-open checkout sessions created by the old legacy flow need to be restarted.

## Recovery

Orders have a durable operation lock. Concurrent writes are blocked. Unconfirmed create/AWB/pickup/cancel calls set a review hold, including interrupted processes. Wait two minutes for a crashed in-flight operation, then use **Reconcile**. Exact channel-order-reference matching avoids duplicate remote creation. If the provider still cannot confirm a result, the hold remains: inspect the matching Shiprocket order/support before any manual repair. Do not clear the database lock blindly. This release does not run a background reconciliation worker.

## Verification

```powershell
cd server
npm.cmd test
npm.cmd run test:shiprocket:live
```

The live check reads authentication, pickup locations, MongoDB setup, authenticated local API routes, and (when a warehouse exists) courier availability for several PIN codes. It does not create a shipment, AWB, pickup or wallet debit. Automated tests mock provider writes and cover route authorization, complete processing flow, PDF output, duplicate/concurrent calls, timeout reconciliation, tracking, webhooks and checkout shipping gates.

Live findings on 10 November 2026: Shiprocket login and MongoDB connectivity succeeded; pickup addresses returned an empty list; all four catalog products lacked shipping measurements. Real courier availability, shipment/AWB, pickup and live provider documents could not be exercised until that setup is supplied. Admin and storefront production builds passed. No interactive browser test has been performed.

Provider reference: [official Shiprocket API documentation](https://apidocs.shiprocket.in/).
