
import axios from "axios"
import { createClient } from "@supabase/supabase-js"
import { predictScore, ML_BLEND } from "../ml/modelWeights.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const mapsKey = process.env.MAPS_API_KEY
const CACHE_TTL_MS = 12 * 60 * 60 * 1000
const PROXIMITY_THRESHOLD_METERS = Number(process.env.PROXIMITY_THRESHOLD_METERS) || 1500

const incomeByZipcode = {
  "90210": 275000,
  "94301": 265000,
  "94025": 280000,
  "10021": 310000,
  "02116": 220000,
  "60611": 240000,
  "94088": 185000,
  "32963": 175000,
  "28202": 165000,
  "77019": 195000,
  "98009": 180000,
  "33139": 170000,
  "39113": 28000,
}

function getMedianHouseholdIncome(zipcode) {
  return incomeByZipcode[zipcode] || null
}

// placeTypes: uses Google Places API (New) — one call, field-masked, 1500m radius
// keywords:   fallback to legacy Nearby Search — multiple calls, 3000m radius
const weights = {
  positive: [
    // Tier 1: Premium
    { label: "Upscale Shopping Districts",   placeTypes: ["shopping_mall"],                              keywords: ["luxury mall", "upscale shopping", "designer stores", "boutique shopping"], weight: 4.5, tier: "premium" },
    { label: "Fine Dining Restaurants",      placeTypes: ["fine_dining_restaurant"],                     keywords: ["fine dining", "michelin star", "upscale restaurant"],                    weight: 4.2, tier: "premium" },
    { label: "Whole Foods/Organic Markets",                                                              keywords: ["whole foods", "organic grocery", "natural foods", "farm to table"],     weight: 3.8, tier: "premium" },
    { label: "Specialty Coffee Shops",       placeTypes: ["coffee_shop"],                               keywords: ["specialty coffee", "third wave coffee", "artisan coffee", "craft coffee"], weight: 3.5, tier: "premium" },
    { label: "Premium Fitness Centers",      placeTypes: ["gym"],                                        keywords: ["boutique gym", "luxury fitness", "high-end gym", "upscale gym"],        weight: 3.2, tier: "premium" },
    { label: "Yoga & Wellness Studios",      placeTypes: ["yoga_studio"],                               keywords: ["yoga studio", "pilates studio", "wellness center", "holistic health"],   weight: 3.0, tier: "premium" },
    { label: "Wine & Spirits Bars",          placeTypes: ["bar"],                                        keywords: ["wine bar", "craft cocktails", "upscale bar", "wine lounge"],            weight: 2.8, tier: "premium" },
    { label: "Art Galleries",               placeTypes: ["art_gallery"],                               keywords: ["art gallery", "contemporary art", "art museum"],                         weight: 2.6, tier: "premium" },
    { label: "Artisan Bakeries",             placeTypes: ["bakery"],                                     keywords: ["bakery", "artisan bakery", "organic bakery", "craft bakery"],           weight: 2.5, tier: "premium" },
    { label: "Trendy Brunch Spots",          placeTypes: ["cafe", "brunch_restaurant"],                  keywords: ["brunch", "cafe", "bistro"],                                             weight: 2.3, tier: "premium" },

    // Tier 2: Strong
    { label: "Tech Companies & Startups",                                                               keywords: ["tech company", "startup", "tech office", "software company"],           weight: 2.8, tier: "strong" },
    { label: "Universities & Colleges",      placeTypes: ["university"],                                 keywords: ["university", "college", "educational institution"],                    weight: 2.7, tier: "strong" },
    { label: "Public Libraries",             placeTypes: ["library"],                                    keywords: ["library", "public library"],                                            weight: 2.5, tier: "strong" },
    { label: "Parks & Recreation",           placeTypes: ["park", "recreation_center"],                  keywords: ["public park", "nature park", "recreation center", "sports complex"],   weight: 2.4, tier: "strong" },
    { label: "Bookstores",                   placeTypes: ["book_store"],                                 keywords: ["bookstore", "independent bookstore"],                                   weight: 2.2, tier: "strong" },
    { label: "Music Venues",                 placeTypes: ["event_venue"],                               keywords: ["music venue", "concert hall", "live music"],                            weight: 2.0, tier: "strong" },
    { label: "Theaters & Performing Arts",   placeTypes: ["performing_arts_theater"],                   keywords: ["theater", "theatre", "performing arts", "concert venue"],               weight: 2.1, tier: "strong" },
    { label: "Farmers Markets",              placeTypes: ["farmer_market"],                             keywords: ["farmers market", "produce market"],                                     weight: 2.0, tier: "strong" },
    { label: "Health & Medical Centers",     placeTypes: ["hospital", "medical_clinic"],                keywords: ["medical center", "health clinic", "hospital", "healthcare facility"],   weight: 1.9, tier: "strong" },
    { label: "Plant-Based Restaurants",      placeTypes: ["vegan_restaurant", "vegetarian_restaurant"], keywords: ["vegan restaurant", "vegetarian restaurant", "plant-based"],             weight: 1.8, tier: "strong" },

    // Tier 3: Moderate
    { label: "Craft Breweries",              placeTypes: ["brewery"],                                   keywords: ["brewery", "craft brewery", "microbrewery"],                             weight: 1.7, tier: "moderate" },
    { label: "Independent Restaurants",      placeTypes: ["restaurant"],                                keywords: ["independent restaurant", "local restaurant"],                           weight: 1.6, tier: "moderate" },
    { label: "Design & Architecture",                                                                   keywords: ["design studio", "architecture firm"],                                   weight: 1.5, tier: "moderate" },
    { label: "Community Centers",            placeTypes: ["community_center"],                          keywords: ["community center", "community hub"],                                    weight: 1.5, tier: "moderate" },
    { label: "Florists & Garden Centers",    placeTypes: ["florist", "garden_center"],                  keywords: ["florist", "garden center", "nursery"],                                  weight: 1.4, tier: "moderate" },
    { label: "Pet Friendly Venues",          placeTypes: ["dog_park", "pet_store"],                     keywords: ["dog park", "pet friendly", "pet cafe"],                                 weight: 1.3, tier: "moderate" },
    { label: "Networking Spaces",            placeTypes: ["coworking_space"],                           keywords: ["coworking", "coworking space", "business center"],                      weight: 1.3, tier: "moderate" },
    { label: "Bookbinding & Stationery",                                                               keywords: ["stationery", "printing", "bookbinding"],                                weight: 1.2, tier: "moderate" },
  ],

  negative: [
    // Tier 1: Critical — "check cashing" removed from Pawn & Liquor (was duplicated from Predatory Lending)
    { label: "Predatory Lending",                keywords: ["payday loan", "title loan", "check cashing"],                      weight: -6.0, tier: "critical" },
    { label: "Pawn & Liquor Shops",  placeTypes: ["pawn_shop", "liquor_store"],  keywords: ["pawn shop", "liquor store"],      weight: -5.5, tier: "critical" },
    { label: "Substance Abuse Services",         keywords: ["drug treatment", "rehab center", "addiction center"],             weight: -5.0, tier: "critical" },

    // Tier 2: Strong
    { label: "Fast Food Chains",     placeTypes: ["fast_food_restaurant"],       keywords: ["fast food", "burger", "fried chicken", "pizza chain"], weight: -3.5, tier: "strong" },
    { label: "Industrial & Warehouses",          keywords: ["industrial", "warehouse", "distribution center", "manufacturing"], weight: -3.2, tier: "strong" },
    { label: "Auto Repair & Body Shops", placeTypes: ["car_repair"],             keywords: ["auto repair", "body shop", "mechanic"],                weight: -2.8, tier: "strong" },
    { label: "Used Car Lots",        placeTypes: ["car_dealer"],                 keywords: ["used car", "car dealership"],                           weight: -2.5, tier: "strong" },
    { label: "Gas Stations & Convenience Stores", placeTypes: ["gas_station", "convenience_store"], keywords: ["gas station", "convenience store", "petrol station"], weight: -2.0, tier: "strong" },
    { label: "Discount Retail Chains",           keywords: ["discount store", "dollar store", "discount retail"],              weight: -1.8, tier: "strong" },

    // Tier 3: Moderate
    { label: "Laundromats",          placeTypes: ["laundry"],                    keywords: ["laundromat", "dry cleaning"],                           weight: -1.5, tier: "moderate" },
    { label: "Telecommunications Nodes",         keywords: ["cell tower", "telecom", "internet cafe"],                        weight: -1.2, tier: "moderate" },
    { label: "Tobacco Shops",                    keywords: ["tobacco", "vape shop"],                                          weight: -1.0, tier: "moderate" },
    { label: "Parking Lots",         placeTypes: ["parking"],                    keywords: ["parking lot", "parking garage"],                        weight: -0.8, tier: "moderate" },
  ]
}

