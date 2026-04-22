# Proxii

Proxii is a neighborhood intelligence dashboard for real estate research. It combines a React + Vite frontend with an Express API that scores ZIP and postal codes using Google Maps Places data, local heuristics, and an ML correction layer.

## What it does

- Score neighborhoods from a ZIP or postal code
- Show positive drivers and negative risk signals
- Blend a rule-based score with an ML score for transparency
- Browse About and Careers pages inside the app
- Submit job applications through the UI

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS
- Backend: Node.js, Express
- Data: Google Maps Geocoding and Places APIs
- Storage: Supabase for application-related features

## Project Structure

- `src/` - React application and pages
- `api/` - Serverless-style API handlers
- `server.js` - Local Express API server
- `ml/` - Ridge regression weights and training script
- `vercel.json` - SPA routing and API rewrite config

## Requirements

- Node.js 18+
- npm
- Google Maps API key
- Supabase project URL and service role key

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Set environment variables in a local `.env` file or your shell:

```bash
MAPS_API_KEY=your_google_maps_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Start the API server:

```bash
npm run start
```

4. Start the frontend in another terminal:

```bash
npm run dev
```

5. Open the app:

```text
http://localhost:5173
```

## Available Scripts

- `npm run start` - Start the Express API server
- `npm run dev` - Start the Vite frontend
- `npm run dev:server` - Start only the API server in dev mode
- `npm run dev:all` - Start the API server and Vite together
- `npm run build` - Build the frontend for production
- `npm run preview` - Preview the production build locally
- `npm run test` - Run the test suite with Vitest
- `npm run test:watch` - Run tests in watch mode

## API Endpoints

- `GET /api/score/:zipcode` - Returns the neighborhood score, category, drivers, and risks
- `GET /api/apply` - Application-related API route
- `GET /health` - Health check

## Deployment

The repo includes `vercel.json` for Vercel deployments.

- `outputDirectory` is set to `dist`
- Non-API routes rewrite to `index.html` for SPA routing
- API requests are preserved under `/api/*`

## Scoring Notes

- `server.js` contains the main scoring pipeline and cache logic
- `ml/modelWeights.js` stores the Ridge regression coefficients and blend factor
- `ml/train.py` retrains the ML weights from labeled data when needed

## Notes

- The app uses a cache file at `cache.json` during local development
- Keep `.env` values out of source control
- The README intentionally reflects the current React/Express app, not the older Streamlit version
