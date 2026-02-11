const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

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
    { label: "Specialty Coffee", keywords: ["specialty coffee", "third wave coffee"], weight: 3 },
    { label: "Whole Foods/Organic Grocers", keywords: ["whole foods", "organic grocery", "natural foods"], weight: 4 },
    { label: "Pilates/Yoga", keywords: ["pilates", "yoga studio"], weight: 2 },
    { label: "Boutique Gyms", keywords: ["boutique gym", "fitness studio", "spin studio"], weight: 2 },
    { label: "Wine Bars", keywords: ["wine bar"], weight: 2 }
  ],
  negative: [
    { label: "Payday Loans", keywords: ["payday loan"], weight: -4 },
    { label: "Pawn Shops", keywords: ["pawn shop"], weight: -3 },
    { label: "Fast Food Chains", keywords: ["fast food", "burger", "fried chicken"], weight: -2 },
    { label: "Industrial Zones", keywords: ["industrial", "warehouse", "distribution"], weight: -2 }
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
  const normalized = Math.round(50 + rawScore);
  return Math.max(0, Math.min(100, normalized));
}

async function geocodeZip(zipcode) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";
  const response = await axios.get(url, {
    params: {
      address: zipcode,
      key: mapsKey
    }
  });

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
      const indicatorScore = count * indicator.weight;
      rawScore += indicatorScore;
      indicatorHits.push({
        label: indicator.label,
        count,
        weight: indicator.weight,
        score: indicatorScore
      });
    }
  }

  return {
    zipcode,
    center,
    score: normalizeScore(rawScore),
    rawScore,
    indicators: indicatorHits.sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
  };
}

app.get("/api/score/:zipcode", async (req, res) => {
  const zipcode = String(req.params.zipcode || "").trim();

  if (!/^[0-9]{5}$/.test(zipcode)) {
    return res.status(400).json({ error: "Zip code must be 5 digits." });
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
