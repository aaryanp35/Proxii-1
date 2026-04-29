# PRD: High-Conversion Dynamic Landing Page
**Proxii — Neighborhood Growth Intelligence**
*Status: Draft | Date: 2026-04-27*

---

## Problem

The current home page is a tool interface, not a landing page. First-time visitors land directly on the search gauge with no context, no social proof, and no reason to trust the score before they've seen one. Bounce rate is high because the value proposition is unclear until after a search is performed.

## Goal

Convert the root route into a dynamic landing page that:
1. Hooks the visitor within 3 seconds using personalized or trending data
2. Drives a ZIP code search as the primary CTA (top of funnel)
3. Drives account creation as the secondary CTA (mid-funnel)
4. Works for cold traffic (SEO, ads) and warm traffic (returning users, referrals)

**Primary metric:** ZIP search rate per session
**Secondary metric:** Sign-up conversion from first session

---

## User Segments & Personalization

| Segment | Signal | Dynamic behavior |
|---|---|---|
| **Returning user (logged in)** | Auth cookie | Show "Welcome back, [name]" + their saved ZIPs with updated scores |
| **Returning user (no account)** | localStorage `lastZip` | Pre-fill search with last-searched ZIP, show stale score badge |
| **Geo-targeted visitor** | IP geolocation (client-side via browser API) | Pre-populate search with detected city/region, show local top score |
| **Referred from listing** | `?zip=XXXXX` query param | Auto-run search on load, scroll past hero to results |
| **Cold traffic** | None of the above | Show trending ZIPs section + social proof |

All personalization is client-side. No server-side rendering required. No new APIs beyond what already exists.

---

## Page Structure

### 1. Hero Section (above the fold)
- **Headline:** Dynamically swaps based on segment (see copy matrix below)
- **Subhead:** One sentence on the methodology — ties trust to the score
- **Primary CTA:** Search bar (existing component, promoted to hero)
- **Trust signal:** "X,XXX ZIP codes analyzed" (pull from Supabase `zip_scores` count)

**Copy matrix:**

| Segment | Headline |
|---|---|
| Cold | "Know if a neighborhood is rising — before the prices do." |
| Geo-targeted | "Is [City] worth it right now?" |
| Returning (no account) | "Your last search: [ZIP]. Want to save it?" |
| Returning (logged in) | "Welcome back. Your [N] saved ZIPs have updated." |
| Referred (`?zip=`) | Auto-searches, skips hero text |

---

### 2. Social Proof Rail (below hero)
Static marquee strip, no API calls:
- `"Scored 47 ZIPs before making our offer"` — Real estate investor
- `"Caught a neighborhood before it popped"` — Portfolio manager
- `"The only tool that combines foot traffic + risk"` — Urban analyst

---

### 3. Trending ZIPs (dynamic)
**What:** A 3–6 card grid of recently-scored ZIPs with high engagement (most-searched or highest scores from Supabase cache).
**API:** New lightweight endpoint — `GET /api/score/trending` — returns top 6 ZIPs from `zip_scores` ordered by `score desc, updated_at desc limit 6`. No Maps API calls.
**Card:** ZIP code, area name, score badge, growth/risk label. Clicking auto-runs search.
**Purpose:** Gives cold visitors an immediate "try me" moment without them needing to think of a ZIP.

---

### 4. How It Works (3-step explainer)
Already exists on `/about`. Embed the 3-card grid inline here. No duplication — just reuse the component.

---

### 5. Conversion Bump (mid-page CTA)
Shown only when visitor has searched but is not logged in:
- Sticky mini-bar or inline card: "Save your searches — it's free. Sign in with Google →"
- Dismissible; state stored in sessionStorage

---

### 6. Footer CTA
- "Analyze your ZIP" search bar (repeated)
- Link to `/careers` for organic SEO

---

## Dynamic Behaviors — Implementation Notes

### IP Geolocation
Use `navigator.geolocation` (already granted on most browsers for location-aware sites) or a free reverse-geo API (`https://ipapi.co/json/`) as fallback. Extract ZIP/city name to pre-fill the search input. No Maps API call — only uses the existing `/api/score/:zip` when user submits.

### `?zip=` param auto-search
In `App.jsx`, read `useSearchParams()` on mount. If `?zip=XXXXX` is present, call `handleSearch(zip)` immediately and scroll to results. Useful for sharing links (e.g., "Check out this ZIP: proxii.com/?zip=90210").

### `lastZip` in localStorage
On every successful search, write `localStorage.setItem('lastZip', zipCode)`. On landing page load (no `?zip=`), read it and show a "Continue where you left off" prompt.

### Trending endpoint
```js
// GET /api/score/trending
app.get('/api/score/trending', async (req, res) => {
  const { data } = await supabase
    .from('zip_scores')
    .select('zipcode, area_name, score, category')
    .order('score', { ascending: false })
    .limit(6)
  res.json(data ?? [])
})
```
Zero Maps API cost. Reads only from cache.

---

## Google Maps API Usage — Constraints

**No new Maps API calls on page load.** All landing page data (trending ZIPs, returning user saved ZIPs) must come from the Supabase cache. A search only triggers a Maps call on a full cache miss — same as today.

---

## Out of Scope

- A/B testing framework
- Email capture / waitlist
- Paid ad tracking pixels (can be layered in later)
- Animated map background (too heavy; contradicts Maps API budget)

---

## Acceptance Criteria

- [ ] Page loads < 1.5s on mobile (no new blocking requests)
- [ ] Cold visitor sees trending ZIPs within 500ms (Supabase read)
- [ ] Geo-personalization pre-fills input within 2s (browser geolocation)
- [ ] `?zip=XXXXX` auto-searches and scrolls to results
- [ ] `lastZip` persisted and surfaced on return visits
- [ ] Zero new Maps API calls on page load for any segment
- [ ] Logged-in user sees saved ZIPs with scores on landing
- [ ] Conversion bump bar appears after first search (not logged in)
- [ ] All personalization degrades gracefully (empty state = cold visitor view)
