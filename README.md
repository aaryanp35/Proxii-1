# Alt-Real Estate Value Index (Zip-Based)

Quick start

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` or export the Maps API key:

```bash
export MAPS_API_KEY=your_google_maps_api_key
```

3. Start the server:

```bash
npm start
```

4. Health check:

```bash
curl http://localhost:3000/health
```

5. Score endpoint:

```bash
GET /api/score/:zipcode
```

Notes:
- The app uses a simple JSON cache at `cache.json` to avoid repeated API calls.
- Adjust weights in `server.js`.
