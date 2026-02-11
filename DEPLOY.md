# Vercel Deployment Guide

## Prerequisites
- Vercel account ([vercel.com](https://vercel.com))
- Google Maps API key

## Quick Deploy

### 1. Install Vercel CLI (optional)
```bash
npm install -g vercel
```

### 2. Push to GitHub
Make sure all your changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. Deploy via Vercel Dashboard (Recommended)

#### A. Import Project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository `Proxii-1`
3. Vercel will auto-detect the configuration from `vercel.json`

#### B. Configure Environment Variable
1. In the project settings, go to **Environment Variables**
2. Add a new variable:
   - **Name**: `MAPS_API_KEY`
   - **Value**: `AIzaSyCQ2L7zn1uJB4-qF2ceWJv5i9K2FWmr6vk` (or your key)
   - **Environments**: Production, Preview, Development

#### C. Deploy
1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

### 4. Alternative: Deploy via CLI
```bash
# From project root
vercel

# Follow prompts, then add environment variable
vercel env add MAPS_API_KEY
# Paste your API key when prompted

# Deploy to production
vercel --prod
```

## Project Structure (Vercel-Ready)
```
Proxii-1/
├── api/
│   └── score.js          # Serverless API function
├── proxii-frontend/
│   ├── src/
│   ├── dist/             # Build output (generated)
│   └── package.json
├── vercel.json           # Deployment config
└── package.json          # Root dependencies (axios)
```

## How It Works
- **Frontend**: Vite builds static files to `proxii-frontend/dist/`
- **API**: `/api/score/:zipcode` → serverless function at `/api/score.js`
- **Routing**: `vercel.json` rewrites API calls to the serverless function
- **Environment**: `MAPS_API_KEY` injected at runtime

## Testing Locally with Vercel CLI
```bash
# Install dependencies
npm install
cd proxii-frontend && npm install && cd ..

# Start Vercel dev server (simulates production)
vercel dev

# Open http://localhost:3000
```

## Production URLs
After deployment, your app will be available at:
- **Frontend**: `https://your-project.vercel.app`
- **API**: `https://your-project.vercel.app/api/score/94025`

## Troubleshooting

### Build fails
- Check that `proxii-frontend/package.json` has `"build": "vite build"`
- Verify Node version is 18+ in `package.json` engines

### API returns 500
- Verify `MAPS_API_KEY` environment variable is set in Vercel dashboard
- Check function logs in Vercel dashboard under **Deployments** → **Functions**

### CORS errors
- The API function includes CORS headers, should work cross-origin

## Custom Domain (Optional)
1. Go to project **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration steps

## Auto-Deploy on Push
Vercel automatically redeploys when you push to the `main` branch on GitHub.
