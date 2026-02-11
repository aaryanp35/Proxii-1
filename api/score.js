
import axios from "axios";

// Simple in-memory cache (expires after 10 min)
const cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const mapsKey = process.env.MAPS_API_KEY;

const weights = {
  // Tier 1: Premium positive indicators (highest impact)
  positive: [
    { label: "Upscale Shopping Districts", keywords: ["luxury mall", "upscale shopping", "designer stores", "boutique shopping"], weight: 4.5, tier: "premium" },
    { label: "Fine Dining Restaurants", keywords: ["fine dining", "michelin star", "upscale restaurant"], weight: 4.2, tier: "premium" },
    { label: "Whole Foods/Organic Markets", keywords: ["whole foods", "organic grocery", "natural foods", "farm to table"], weight: 3.8, tier: "premium" },
    { label: "Specialty Coffee Shops", keywords: ["specialty coffee", "third wave coffee", "artisan coffee", "craft coffee"], weight: 3.5, tier: "premium" },
    { label: "Premium Fitness Centers", keywords: ["boutique gym", "luxury fitness", "high-end gym", "upscale gym"], weight: 3.2, tier: "premium" },
    { label: "Yoga & Wellness Studios", keywords: ["yoga studio", "pilates studio", "wellness center", "holistic health"], weight: 3.0, tier: "premium" },
    { label: "Wine & Spirits Bars", keywords: ["wine bar", "craft cocktails", "upscale bar", "wine lounge"], weight: 2.8, tier: "premium" },
    { label: "Art Galleries", keywords: ["art gallery", "contemporary art", "art museum"], weight: 2.6, tier: "premium" },
    { label: "Artisan Bakeries", keywords: ["bakery", "artisan bakery", "organic bakery", "craft bakery"], weight: 2.5, tier: "premium" },
    { label: "Trendy Brunch Spots", keywords: ["brunch", "cafe", "bistro"], weight: 2.3, tier: "premium" },
    
    // Tier 2: Strong positive indicators (moderate-high impact)
    { label: "Tech Companies & Startups", keywords: ["tech company", "startup", "tech office", "software company"], weight: 2.8, tier: "strong" },
    { label: "Universities & Colleges", keywords: ["university", "college", "educational institution"], weight: 2.7, tier: "strong" },
    { label: "Public Libraries", keywords: ["library", "public library"], weight: 2.5, tier: "strong" },
    { label: "Parks & Recreation", keywords: ["public park", "nature park", "recreation center", "sports complex"], weight: 2.4, tier: "strong" },
    { label: "Bookstores", keywords: ["bookstore", "independent bookstore"], weight: 2.2, tier: "strong" },
    { label: "Music Venues", keywords: ["music venue", "concert hall", "live music"], weight: 2.0, tier: "strong" },
    { label: "Theaters & Performing Arts", keywords: ["theater", "theatre", "performing arts", "concert venue"], weight: 2.1, tier: "strong" },
    { label: "Farmers Markets", keywords: ["farmers market", "farmers market", "produce market"], weight: 2.0, tier: "strong" },
    { label: "Health & Medical Centers", keywords: ["medical center", "health clinic", "hospital", "healthcare facility"], weight: 1.9, tier: "strong" },
    { label: "Plant-Based Restaurants", keywords: ["vegan restaurant", "vegetarian restaurant", "plant-based"], weight: 1.8, tier: "strong" },
    
    // Tier 3: Moderate positive indicators (baseline improvements)
    { label: "Craft Breweries", keywords: ["brewery", "craft brewery", "microbrewery"], weight: 1.7, tier: "moderate" },
    { label: "Independent Restaurants", keywords: ["independent restaurant", "local restaurant"], weight: 1.6, tier: "moderate" },
    { label: "Design & Architecture", keywords: ["design studio", "architecture firm"], weight: 1.5, tier: "moderate" },
    { label: "Community Centers", keywords: ["community center", "community hub"], weight: 1.5, tier: "moderate" },
    { label: "Florists & Garden Centers", keywords: ["florist", "garden center", "nursery"], weight: 1.4, tier: "moderate" },
    { label: "Pet Friendly Venues", keywords: ["dog park", "pet friendly", "pet cafe"], weight: 1.3, tier: "moderate" },
    { label: "Networking Spaces", keywords: ["coworking", "coworking space", "business center"], weight: 1.3, tier: "moderate" },
    { label: "Bookbinding & Stationery", keywords: ["stationery", "printing", "bookbinding"], weight: 1.2, tier: "moderate" }
  ],
  
  // Tier 1: Critical negative indicators (massive penalty)
  negative: [
    { label: "Predatory Lending", keywords: ["payday loan", "title loan", "check cashing"], weight: -6.0, tier: "critical" },
    { label: "Pawn & Liquor Shops", keywords: ["pawn shop", "liquor store", "check cashing"], weight: -5.5, tier: "critical" },
    { label: "Substance Abuse Services", keywords: ["drug treatment", "rehab center", "addiction center"], weight: -5.0, tier: "critical" },
    
    // Tier 2: Strong negative indicators (significant penalty)
    { label: "Fast Food Chains", keywords: ["fast food", "burger", "fried chicken", "pizza chain"], weight: -3.5, tier: "strong" },
    { label: "Industrial & Warehouses", keywords: ["industrial", "warehouse", "distribution center", "manufacturing"], weight: -3.2, tier: "strong" },
    { label: "Auto Repair & Body Shops", keywords: ["auto repair", "body shop", "mechanic"], weight: -2.8, tier: "strong" },
    { label: "Used Car Lots", keywords: ["used car", "car dealership"], weight: -2.5, tier: "strong" },
    { label: "Gas Stations & Convenience Stores", keywords: ["gas station", "convenience store", "petrol station"], weight: -2.0, tier: "strong" },
    { label: "Discount Retail Chains", keywords: ["discount store", "dollar store", "discount retail"], weight: -1.8, tier: "strong" },
    
    // Tier 3: Moderate negative indicators (minor penalty)
    { label: "Laundromats", keywords: ["laundromat", "dry cleaning"], weight: -1.5, tier: "moderate" },
    { label: "Telecommunications Nodes", keywords: ["cell tower", "telecom", "internet cafe"], weight: -1.2, tier: "moderate" },
    { label: "Tobacco Shops", keywords: ["tobacco", "vape shop"], weight: -1.0, tier: "moderate" },
    { label: "Parking Lots", keywords: ["parking lot", "parking garage"], weight: -0.8, tier: "moderate" }
  ]
};

