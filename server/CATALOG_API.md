# Catalog and homepage content API

All routes are mounted below `/api`. Admin routes require the existing authenticated admin session cookie.

## Collections

- `GET /collections` — active collection summaries and product counts.
- `GET /collections/:slug` — active collection with populated product details.
- `GET /collections/admin` — all collections, including inactive ones (admin).
- `POST /collections` — create (admin).
- `PUT /collections/:id` — update (admin).
- `DELETE /collections/:id` — delete (admin).

Collection fields: `name`, `description`, `image`, `products` (array of product ObjectIds), `isActive`, and `sortOrder`. Slugs are generated from the name.

## Products

- `GET /products/admin?page=1&limit=100` — admin product listing.
- `POST /products` — create (admin).
- `PUT /products/:id` and `DELETE /products/:id` — update and delete (admin).
- `POST /products/:id/images` — upload up to five product images (admin).
- `DELETE /products/:id/images` — remove an image by its `public_id` (admin).

Price fields are `mrp` (list price), `price` (overall selling price), and `discountPrice` (optional final promotional price). A positive discount price must not exceed `price`, and `mrp` must be at least `price`. Detail fields also include `packContains` (string array), `suitableUses` (string array, shown as “Ideal For Making”), `certifications`, `allergenInfo` (`status`, `allergens`, `warnings`), `storage` (`instructions`, `minTemperatureC`, `maxTemperatureC`), and `faqs` (array of `{ question, answer }` objects).

## Blogs and recipes

The same API is mounted at `/blogs` and `/recipes`:

- `GET /blogs` or `GET /recipes` — published posts.
- `GET /blogs/:slug` or `GET /recipes/:slug` — published post details.
- `GET /blogs/admin` or `GET /recipes/admin` — all posts, including drafts (admin).
- `POST /blogs` or `POST /recipes` — create (admin).
- `PUT /blogs/:id` or `PUT /recipes/:id` — update (admin).
- `DELETE /blogs/:id` or `DELETE /recipes/:id` — delete (admin).

Post fields: `title`, `excerpt`, `content`, `coverImage`, `category`, `author`, `readTime`, `tags`, `isPublished`, and optional `publishedAt`. Slugs are generated from titles.

## Homepage banners

- `GET /banners?placement=hero` — active banners within their optional schedule.
- `GET /banners/admin` — all banners (admin).
- `POST /banners`, `PUT /banners/:id`, `DELETE /banners/:id` — banner CRUD (admin).
- `POST /uploads/images` — upload one or more image files and receive their hosted URLs (admin).

Banner fields include `title`, `altText`, `desktopImage`, `mobileImage`, `link`, `placement` (`hero`, `midpage`, or `promo`), `sortOrder`, `isActive`, `startsAt`, and `endsAt`. The desktop and mobile images are managed independently.
