
import axios from "axios";

// Simple in-memory cache (expires after 10 min)
const cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const mapsKey = process.env.MAPS_API_KEY;

// Median Household Income by Zipcode (expanded dataset)
// Data source: Census estimates and public market research
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

// Estimate income from zipcode (returns null if unknown)
function getMedianHouseholdIncome(zipcode) {
  return incomeByZipcode[zipcode] || null;
}

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

function normalizeScoreWithCategory(rawScore, medianIncome = null, totalPlaces = 0) {
  // Base logistic normalization
  const baselineScore = 20;
  const scaleFactor = 800;
  const range = 80;
  
  const tanhValue = Math.tanh(rawScore / scaleFactor);
  let normalized = baselineScore + range * tanhValue;
  
  // Income adjustment layer: Ultra-wealthy areas get minimum floor of 70
  let isSuburbanLuxury = false;
  if (medianIncome && medianIncome > 150000) {
    // Set minimum score floor to 70 for ultra-wealthy enclaves
    normalized = Math.max(normalized, 70);
    
    // Suburban Luxury flag: low density + extreme income
    // Calculate density: total places found in search radius
    const isDensityLow = totalPlaces < 20;
    if (isDensityLow && medianIncome > 150000) {
      isSuburbanLuxury = true;
    }
  }
  
  const finalScore = Math.max(0, Math.min(100, Math.round(normalized)));
  
  // Categorize with suburban luxury override
  let category = 'Under-invested';
  if (isSuburbanLuxury) {
    category = 'Exclusive Residential';
  } else if (finalScore >= 80) {
    category = 'Elite Growth';
  } else if (finalScore >= 50) {
    category = 'High Growth';
  } else if (finalScore >= 30) {
    category = 'Market Standard';
  }
  
  return { score: finalScore, category, isSuburbanLuxury };
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
      fields: "places.displayName,places.types,places.id,places.geometry",
      key: mapsKey
    }
  });
  return response.data.results || [];
}

// Distance decay function: 100% within 500m, 50% at 500-1500m, 10% beyond
function calculateWeight(distanceMeters) {
  if (distanceMeters <= 500) return 1.0;
  if (distanceMeters <= 1500) return 0.5;
  return 0.1;
}

// Haversine distance between two lat/lng points (in meters)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// REFACTORED: Logarithmic scaling for amenity counts (prevents inflation)
// 1st instance: 1.0, 2nd: 1.585, 3rd: 2.0, 5th: 2.585, 10th: 3.459
// This ensures the 5th coffee shop contributes significantly less than the 1st
function getLogarithmicValue(count) {
  if (count <= 0) return 0;
  // log2(count + 1) provides smooth diminishing returns
  return Math.log2(count + 1);
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
  const geocoded = await geocodeZip(zipcode);
  const center = { lat: geocoded.lat, lng: geocoded.lng };
  const indicators = buildWeightedIndicators();
  const seenPlaceIds = new Set();
  const indicatorHits = [];
  let growthScore = 0;
  let riskScore = 0;

  // Anchor amenities that trigger 1.2x multiplier if within 1km
  const anchorKeywords = [
    "whole foods",
    "erewhon",
    "apple store",
    "trader joe"
  ];
  let hasAnchor = false;

  // Cultural pioneers: Art, Yoga, Architecture
  const culturalPioneers = [
    "art gallery",
    "yoga studio",
    "architecture firm",
    "contemporary art",
    "artist studio"
  ];
  let culturalPioneerScore = 0;

  // For each indicator, collect places and score them
  for (const indicator of indicators) {
    // Run all keyword searches in parallel
    const resultsArr = await Promise.all(
      indicator.keywords.map((keyword) => placesSearchByKeyword(center, keyword))
    );

    const placesForIndicator = [];

    // Flatten results and deduplicate
    for (const results of resultsArr) {
      for (const place of results) {
        if (!place.place_id || seenPlaceIds.has(place.place_id)) {
          continue;
        }
        seenPlaceIds.add(place.place_id);
        
        // Calculate distance if geometry available
        let distance = Infinity;
        let distanceWeight = 0.1; // default to minimum decay
        if (place.geometry?.location?.lat && place.geometry?.location?.lng) {
          distance = haversineDistance(
            center.lat,
            center.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );
          distanceWeight = calculateWeight(distance);
        }

        placesForIndicator.push({
          name: place.display_name || place.name || 'Unknown',
          distance,
          distanceWeight
        });

        // Check if anchor
        if (distance <= 1000) {
          const nameStr = (place.display_name || place.name || '').toLowerCase();
          for (const anchor of anchorKeywords) {
            if (nameStr.includes(anchor)) {
              hasAnchor = true;
              break;
            }
          }
        }

        // Check if cultural pioneer
        for (const keyword of indicator.keywords) {
          const keywordLower = keyword.toLowerCase();
          for (const pioneer of culturalPioneers) {
            if (keywordLower.includes(pioneer)) {
              culturalPioneerScore += 20; // Cultural pioneers get +20 pts
              break;
            }
          }
        }
      }
    }

    // REFACTORED: Score this indicator using logarithmic scaling for amenity counts
    if (placesForIndicator.length > 0) {
      // Calculate base weighted score from all instances
      let baseScore = 0;
      for (let i = 0; i < placesForIndicator.length; i++) {
        const place = placesForIndicator[i];
        baseScore += indicator.weight * place.distanceWeight;
      }
      
      // Apply logarithmic scaling: prevents 5th coffee shop from being worth as much as 1st
      // log2(count + 1) creates smooth diminishing returns:
      // 1st: 1.0, 2nd: 1.585, 3rd: 2.0, 5th: 2.585, 10th: 3.459
      const logMultiplier = getLogarithmicValue(placesForIndicator.length);
      const normalizedScore = baseScore * (logMultiplier / placesForIndicator.length);
      
      if (indicator.weight > 0) {
        growthScore += normalizedScore;
      } else {
        // REFACTORED: Hard penalties - risk factors actively subtract
        riskScore += normalizedScore; // Still negative, applied as hard penalty
      }

      indicatorHits.push({
        label: indicator.label,
        count: placesForIndicator.length,
        weight: indicator.weight,
        score: Math.round(normalizedScore * 100) / 100,
        tier: indicator.tier
      });
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
  
  const { score, category, isSuburbanLuxury } = normalizeScoreWithCategory(rawScore, medianIncome, totalPlaces);

  return {
    zipcode,
    areaName: geocoded.areaName,
    center,
    score,
    category,
    medianIncome,
    isSuburbanLuxury,
    rawScore: Math.round(rawScore * 100) / 100,
    growthScore: Math.round(adjustedGrowthScore * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
    hasAnchor,
    culturalPioneerScore: Math.round(culturalPioneerScore * 100) / 100,
    businessDensity: totalPlaces,
    scoringMethod: "logarithmic-scaling-v2-with-income-adjustment",
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
