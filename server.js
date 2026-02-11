import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const mapsKey = process.env.MAPS_API_KEY;
const cachePath = path.join(__dirname, "cache.json");
const cacheTtlMs = 12 * 60 * 60 * 1000;

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

function loadCache() {
  try {
    const raw = fs.readFileSync(cachePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

function isCacheValid(entry) {
  return entry && Date.now() - entry.timestamp < cacheTtlMs;
}

function normalizeScore(rawScore) {
  // Use tanh-based scaling for smoother tails and symmetric behavior
  const scale = 18;
  const v = Math.tanh(rawScore / scale);
  const normalized = ((v + 1) / 2) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

async function geocodeZip(zipcode) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  // Minimal country bias: prefer US if pure 5-digit; prefer CA if matches Canadian pattern
  const canadaRegex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
  const usRegex = /^[0-9]{5}$/;

  const params = { key: mapsKey };
  if (usRegex.test(zipcode)) {
    params.components = `postal_code:${zipcode}|country:US`;
  } else if (canadaRegex.test(zipcode)) {
    params.components = `postal_code:${zipcode}|country:CA`;
  } else {
    // Fallback to address for other international formats
    params.address = zipcode;
  }

  const response = await axios.get(url, { params });

  if (!response.data.results || response.data.results.length === 0) {
    throw new Error("Zip code not found.");
  }

  const location = response.data.results[0].geometry.location;
  return {
    lat: location.lat,
    lng: location.lng
  };
}

async function placesSearchByKeyword({ lat, lng }, keyword) {
  const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
  const response = await axios.get(url, {
    params: {
      location: `${lat},${lng}`,
      radius: 3000,
      keyword,
      key: mapsKey
    }
  });

  return response.data.results || [];
}

function buildWeightedIndicators() {
  return [...weights.positive, ...weights.negative].map((item) => ({
    label: item.label,
    keywords: item.keywords,
    weight: item.weight
  }));
}

async function scoreZipcode(zipcode) {
  const center = await geocodeZip(zipcode);
  const indicators = buildWeightedIndicators();
  const seenPlaceIds = new Set();
  const indicatorHits = [];
  let rawScore = 0;
  const tierMultipliers = {
    premium: 1.4,
    strong: 1.15,
    moderate: 1.0,
    critical: 1.8,
    standard: 1.0
  };
  const MAX_COUNT_PER_INDICATOR = 8;

  for (const indicator of indicators) {
    let count = 0;
    for (const keyword of indicator.keywords) {
      const results = await placesSearchByKeyword(center, keyword);
      for (const place of results) {
        if (!place.place_id || seenPlaceIds.has(place.place_id)) {
          continue;
        }
        seenPlaceIds.add(place.place_id);
        count += 1;
      }
    }

    if (count > 0) {
      const capped = Math.min(count, MAX_COUNT_PER_INDICATOR);
      const magnitude = Math.log1p(capped);
      // attempt to read tier from indicator if present (some weights may not include it)
      const tier = indicator.tier || "standard";
      const tierMult = tierMultipliers[tier] || 1.0;
      const indicatorScore = Math.sign(indicator.weight) * Math.abs(indicator.weight) * magnitude * tierMult;
      rawScore += indicatorScore;
      indicatorHits.push({
        label: indicator.label,
        count,
        capped,
        weight: indicator.weight,
        score: indicatorScore,
        tier
      });
    }
  }

  return {
    zipcode,
    center,
    score: normalizeScore(rawScore),
    rawScore,
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

app.get("/api/score/:zipcode", async (req, res) => {
  const zipcodeRaw = String(req.params.zipcode || "").trim();
  const zipcode = zipcodeRaw.toUpperCase();

  if (!mapsKey) {
    return res.status(500).json({ error: "Maps API key not configured. Set MAPS_API_KEY in environment." });
  }

  // Accept US (5-digit), Canada (A1A 1A1), many European formats and UK
  const postalCodeRegex = /^([0-9]{5}|[A-Z]\d[A-Z]\s?\d[A-Z]\d|[0-9]{4,6}|[A-Z]{1,2}\d{1,2}[A-Z\d]?\s?\d[A-Z]{2})$/;
  if (!postalCodeRegex.test(zipcode)) {
    return res.status(400).json({ error: "Invalid postal code format. Supports US, Canada, and common European formats." });
  }

  try {
    const cache = loadCache();
    const cachedEntry = cache[zipcode];

    if (isCacheValid(cachedEntry)) {
      return res.json({
        ...cachedEntry.data,
        cached: true
      });
    }

    const data = await scoreZipcode(zipcode);

    cache[zipcode] = {
      timestamp: Date.now(),
      data
    };
    saveCache(cache);

    return res.json({
      ...data,
      cached: false
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to score zip code." });
  }
});

// Simple health endpoint for quick smoke tests
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
