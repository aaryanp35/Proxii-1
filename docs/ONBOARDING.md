# Developer Onboarding

This guide is for engineers joining Proxii-1 and getting productive quickly.

## 1) First-day setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Add real environment values.
4. Start API + frontend:
   ```bash
   npm run dev:server
   npm run dev
   ```
5. Run tests and build:
   ```bash
   npm run test
   npm run build
   ```

## 2) Core app flows

### Scoring flow

1. User enters a ZIP/postal code in `src/App.jsx`.
2. Frontend calls `GET /api/score/:zipcode`.
3. Local dev route is handled by `server.js`; Vercel deploy uses `api/score.js`.
4. API geocodes location, fetches place signals, computes score, and returns:
   - score/category
   - growth drivers
   - risk indicators
   - area metadata

### Careers/application flow

1. Careers data comes from `src/data/jobs.js`.
2. Routes:
   - `/careers`
   - `/careers/:id`
   - `/careers/:id/apply`
3. Application submit hits `POST /api/apply`.
4. `api/apply.js` validates payload and inserts into Supabase `applications` table.

## 3) Where to make common changes

- UI layout and route-level UX: `src/pages/*`
- Dashboard behavior and search: `src/App.jsx`
- Scoring logic and signal weights: `api/score.js` (and legacy/local flow in `server.js`)
- Careers content: `src/data/jobs.js`
- DB schema changes: `supabase/migrations/*`

## 4) Local quality checks

Use these before opening or updating a PR:

```bash
npm run test
npm run build
```

If tests fail, verify whether failures are from your changes or pre-existing tests.

## 5) Team conventions

- Keep changes focused and small.
- Prefer shared helpers over repeated inline logic.
- Keep API responses backward compatible unless a migration is planned.
- Add/update docs when behavior changes.

## 6) Troubleshooting quick hits

- `MAPS_API_KEY` missing -> scoring endpoint returns errors.
- Supabase env missing -> apply endpoint and cache writes fail.
- CORS or route mismatch in deploy -> verify `vercel.json` rewrites and environment variables.
