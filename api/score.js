const axios = require("axios");

const mapsKey = process.env.MAPS_API_KEY;

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

function normalizeScore(rawScore) {
  const k = 0.15;
  const sigmoid = 100 / (1 + Math.exp(-k * rawScore));
  const adjusted = sigmoid * 0.95 + 2.5;
  return Math.max(0, Math.min(100, Math.round(adjusted)));
}

async function geocodeZip(zipcode) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";
  const response = await axios.get(url, {
    params: { address: zipcode, key: mapsKey }
  });

  if (!response.data.results || response.data.results.length === 0) {
    throw new Error("Zip code not found.");
  }

  const location = response.data.results[0].geometry.location;
  return { lat: location.lat, lng: location.lng };
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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const zipcode = String(req.query.zipcode || "").trim();

  if (!/^[0-9]{5}$/.test(zipcode)) {
    return res.status(400).json({ error: "Zip code must be 5 digits." });
  }

  try {
    const data = await scoreZipcode(zipcode);
    return res.status(200).json({ ...data, cached: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to score zip code." });
  }
};