// ================= NORMALIZATION ENGINE =====================

function logisticNormalize(x, mid = 35, scale = 18) {
  return 100 / (1 + Math.exp(-(x - mid) / scale))
}

function densityBonus(totalPlaces) {
  return Math.log1p(totalPlaces) * 0.8
}

function incomeAdjustment(medianIncome) {
  if (!medianIncome) return 0
  if (medianIncome >= 250000) return 10
  if (medianIncome >= 200000) return 8
  if (medianIncome >= 150000) return 6
  if (medianIncome >= 100000) return 4
  if (medianIncome >= 70000)  return 2
  if (medianIncome >= 45000)  return -1
  return -4
}

function normalizeScoreWithCategory(rawScore, medianIncome, totalPlaces) {
  let adjusted = rawScore + densityBonus(totalPlaces) + incomeAdjustment(medianIncome)
  let finalScore = Math.max(0, Math.min(100, Math.round(logisticNormalize(adjusted))))

  let category = "Under-invested"
  if      (finalScore >= 90) category = "Global Elite"
  else if (finalScore >= 80) category = "Prime"
  else if (finalScore >= 60) category = "Strong"
  else if (finalScore >= 40) category = "Developing"
  else if (finalScore >= 25) category = "Struggling"

  return { score: finalScore, category }
}