function normalizeScore(rawScore) {
  // Enhanced sigmoid with better scaling for expanded indicator range
  const k = 0.08; // Adjusted sensitivity for larger range
  const sigmoid = 100 / (1 + Math.exp(-k * rawScore));
  const adjusted = sigmoid * 0.92 + 4;
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

  const result = response.data.results[0];
  const location = result.geometry.location;
  const formattedAddress = result.formatted_address;
  
  // Extract city/area name (first component, usually city or main area)
  const addressComponents = result.address_components;
  let areaName = formattedAddress;
  
  // Try to extract city or locality name
  const cityComponent = addressComponents.find(c => c.types.includes('locality'));
  const adminArea = addressComponents.find(c => c.types.includes('administrative_area_level_1'));
  
  if (cityComponent) {
    areaName = cityComponent.long_name;
  } else if (adminArea) {
    areaName = adminArea.long_name;
  }
  
  return { lat: location.lat, lng: location.lng, areaName };
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
    weight: item.weight,
    tier: item.tier || "standard"
  }));
}


async function scoreZipcode(zipcode) {
  const center = await geocodeZip(zipcode);
  const indicators = buildWeightedIndicators();
  const seenPlaceIds = new Set();
  const indicatorHits = [];
  let rawScore = 0;

  // For each indicator, run all keyword searches in parallel
  for (const indicator of indicators) {
    // Run all keyword searches in parallel
    const resultsArr = await Promise.all(
      indicator.keywords.map((keyword) => placesSearchByKeyword(center, keyword))
    );
    let count = 0;
    for (const results of resultsArr) {
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
        score: indicatorScore,
        tier: indicator.tier
      });
    }
  }

  return {
    zipcode,
    areaName: center.areaName,
    center,
    score: normalizeScore(rawScore),
    rawScore,
    indicators: indicatorHits.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)),
    drivers: indicatorHits
      .filter((item) => item.weight > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => ({ label: item.label, count: item.count, score: item.score, tier: item.tier })),
    risks: indicatorHits
      .filter((item) => item.weight < 0)
      .sort((a, b) => a.score - b.score)
      .map((item) => ({ label: item.label, count: item.count, score: item.score, tier: item.tier }))
  };
}

export default async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const zipcode = String(req.query.zipcode || "").trim();

  if (!mapsKey) {
    return res.status(500).json({ error: "Maps API key not configured." });
  }

  // Supports: US (5-digit), Canada (A1A 1A1), and European formats
  const postalCodeRegex = /^([0-9]{5}|[A-Z]\d[A-Z]\s?\d[A-Z]\d|[0-9]{4,6}|[A-Z]{1,2}\d{1,2}[A-Z\d]?\s?\d[A-Z]{2})$/;
  if (!postalCodeRegex.test(zipcode.trim())) {
    return res.status(400).json({ error: "Invalid postal code format. Supports US, Canada, and Europe." });
  }

  try {
    // Check cache first
    const now = Date.now();
    if (cache[zipcode] && (now - cache[zipcode].ts < CACHE_TTL)) {
      return res.status(200).json({ ...cache[zipcode].data, cached: true });
    }
    const data = await scoreZipcode(zipcode);
    cache[zipcode] = { data, ts: now };
    return res.status(200).json({ ...data, cached: false });
  } catch (error) {
    console.error("Score API error:", error.message, error.response?.data);
    return res.status(500).json({ 
      error: error.message || "Unable to score zip code.",
      details: error.response?.data?.error_message || error.response?.data?.status
    });
  }
};
