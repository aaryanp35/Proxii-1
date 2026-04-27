import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const mapsKey = process.env.MAPS_API_KEY;

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const PROXIMITY_THRESHOLD_METERS = Number(process.env.PROXIMITY_THRESHOLD_METERS) || 1500;

// Median Household Income by Zipcode
const incomeByZipcode = {
  // Ultra-Wealthy (>$200k)
  "90210": 275000, // Beverly Hills, CA
  "94301": 265000, // Palo Alto, CA
  "94025": 280000, // Menlo Park, CA
  "10021": 310000, // Upper East Side, NYC
  "02116": 220000, // Beacon Hill, Boston
  "60611": 240000, // Chicago Gold Coast
  
  // Very Wealthy ($150k-$200k)
  "94088": 185000, // Sunnyvale/Mountain View area
  "32963": 175000, // Vero Beach, FL
  "28202": 165000, // Charlotte, NC (Uptown)
  "77019": 195000, // Houston (Upscale area)
  "98009": 180000, // Bellevue, WA
  "33139": 170000, // Coral Gables, FL
  
  // Rural/Underinvested
  "39113": 28000,  // Rural Mississippi
};

function getMedianHouseholdIncome(zipcode) {
  return incomeByZipcode[zipcode] || null;
}

if (!mapsKey) {
  console.warn("Missing MAPS_API_KEY env var.");
}

const weights = {
  positive: [
    { label: "Specialty Coffee", keywords: ["specialty coffee", "third wave coffee"], weight: 2.5 },
    { label: "Whole Foods/Organic Grocers", keywords: ["whole foods", "organic grocery", "natural foods"], weight: 3.5 },
    { label: "Pilates/Yoga", keywords: ["pilates", "yoga studio"], weight: 1.8 },
    { label: "Boutique Gyms", keywords: ["boutique gym", "fitness studio", "spin studio"], weight: 1.5 },
    { label: "Wine Bars", keywords: ["wine bar"], weight: 1.2 }
  ],
  negative: [
    { label: "Payday Loans", keywords: ["payday loan"], weight: -5 },
    { label: "Pawn Shops", keywords: ["pawn shop"], weight: -4 },
    { label: "Fast Food Chains", keywords: ["fast food", "burger", "fried chicken"], weight: -1.5 },
    { label: "Industrial Zones", keywords: ["industrial", "warehouse", "distribution"], weight: -2.5 }
  ]
};

// ================= SUPABASE CACHE LAYER =====================

async function findExactCacheHit(zipcode) {
  const { data, error } = await supabase
    .from("zip_scores")
    .select("full_payload")
    .eq("zipcode", zipcode)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) { console.error("findExactCacheHit:", error); return null; }
  return data ? data.full_payload : null;
}

async function findProximityCacheHit(lat, lng, thresholdM) {
  const latDelta = thresholdM / 111320;
  const lngDelta = thresholdM / (111320 * Math.cos(lat * Math.PI / 180));
  const { data, error } = await supabase
    .from("zip_scores")
    .select("zipcode, center_lat, center_lng, full_payload")
    .gt("expires_at", new Date().toISOString())
    .gte("center_lat", lat - latDelta).lte("center_lat", lat + latDelta)
    .gte("center_lng", lng - lngDelta).lte("center_lng", lng + lngDelta);
  if (error || !data?.length) return null;
  let best = null, bestDist = Infinity;
  for (const row of data) {
    const dist = haversineDistance(lat, lng, row.center_lat, row.center_lng);
    if (dist < thresholdM && dist < bestDist) {
      bestDist = dist;
      best = { payload: row.full_payload, distance_m: dist, resolved_zip: row.zipcode };
    }
  }
  return best;
}

async function storeCachedScore(data) {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
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
    .select("id").single();
  if (error || !inserted) { console.error("storeCachedScore:", error); return; }
  const labels = (data.indicators || []).map(i => i.label);
  if (!labels.length) return;
  const { data: indRows } = await supabase.from("indicators").select("id, label").in("label", labels);
  if (!indRows) return;
  const labelToId = Object.fromEntries(indRows.map(r => [r.label, r.id]));
  const rows = data.indicators
    .filter(h => labelToId[h.label])
    .map(h => ({ zip_score_id: inserted.id, indicator_id: labelToId[h.label], hit_count: h.count, hit_score: h.score }));
  if (rows.length) {
    await supabase.from("zip_indicator_hits").upsert(rows, { onConflict: "zip_score_id,indicator_id" });
  }
}

function logRequest({ requested_zip, resolved_zip = null, cache_type, distance_m = null, model_called = false, response_ms }) {
  supabase.from("score_request_logs")
    .insert({ requested_zip, resolved_zip, cache_type, distance_m, model_called, response_ms })
    .then(({ error }) => { if (error) console.error("logRequest:", error); });
}

// ================= NORMALIZATION ENGINE =====================

function logisticNormalize(x, mid = 35, scale = 18) {
  return 100 / (1 + Math.exp(-(x - mid) / scale));
}

function densityBonus(totalPlaces) {
  // Significantly reduced multiplier to 0.8 to prevent poor areas from scoring high
  return Math.log1p(totalPlaces) * 0.8;
}