// ================= PLACES API LAYER =====================

// New Places API (v1): field-masked, 1500m radius, one call per indicator
async function placesSearchByType({ lat, lng }, includedTypes) {
  const response = await axios.post(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      includedTypes,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: 1500 }
      },
      maxResultCount: 20
    },
    {
      headers: {
        'X-Goog-Api-Key': mapsKey,
        'X-Goog-FieldMask': 'places.id,places.location,places.displayName'
      }
    }
  )
  return (response.data.places || []).map(p => ({
    id: p.id,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    name: p.displayName?.text || 'Unknown'
  }))
}

// Legacy Nearby Search: keyword-based fallback, 3000m radius
async function placesSearchByKeyword({ lat, lng }, keyword) {
  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
    {
      params: { location: `${lat},${lng}`, radius: 3000, keyword, key: mapsKey }
    }
  )
  return (response.data.results || []).map(p => ({
    id: p.place_id,
    lat: p.geometry?.location?.lat,
    lng: p.geometry?.location?.lng,
    name: p.display_name || p.name || 'Unknown'
  }))
}

async function geocodeZip(zipcode) {
  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    { params: { address: zipcode, key: mapsKey } }
  )
  if (!response.data.results?.length) throw new Error("Zip code not found.")

  const result = response.data.results[0]
  const { lat, lng } = result.geometry.location
  const components = result.address_components || []

  const city  = components.find(c => c.types.includes('locality'))
  const admin = components.find(c => c.types.includes('administrative_area_level_1'))
  const areaName = city?.long_name || admin?.long_name || result.formatted_address

  return { lat, lng, areaName }
}

// ================= UTILITY =====================

