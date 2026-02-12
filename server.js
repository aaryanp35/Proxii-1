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

function normalizeScoreWithCategory(rawScore) {
  const baselineScore = 20; // Push poor areas to near 0
  const scaleFactor = 250;  // Controls steepness
  const range = 80;         // Wider spread from 0-100
  
  const tanhValue = Math.tanh(rawScore / scaleFactor);
  const normalized = baselineScore + range * tanhValue;
  const finalScore = Math.max(0, Math.min(100, Math.round(normalized)));
  
  let category = 'Under-invested';
  if (finalScore >= 80) category = 'Elite';
  else if (finalScore >= 50) category = 'Growth Potential';
  else if (finalScore >= 30) category = 'Market Standard';
  
  return { score: finalScore, category };
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

async function scoreZipcode(zipcode) {
  const center = await geocodeZip(zipcode);
  const indicators = buildWeightedIndicators();
  const seenPlaceIds = new Set();
  const indicatorHits = [];
  let growthScore = 0;
  let riskScore = 0;

  const anchorKeywords = ["whole foods", "erewhon", "apple store", "trader joe"];
  let hasAnchor = false;

  const culturalPioneers = ["art gallery", "yoga studio", "architecture firm", "contemporary art", "artist studio"];
  let culturalPioneerScore = 0;

  for (const indicator of indicators) {
    const placesForIndicator = [];

    for (const keyword of indicator.keywords) {
      const results = await placesSearchByKeyword(center, keyword);
      for (const place of results) {
        if (!place.place_id || seenPlaceIds.has(place.place_id)) {
          continue;
        }
        seenPlaceIds.add(place.place_id);

        let distance = Infinity;
        let distanceWeight = 0.1;
        if (place.geometry?.location?.lat && place.geometry?.location?.lng) {
          distance = haversineDistance(
            center.lat,
            center.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );
          distanceWeight = calculateWeight(distance);
        }

        placesForIndicator.push({ name: place.display_name || place.name || 'Unknown', distance, distanceWeight });

        // Check for anchors
        if (distance <= 1000) {
          const nameStr = (place.display_name || place.name || '').toLowerCase();
          for (const anchor of anchorKeywords) {
            if (nameStr.includes(anchor)) {
              hasAnchor = true;
              break;
            }
          }
        }

        // Check for cultural pioneers
        for (const keyword2 of indicator.keywords) {
          const keywordLower = keyword2.toLowerCase();
          for (const pioneer of culturalPioneers) {
            if (keywordLower.includes(pioneer)) {
              culturalPioneerScore += 20;
              break;
            }
          }
        }
      }
    }

    if (placesForIndicator.length > 0) {
      let score = 0;
      for (let i = 0; i < placesForIndicator.length; i++) {
        const place = placesForIndicator[i];
        const diminishingMult = getDiminishingValue(i + 1);
        const weightedContribution = indicator.weight * place.distanceWeight * diminishingMult;
        score += weightedContribution;
      }

      if (indicator.weight > 0) {
        growthScore += score;
      } else {
        riskScore += score;
      }

      indicatorHits.push({
        label: indicator.label,
        count: placesForIndicator.length,
        weight: indicator.weight,
        score: Math.round(score * 100) / 100
      });
    }
  }

  const anchorMultiplier = hasAnchor ? 1.2 : 1.0;
  const adjustedGrowthScore = growthScore * anchorMultiplier + culturalPioneerScore;
  const rawScore = adjustedGrowthScore + riskScore;

  const { score, category } = normalizeScoreWithCategory(rawScore);

  return {
    zipcode,
    areaName: center.areaName,
    center,
    score,
    category,
    rawScore: Math.round(rawScore * 100) / 100,
    growthScore: Math.round(adjustedGrowthScore * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
    hasAnchor,
    culturalPioneerScore: Math.round(culturalPioneerScore * 100) / 100,
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
