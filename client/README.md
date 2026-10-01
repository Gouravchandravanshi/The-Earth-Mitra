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

Build for production:
```bash
npm run build
```

## Flows
- Shopping: home, products, product detail, collections, blogs, about, contact
- Cart drawer -> Checkout (`/checkout`)
- Login popup (phone number -> OTP) -> Account (`/pages/account`, with Overview, My Orders, Address and Profile tabs at `/pages/account/:tab`)
- Login and payment are mocked in the frontend; connect them to your backend API when ready

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