function calculateWeight(distanceMeters) {
  if (distanceMeters <= 500)  return 1.0
  if (distanceMeters <= 1500) return 0.5
  return 0.1
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getLogarithmicValue(count) {
  if (count <= 0) return 0
  return Math.log2(count + 1)
}

// Simple concurrency limiter — no external dependency required
function createLimiter(concurrency) {
  let active = 0
  const queue = []
  return function limit(fn) {
    return new Promise((resolve, reject) => {
      const run = async () => {
        active++
        try { resolve(await fn()) } catch (e) { reject(e) }
        finally {
          active--
          if (queue.length) queue.shift()()
        }
      }
      active < concurrency ? run() : queue.push(run)
    })
  }
}

function buildWeightedIndicators() {
  return [...weights.positive, ...weights.negative].map(item => ({
    label:      item.label,
    placeTypes: item.placeTypes || null,
    keywords:   item.keywords,
    weight:     item.weight,
    tier:       item.tier || "standard"
  }))
}

// ================= SCORING ENGINE =====================

const ANCHOR_KEYWORDS   = ["whole foods", "erewhon", "apple store", "trader joe"]
const CULTURAL_PIONEERS = ["art gallery", "yoga studio", "architecture firm", "contemporary art", "artist studio"]

async function scoreZipcode(zipcode) {
  const geocoded = await geocodeZip(zipcode)
  const center = { lat: geocoded.lat, lng: geocoded.lng }
  const indicators = buildWeightedIndicators()
  const limit = createLimiter(5)

  // Phase 3: all indicators run in parallel, capped at 5 concurrent Google API calls
  const indicatorResults = await Promise.all(
    indicators.map(indicator => limit(async () => {
      const localSeen = new Set()
      const places = []

      // Phase 2: prefer new Places API (typed, field-masked) over legacy keyword search
      let rawPlaces = []
      if (indicator.placeTypes?.length) {
        rawPlaces = await placesSearchByType(center, indicator.placeTypes)
      } else {
        const batches = await Promise.all(
          indicator.keywords.map(k => placesSearchByKeyword(center, k))
        )
        rawPlaces = batches.flat()
      }

      // Phase 1 fix: pioneer flag computed once per indicator, not per (place × keyword)
      const isIndicatorPioneer = indicator.keywords.some(k =>
        CULTURAL_PIONEERS.some(p => k.toLowerCase().includes(p))
      )

      let anchorFound = false
      let pioneerCount = 0

      for (const place of rawPlaces) {
        if (!place.id || localSeen.has(place.id)) continue
        localSeen.add(place.id)

        let distance = Infinity
        let distanceWeight = 0.1
        if (place.lat != null && place.lng != null) {
          distance = haversineDistance(center.lat, center.lng, place.lat, place.lng)
          distanceWeight = calculateWeight(distance)
        }

        places.push({ name: place.name, distance, distanceWeight })

        if (!anchorFound && distance <= 1000) {
          const n = place.name.toLowerCase()
          if (ANCHOR_KEYWORDS.some(a => n.includes(a))) anchorFound = true
        }

        // Phase 1 fix: +20 once per place, not once per keyword×place
        if (isIndicatorPioneer) pioneerCount++
      }

      let score = 0
      if (places.length > 0) {
        let baseScore = 0
        for (const p of places) baseScore += indicator.weight * p.distanceWeight
        const logMult = getLogarithmicValue(places.length)
        score = baseScore * (logMult / places.length)
      }

      return { indicator, places, placeIds: localSeen, score, anchorFound, pioneerCount }
    }))
  )

  // Merge all indicator results
  const allPlaceIds = new Set()
  const indicatorHits = []
  let growthScore = 0
  let riskScore = 0
  let hasAnchor = false
  let culturalPioneerScore = 0

  for (const r of indicatorResults) {
    if (r.anchorFound) hasAnchor = true
    culturalPioneerScore += r.pioneerCount * 20
    for (const id of r.placeIds) allPlaceIds.add(id)

    if (r.places.length > 0) {
      if (r.indicator.weight > 0) growthScore += r.score
      else riskScore += r.score

      indicatorHits.push({
        label:  r.indicator.label,
        count:  r.places.length,
        weight: r.indicator.weight,
        score:  Math.round(r.score * 100) / 100,
        tier:   r.indicator.tier
      })
    }
  }

  // Apply anchor multiplier if present
  const anchorMultiplier = hasAnchor ? 1.2 : 1.0;
  const adjustedGrowthScore = growthScore * anchorMultiplier + culturalPioneerScore;

  // REFACTORED: Hard penalties for risk factors
  // Risk factors (negative scores) now apply as hard penalties with 1.3x multiplier
  // This ensures a single major risk factor significantly impacts the final score
  const hardPenaltyMultiplier = 1.3;
  const penalizedScore = adjustedGrowthScore + (riskScore * hardPenaltyMultiplier);
  
  // Combined score with penalty floor to prevent unbounded negatives
  const rawScore = Math.max(-50, penalizedScore);

  // Income adjustment layer
  const medianIncome = getMedianHouseholdIncome(zipcode);
  const totalPlaces = seenPlaceIds.size;
  
  const { score: ruleScore } = normalizeScoreWithCategory(rawScore, medianIncome, totalPlaces);

  // ML scoring: Ridge Regression on indicator category counts.
  // driversCount/risksCount = how many distinct positive/negative categories fired.
  const driversCount = indicatorHits.filter((i) => i.weight > 0).length;
  const risksCount = indicatorHits.filter((i) => i.weight < 0).length;
  const mlScore = predictScore(driversCount, risksCount);

  // Blend: ML corrects the rule-based score without overriding it.
  // ML_BLEND starts at 0.4 and should increase as training data grows.
  const blendedScore = Math.max(0, Math.min(100, Math.round(ML_BLEND * mlScore + (1 - ML_BLEND) * ruleScore)));

  // Re-derive category from the blended score so labels stay consistent.
  let category = "Under-invested";
  if (blendedScore >= 90) category = "Global Elite";
  else if (blendedScore >= 80) category = "Prime";
  else if (blendedScore >= 60) category = "Strong";
  else if (blendedScore >= 40) category = "Developing";
  else if (blendedScore >= 25) category = "Struggling";

  return {
    zipcode,
    areaName: geocoded.areaName,
    center,
    score: blendedScore,
    category,
    mlScore,
    ruleScore,
    medianIncome,
    rawScore:            Math.round(rawScore * 100) / 100,
    growthScore:         Math.round(adjustedGrowthScore * 100) / 100,
    riskScore:           Math.round(riskScore * 100) / 100,
    hasAnchor,
    culturalPioneerScore: Math.round(culturalPioneerScore * 100) / 100,
    businessDensity:     totalPlaces,
    indicators:          indicatorHits.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)),
    drivers:             indicatorHits.filter(i => i.weight > 0).sort((a, b) => b.score - a.score).map(i => ({ label: i.label, count: i.count, score: i.score })),
    risks:               indicatorHits.filter(i => i.weight < 0).sort((a, b) => a.score - b.score).map(i => ({ label: i.label, count: i.count, score: i.score }))
  }
}

