# The Earth Mitra — Frontend

Plain Vite + React (JavaScript / JSX, no TypeScript) frontend, converted from the Figma Make design.

## Stack
- React 19
- React Router 7
- Vite
- Tailwind CSS 4

## Getting started
```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to the backend API base (for local development, `http://localhost:5000/api`). See `../server/PRODUCT_API.md` for the product detail contract. Product listing and detail pages read live data from the backend; editorial pages remain local because this server has no blog or collection content API.

Build for production:
```bash
npm run build
```

## Flows
- Shopping: home, products, product detail, collections, blogs, about, contact
- Cart drawer -> Checkout (`/checkout`)
- Login popup (email -> emailed OTP, or phone test login) -> Account (`/pages/account`, with Overview, My Orders, Address and Profile tabs at `/pages/account/:tab`)
- Email OTP requires `RESEND_API_KEY` and a Resend authorized `RESEND_FROM_EMAIL` in `server/.env`. The phone option remains a development test flow: any non-empty number and OTP work, but the server disables that endpoint in production. Both flows create regular customer sessions, never admin sessions.
- Checkout requires a signed-in account and a configured Razorpay integration; the frontend does not create fake orders.

## Structure
```
src/
  App.jsx
  main.jsx
  routes.js
  index.css
  components/
    Navbar.jsx
    Footer.jsx
    ProductCard.jsx
    StarRating.jsx
  pages/
    Root.jsx
    HomePage.jsx
    ProductsPage.jsx
    ProductDetailPage.jsx
    CollectionsPage.jsx
    BlogsPage.jsx
    AboutPage.jsx
    ContactPage.jsx
    CheckoutPage.jsx   (new)
    AccountPage.jsx    (new)
  data/
    index.js
```
