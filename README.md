# Alt-Real Estate Value Index (Zip-Based)

An analytics engine that calculates neighborhood "Gentrification" and "Investment Potential" scores by analyzing Google Maps POIs within a specific Zip Code.

## Quick Start (Local Development)

1. Install dependencies:

```bash
npm install
cd proxii-frontend && npm install && cd ..
```

2. Set up environment variables:

```bash
export MAPS_API_KEY=your_google_maps_api_key
```

3. Start the backend:

```bash
npm start
```

4. Start the frontend (in a new terminal):

```bash
cd proxii-frontend && npm run dev
```

5. Open http://localhost:5174/ in your browser

## Deployment

See [DEPLOY.md](DEPLOY.md) for Vercel deployment instructions.

## API Endpoints

- `GET /api/score/:zipcode` - Returns gentrification score and indicators
- `GET /health` - Health check

## Tech Stack

- **Backend**: Node.js + Express (converted to Vercel serverless for production)
- **Frontend**: React + Vite + Tailwind CSS
- **APIs**: Google Maps Geocoding + Places

## Notes

- The app uses a simple JSON cache at `cache.json` to avoid repeated API calls in local development
- Adjust scoring weights in `server.js` (local) or `api/score.js` (production)
- Cache is disabled in production (Vercel serverless functions are stateless)