// ================= SUPABASE CACHE LAYER =====================

async function findExactCacheHit(zipcode) {
  const { data, error } = await supabase
    .from("zip_scores")
    .select("full_payload")
    .eq("zipcode", zipcode)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()
  if (error) { console.error("findExactCacheHit:", error); return null }
  return data ? data.full_payload : null
}

async function findProximityCacheHit(lat, lng, thresholdM) {
  const latDelta = thresholdM / 111320
  const lngDelta = thresholdM / (111320 * Math.cos(lat * Math.PI / 180))
  const { data, error } = await supabase
    .from("zip_scores")
    .select("zipcode, center_lat, center_lng, full_payload")
    .gt("expires_at", new Date().toISOString())
    .gte("center_lat", lat - latDelta).lte("center_lat", lat + latDelta)
    .gte("center_lng", lng - lngDelta).lte("center_lng", lng + lngDelta)
  if (error || !data?.length) return null

  let best = null, bestDist = Infinity
  for (const row of data) {
    const dist = haversineDistance(lat, lng, row.center_lat, row.center_lng)
    if (dist < thresholdM && dist < bestDist) {
      bestDist = dist
      best = { payload: row.full_payload, distance_m: dist, resolved_zip: row.zipcode }
    }
  }
  return best
}

async function storeCachedScore(data) {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString()
  const { data: inserted, error } = await supabase
    .from("zip_scores")
    .upsert({
      zipcode: data.zipcode, area_name: data.areaName,
      center_lat: data.center.lat, center_lng: data.center.lng,
      score: data.score, category: data.category,
      raw_score: data.rawScore, growth_score: data.growthScore,
      risk_score: data.riskScore, business_density: data.businessDensity,
      median_income: data.medianIncome, has_anchor: data.hasAnchor,
      full_payload: data, expires_at: expiresAt
    }, { onConflict: "zipcode" })
    .select("id").single()
  if (error || !inserted) { console.error("storeCachedScore:", error); return }

  const labels = (data.indicators || []).map(i => i.label)
  if (!labels.length) return
  const { data: indRows } = await supabase.from("indicators").select("id, label").in("label", labels)
  if (!indRows) return
  const labelToId = Object.fromEntries(indRows.map(r => [r.label, r.id]))
  const rows = data.indicators
    .filter(h => labelToId[h.label])
    .map(h => ({ zip_score_id: inserted.id, indicator_id: labelToId[h.label], hit_count: h.count, hit_score: h.score }))
  if (rows.length) {
    await supabase.from("zip_indicator_hits").upsert(rows, { onConflict: "zip_score_id,indicator_id" })
  }
}

