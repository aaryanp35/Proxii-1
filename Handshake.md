# Blueprint: Full-Stack Handshake (Integration)
# Target: Connect Logic (A) to UI Components (B)

## 1. Context
- **Backend:** I have a functional scoring engine in `lib/google-maps.ts` and an API route in `app/api/score/route.ts`.
- **Frontend:** I have a Dashboard UI in `components/Dashboard.tsx` with a Search Bar, Gauge, and Bento Grid lists.

## 2. Integration Tasks (Agent Instructions)
1. **State Management:** Implement `useState` in the Dashboard to track:
    - `zipCode` (string)
    - `data` (The API response object)
    - `status` ('idle', 'loading', 'success', 'error')
2. **The Fetch Hook:** Create an `async handleSearch` function. 
    - It must call `fetch('/api/score?zip=' + zipCode)`.
    - It must trigger the "Loading" state in the UI (e.g., make the gauge pulse).
3. **Data Mapping:**
    - Map `data.score` to the Gauge's value prop.
    - Map `data.drivers` (array) to the "Growth Drivers" list component.
    - Map `data.risks` (array) to the "Risk Indicators" list component.
4. **Dynamic Styling:** - The Gauge color should dynamically switch classes: `text-emerald-400` (score > 70), `text-amber-400` (40-70), or `text-rose-400` (< 40).

## 3. Success Criteria
- When I enter "90210" and hit Search, the UI must reflect real data from the Google Maps API.
- No "Smoke Check" errors (no CORS issues, no undefined mapping errors).