# Earth Mitra Admin
`npm install && npm run dev` (http://localhost:5174). Set `VITE_API_URL` (see `.env.example`). Lists/forms call your API via RTK Query (`src/store.js`) and fall back to sample rows. Screens are config-driven from `src/data.js`; swap the static rows for your RTK Query/API data.