function incomeAdjustment(medianIncome) {
  if (!medianIncome) return 0;

  // Capped at +10 max to prevent excessive bonuses
  if (medianIncome >= 250000) return 10;
  if (medianIncome >= 200000) return 8;
  if (medianIncome >= 150000) return 6;
  if (medianIncome >= 100000) return 4;
  if (medianIncome >= 70000) return 2;
  if (medianIncome >= 45000) return -1;

  return -4;
}

function normalizeScoreWithCategory(rawScore, medianIncome, totalPlaces) {
  // Apply adjustments to raw score BEFORE normalization
  let adjustedRawScore = rawScore;
  adjustedRawScore += densityBonus(totalPlaces);
  adjustedRawScore += incomeAdjustment(medianIncome);

  // Now normalize the adjusted score
  let finalScore = Math.max(0, Math.min(100, Math.round(logisticNormalize(adjustedRawScore))));

  let category = "Under-invested";

  if (finalScore >= 90) category = "Global Elite";
  else if (finalScore >= 80) category = "Prime";
  else if (finalScore >= 60) category = "Strong";
  else if (finalScore >= 40) category = "Developing";
  else if (finalScore >= 25) category = "Struggling";

  return {
    score: finalScore,
    category
  };
}

async function geocodeZip(zipcode) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  const canadaRegex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
  const usRegex = /^[0-9]{5}$/;

  const params = { key: mapsKey };
  if (usRegex.test(zipcode)) {
    params.components = `postal_code:${zipcode}|country:US`;
  } else if (canadaRegex.test(zipcode)) {
    params.components = `postal_code:${zipcode}|country:CA`;
  } else {
    params.address = zipcode;
  }

  const response = await axios.get(url, { params });

  if (!response.data.results || response.data.results.length === 0) {
    throw new Error("Zip code not found.");
  }

  const result = response.data.results[0];
  const location = result.geometry.location;
  const addressComponents = result.address_components || [];
  
  let areaName = result.formatted_address;
  const cityComponent = addressComponents.find(c => c.types.includes('locality'));
  const adminArea = addressComponents.find(c => c.types.includes('administrative_area_level_1'));
  
  if (cityComponent) {
    areaName = cityComponent.long_name;
  } else if (adminArea) {
    areaName = adminArea.long_name;
  }

  return {
    lat: location.lat,
    lng: location.lng,
    areaName
  };
}

async function placesSearchByKeyword({ lat, lng }, keyword) {
  const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
  const response = await axios.get(url, {
    params: {
      location: `${lat},${lng}`,
      radius: 3000,
      keyword,
      fields: "places.displayName,places.types,places.id,places.geometry",
      key: mapsKey
    }
  });

  return response.data.results || [];
}

// Distance decay function
function calculateWeight(distanceMeters) {
  if (distanceMeters <= 500) return 1.0;
  if (distanceMeters <= 1500) return 0.5;
  return 0.1;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getDiminishingValue(count) {
  if (count === 1) return 1.0;
  if (count === 2) return 0.33;
  return 0.13;
}

function buildWeightedIndicators() {
  return [...weights.positive, ...weights.negative].map((item) => ({
    label: item.label,
    keywords: item.keywords,
    weight: item.weight
  }));
}

// ================= SCORING ENGINE =====================

async function scoreZipcode(zipcode) {
  const center = await geocodeZip(zipcode);
  const indicators = buildWeightedIndicators();
  const seenPlaceIds = new Set();
  const indicatorHits = [];

  let growthScore = 0;
  let riskScore = 0;

  const anchorKeywords = ["whole foods", "erewhon", "apple store", "trader joe", "lulu", "tesla"];
  let hasAnchor = false;

  for (const indicator of indicators) {
    const placesForIndicator = [];

    for (const keyword of indicator.keywords) {
      const results = await placesSearchByKeyword(center, keyword);

      for (const place of results) {
        if (!place.place_id || seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);

        let distance = Infinity;
        let distanceWeight = 0.15;

        if (place.geometry?.location) {
          distance = haversineDistance(
            center.lat,
            center.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );
          distanceWeight = calculateWeight(distance);
        }

        const nameStr = (place.display_name || place.name || "").toLowerCase();

        for (const anchor of anchorKeywords) {
          if (nameStr.includes(anchor)) {
            hasAnchor = true;
          }
        }

        placesForIndicator.push({ distanceWeight });
      }
    }

    let score = 0;

    for (let i = 0; i < placesForIndicator.length; i++) {
      const diminishing = getDiminishingValue(i + 1);
      score += indicator.weight * placesForIndicator[i].distanceWeight * diminishing;
    }

    if (indicator.weight > 0) growthScore += score;
    else riskScore += score;

    // Track for drivers/risks output
    if (placesForIndicator.length > 0) {
      indicatorHits.push({
        label: indicator.label,
        count: placesForIndicator.length,
        weight: indicator.weight,
        score: Math.round(score * 100) / 100
      });
    }
  }

  if (hasAnchor) growthScore *= 1.15;

  const rawScore = growthScore + riskScore;

  const medianIncome = getMedianHouseholdIncome(zipcode);
  const totalPlaces = seenPlaceIds.size;

  const { score, category } = normalizeScoreWithCategory(
    rawScore,
    medianIncome,
    totalPlaces
  );

  return {
    zipcode,
    areaName: center.areaName,
    center,
    score,
    category,
    rawScore: Math.round(rawScore * 100) / 100,
    growthScore: Math.round(growthScore * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
    businessDensity: totalPlaces,
    medianIncome,
    hasAnchor,
    indicators: indicatorHits.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)),
    drivers: indicatorHits
      .filter((item) => item.weight > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => ({ label: item.label, count: item.count, score: item.score })),
    risks: indicatorHits
      .filter((item) => item.weight < 0)
      .sort((a, b) => a.score - b.score)
      .map((item) => ({ label: item.label, count: item.count, score: item.score }))
  };
}