function logRequest({ requested_zip, resolved_zip = null, cache_type, distance_m = null, model_called = false, response_ms }) {
  supabase.from("score_request_logs")
    .insert({ requested_zip, resolved_zip, cache_type, distance_m, model_called, response_ms })
    .then(({ error }) => { if (error) console.error("logRequest:", error) })
}

// ================= HANDLER =====================

export default async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()

  const zipcode = String(req.query.zipcode || "").trim().toUpperCase()
  const t0 = Date.now()

  if (!mapsKey) return res.status(500).json({ error: "Maps API key not configured." })

  const postalCodeRegex = /^([0-9]{5}|[A-Z]\d[A-Z]\s?\d[A-Z]\d|[0-9]{4,6}|[A-Z]{1,2}\d{1,2}[A-Z\d]?\s?\d[A-Z]{2})$/
  if (!postalCodeRegex.test(zipcode)) {
    return res.status(400).json({ error: "Invalid postal code format. Supports US, Canada, and Europe." })
  }

  try {
    const exact = await findExactCacheHit(zipcode)
    if (exact) {
      logRequest({ requested_zip: zipcode, resolved_zip: zipcode, cache_type: "exact", response_ms: Date.now() - t0 })
      return res.status(200).json({ ...exact, cached: true, cache_type: "exact" })
    }

    const geo = await geocodeZip(zipcode)

    const prox = await findProximityCacheHit(geo.lat, geo.lng, PROXIMITY_THRESHOLD_METERS)
    if (prox) {
      logRequest({ requested_zip: zipcode, resolved_zip: prox.resolved_zip, cache_type: "proximity", distance_m: prox.distance_m, response_ms: Date.now() - t0 })
      return res.status(200).json({ ...prox.payload, cached: true, cache_type: "proximity", resolved_from: prox.resolved_zip, distance_m: Math.round(prox.distance_m) })
    }

    const data = await scoreZipcode(zipcode)
    storeCachedScore(data)
    logRequest({ requested_zip: zipcode, resolved_zip: zipcode, cache_type: "miss", model_called: true, response_ms: Date.now() - t0 })
    return res.status(200).json({ ...data, cached: false, cache_type: "miss" })

  } catch (error) {
    console.error("Score API error:", error.message, error.response?.data)
    return res.status(500).json({
      error: error.message || "Unable to score zip code.",
      details: error.response?.data?.error_message || error.response?.data?.status
    })
  }
}
