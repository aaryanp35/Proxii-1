# Proxii-1

Proxii is a React + Node app for neighborhood scoring and hiring workflows.

- **Market scoring**: `GET /api/score/:zipcode`
- **Careers + applications**: careers pages in the frontend, application save endpoint at `POST /api/apply`

## Tech stack

- **Frontend**: React 19, Vite, React Router
- **Backend/API**: Node/Express (`server.js`) and Vercel-style serverless handlers (`api/*.js`)
- **Data**: Supabase (applications + score/cache tables)
- **External APIs**: Google Geocoding + Places APIs
- **Tests**: Vitest + Testing Library

## Repository layout

```text
Proxii-1/
├── api/                      # Serverless handlers (score/apply)
├── src/                      # Frontend app
│   ├── pages/                # Route pages
│   ├── components/           # Shared UI components
│   ├── data/                 # Static data (jobs)
│   └── __tests__/            # Frontend/API tests
├── ml/                       # ML score blending helpers
├── supabase/migrations/      # DB schema migrations
├── server.js                 # Local Express API server
├── .env.example              # Required env vars
└── README.md
```

## Prerequisites

- Node.js 20+
- npm 10+
- Google Maps API key
- Supabase project (if using apply endpoint and cache tables)

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Fill `.env` values (see `.env.example` for all required keys).

4. Start backend API server:

```bash
npm run dev:server
```

5. In a second terminal, start frontend:

```bash
npm run dev
```

6. Open the Vite URL shown in terminal (normally `http://localhost:5173`).

## NPM scripts

- `npm run dev` - start Vite frontend
- `npm run dev:server` - start local Node API server
- `npm run dev:all` - run server + frontend together
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run test` - run test suite once
- `npm run test:watch` - run tests in watch mode

## Environment variables

See `.env.example` for the latest list. Main ones:

- `MAPS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `PROXIMITY_THRESHOLD_METERS`

## Documentation for new developers

- [DEPLOY.md](./DEPLOY.md) - deployment notes
- [SCORING_REFACTOR.md](./SCORING_REFACTOR.md) - scoring model refactor context
- [docs/ONBOARDING.md](./docs/ONBOARDING.md) - practical onboarding guide

## Notes

- Current tests include pre-existing failures in `src/__tests__/CareersPage.test.jsx` unrelated to this documentation/cleanup task.
- Build currently succeeds on the main branch.
