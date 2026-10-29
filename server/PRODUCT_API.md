# Product Details API

Backend reference for the product details endpoints. These routes use the existing Express, Mongoose, cookie JWT authentication, and admin role check. No frontend files are required for these APIs.

## Local setup

1. From `server`, install the existing dependencies with `npm install`.
2. Copy `.env.example` to `.env`, set `MONGO_URI` and a private random `JWT_SECRET`, and set Cloudinary values if image upload is needed.
3. Start MongoDB, then run `npm run dev` (or `npm start`). The API listens on `PORT` (default `5000`).
4. Product routes are mounted under `/api/products`.

Mongoose creates the declared indexes when the application connects. New product fields are optional/defaulted, so existing product records remain readable. Existing review averages are not trusted as a source of truth; run the rating backfill below to recompute them from stored review records.

## Product endpoints

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /api/products` | Public | Existing product listing, search, category, price filters, `newest`, `price_asc`, `price_desc`, `rating`, or `reviews` sort and pagination. `limit` is capped at 100. |
| `GET /api/products/:slug` | Public | Essential detail record, category, images/gallery, variants, use/storage/allergen/shelf-life details, certifications, FAQs, rating summary and up to four related products. |
| `GET /api/products/:slug/related?limit=8` | Public | Related products from the same category, excluding the requested product. Limit 1–20. |
| `POST /api/products` | Admin cookie | Create a product. Slug is generated from `name`; images are added through the upload endpoint. |
| `PUT /api/products/:id` | Admin cookie | Update explicitly supported product fields. Unknown/read-only fields are rejected. |
| `DELETE /api/products/:id` | Admin cookie | Delete a product. |
| `POST /api/products/:id/images` | Admin cookie | Upload up to five image files (5 MB maximum each) under the `images` field to Cloudinary. |
| `DELETE /api/products/:id/images` | Admin cookie | Remove an image by `{ "public_id": "..." }`. |

Admin routes use the existing `token` HTTP-only cookie set by the login flow. Public product reads do not include user-private data. No product cache is used, so admin edits and review changes are immediately reflected on the next read.

### Product write fields

`name`, `sku`, `description`, `price`, `discountPrice`, `stock`, `category`, `gallery`, `variants`, `suitableUses`, `storage`, `allergenInfo`, `shelfLife`, `eco_certified`, `origin`, `certifications`, `organicCertifications`, and `faqs` are writable by admins. Ratings, review counts, availability, slug, and uploaded `images` are server-managed. Mongoose schema validation also checks nested values and enum options.

Example create/update body:

```json
{
  "name": "Organic Red Lentils",
  "sku": "LENTIL-500",
  "description": "Product description from the product owner.",
  "price": 180,
  "discountPrice": 160,
  "stock": 24,
  "category": "<category ObjectId>",
  "suitableUses": ["dal", "soups"],
  "storage": { "instructions": "Store in a cool, dry place." },
  "allergenInfo": { "status": "unknown", "allergens": [], "warnings": [] },
  "shelfLife": { "duration": 12, "unit": "months", "afterOpening": "Keep sealed." },
  "organicCertifications": [{
    "name": "Certification name",
    "issuingAuthority": "Authority",
    "documentUrl": "https://example.org/document.pdf",
    "verificationStatus": "unverified"
  }],
  "faqs": [{ "question": "Question?", "answer": "Verified answer." }]
}
```

`allergenInfo.status` is `unknown` unless an authorized editor supplies evidence-backed information. `contains` describes listed allergens; `none_confirmed` explicitly represents a confirmed absence. Empty arrays alone do not assert that a product is allergen-free. Certification records default to `unverified`; the API does not verify documents or assert that a product is certified.

Detail responses retain the existing flat product shape and add normalized fields where older records lack them. `availability` is derived from stock, `ratingSummary` contains `average`, `count`, and a 1–5 `distribution`, `relatedProducts` excludes the current record, and `sampleData` flags seeded demo products. Missing legacy allergen data is returned with `status: "unknown"`.

## Reviews and ratings

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /api/products/:id/reviews?page=1&limit=10&rating=5` | Public | Paginated reviews, newest first; optional rating filter. Limit 1–50. |
| `GET /api/products/:id/reviews/summary` | Public | Rating average, total and count distribution. |
| `POST /api/products/:id/reviews` | Authenticated user | Add a 1–5 star review (only after a delivered purchase). One review per user/product. |
| `DELETE /api/products/:id/reviews/:reviewId` | Owner or admin | Delete a review and refresh the product summary. |

Review create body:

```json
{ "rating": 5, "comment": "Review text" }
```

Review list response:

```json
{
  "reviews": [{ "_id": "...", "rating": 5, "comment": "...", "createdAt": "...", "user": { "name": "...", "avatar": "..." }, "sampleData": false }],
  "page": 1,
  "limit": 10,
  "total": 1,
  "totalPages": 1
}
```

The detail endpoint embeds only the small rating summary, not the review collection. Review listing has bounded pagination and indexes for product/date and rating/date. Summary values are maintained on review writes; backfill legacy values before relying on old product summaries.

## Responses and errors

Successful read/write responses are JSON objects or resources described above. Validation errors return `400`, missing records `404`, unauthenticated requests `401`, forbidden requests `403`, duplicate SKU/slug/review `409`, and unexpected failures return a generic `500` message. Existing server-wide error conventions are preserved where unrelated routes are concerned.

## Sample data

The optional seeder adds products, FAQs, variants, sample reviews, and certification/storage/allergen examples. The fixtures are conspicuously named `DEMO`; certification status is unverified, allergen status remains unknown, and review text is labeled sample. The seeder refuses to run when `NODE_ENV=production` and requires explicit opt-in:

PowerShell:

```powershell
$env:SEED_DEMO_DATA = "1"
npm run seed:product-demo
```

Run only against a local or isolated database. It upserts its own demo products and replaces only its own demo reviews. It does not remove other products or reviews. Sample API paths are printed after it completes.

## Existing database notes

- The added product fields are optional and have safe read defaults; no existing product content is fabricated or rewritten.
- New sparse unique SKU and review query indexes are declared in Mongoose. Check existing duplicate SKUs before enabling index creation if SKUs already exist in the database.
- Review summaries are recalculated when a review is created or deleted. If prior `avgRating` or `numReviews` values might be stale, recompute them from the reviews collection before depending on those legacy values.
- `npm run backfill:product-ratings` computes summary values without writing; add `-- --apply` to apply them. Review the target database and take a normal backup before applying a data migration.
- Product detail recommendations use the same category and exclude the current product. Empty related results are valid when a category has no other products.

## Verification

Run `node --check` on the changed JavaScript files for syntax validation. Exercise the routes against a local MongoDB using the sample endpoints above. Do not use a production database for demo seeding or destructive verification.