app.get("/api/score/logs/summary", async (req, res) => {
  try {
    const { data, error } = await supabase.from("score_request_logs").select("cache_type, response_ms");
    if (error) throw error;
    const total = data.length;
    const counts = { exact: 0, proximity: 0, miss: 0 };
    const ms = { exact: 0, proximity: 0, miss: 0 };
    for (const r of data) {
      counts[r.cache_type] = (counts[r.cache_type] || 0) + 1;
      if (r.response_ms) ms[r.cache_type] = (ms[r.cache_type] || 0) + r.response_ms;
    }
    const hits = counts.exact + counts.proximity;
    res.json({
      total_requests: total,
      by_cache_type: counts,
      hit_rate_pct: total > 0 ? parseFloat(((hits / total) * 100).toFixed(1)) : 0,
      avg_response_ms_by_type: {
        exact:     counts.exact     ? Math.round(ms.exact     / counts.exact)     : null,
        proximity: counts.proximity ? Math.round(ms.proximity / counts.proximity) : null,
        miss:      counts.miss      ? Math.round(ms.miss      / counts.miss)      : null,
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Unable to fetch log summary." });
  }
});

app.get("/api/score/:zipcode", async (req, res) => {
  const zipcode = String(req.params.zipcode || "").trim().toUpperCase();
  const t0 = Date.now();

  if (!mapsKey) {
    return res.status(500).json({ error: "Maps API key not configured. Set MAPS_API_KEY in environment." });
  }

  const postalCodeRegex = /^([0-9]{5}|[A-Z]\d[A-Z]\s?\d[A-Z]\d|[0-9]{4,6}|[A-Z]{1,2}\d{1,2}[A-Z\d]?\s?\d[A-Z]{2})$/;
  if (!postalCodeRegex.test(zipcode)) {
    return res.status(400).json({ error: "Invalid postal code format. Supports US, Canada, and common European formats." });
  }

  try {
    // 1. Exact cache hit
    const exact = await findExactCacheHit(zipcode);
    if (exact) {
      logRequest({ requested_zip: zipcode, resolved_zip: zipcode, cache_type: "exact", response_ms: Date.now() - t0 });
      return res.json({ ...exact, cached: true, cache_type: "exact" });
    }

    // 2. Geocode (needed for proximity check and full miss)
    const geo = await geocodeZip(zipcode);

    // 3. Proximity cache hit
    const prox = await findProximityCacheHit(geo.lat, geo.lng, PROXIMITY_THRESHOLD_METERS);
    if (prox) {
      logRequest({ requested_zip: zipcode, resolved_zip: prox.resolved_zip, cache_type: "proximity",
                   distance_m: prox.distance_m, response_ms: Date.now() - t0 });
      return res.json({ ...prox.payload, cached: true, cache_type: "proximity",
                        resolved_from: prox.resolved_zip, distance_m: Math.round(prox.distance_m) });
    }

    // 4. Full miss — run scoring model
    const data = await scoreZipcode(zipcode);
    storeCachedScore(data);
    logRequest({ requested_zip: zipcode, resolved_zip: zipcode, cache_type: "miss",
                 model_called: true, response_ms: Date.now() - t0 });
    return res.json({ ...data, cached: false, cache_type: "miss" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to score zip code." });
  }
});

// Simple health endpoint for quick smoke tests
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(express.json());

app.post("/api/apply", async (req, res) => {
  const {
    jobId, jobTitle,
    firstName, lastName, email, phone,
    linkedin, portfolio, resumeName, resumePath,
    whyProxii, coverLetter,
    availability, referral,
    svCharacter, iafRating, nailgun,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !whyProxii || !availability || !referral || !svCharacter || !iafRating || !nailgun) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    job_title: jobTitle,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    linkedin: linkedin || null,
    portfolio: portfolio || null,
    resume_name: resumeName || null,
    resume_path: resumePath || null,
    why_proxii: whyProxii,
    cover_letter: coverLetter || null,
    availability,
    referral,
    sv_character: svCharacter,
    iaf_rating: parseFloat(iafRating),
    nailgun,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return res.status(500).json({ error: "Failed to save application" });
  }

  return res.json({ success: true });
});

// Serve frontend from the same origin as the API so Supabase OAuth lands here
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: __dirname,
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
