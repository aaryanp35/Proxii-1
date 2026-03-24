import math
import os
import time
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

import folium
import numpy as np
import requests
import streamlit as st
from folium.features import DivIcon
from folium.plugins import HeatMap
from geopy.distance import geodesic
from streamlit_folium import st_folium


GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
GOOGLE_PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

BASE_KEYWORDS = [
    "specialty coffee",
    "coworking",
    "boutique fitness",
    "artisan bakery",
    "wine bar",
    "third wave coffee",
    "espresso bar",
    "coffee roastery",
    "brunch cafe",
    "matcha cafe",
    "pilates studio",
    "spin studio",
    "climbing gym",
    "wellness studio",
    "yoga studio",
    "farmers market",
    "food hall",
    "cocktail bar",
    "jazz bar",
    "live music venue",
    "organic grocery",
    "public park",
    "waterfront trail",
    "dog park",
    "bike share",
    "metro station",
    "tram stop",
    "safe walk",
    "night market",
    "pedestrian street",
]

EXTRA_KEYWORDS = [
    "highly rated restaurant",
    "art gallery",
    "vintage clothing",
    "independent bookstore",
    "michelin restaurant",
    "omakase",
    "tasting menu",
    "natural wine bar",
    "chef's table",
    "artisan chocolate",
    "specialty grocery",
    "craft brewery",
    "speakeasy",
    "rooftop bar",
    "design museum",
    "contemporary art",
    "street art",
    "record store",
    "film theater",
    "indie cinema",
    "craft store",
    "ceramics studio",
    "maker space",
    "language exchange cafe",
    "business lounge",
    "startup hub",
    "library",
    "quiet cafe",
    "vegan restaurant",
    "ramen",
    "sushi",
    "tapas",
    "bistro",
    "seafood restaurant",
    "steakhouse",
    "dessert shop",
    "gelato",
    "tea house",
    "botanical garden",
    "museum",
    "theater",
    "shopping street",
    "boutique hotel bar",
    "scenic viewpoint",
    "family restaurant",
    "children museum",
    "playground",
    "science museum",
    "aquarium",
    "zoo",
    "board game cafe",
    "farm to table restaurant",
]

NEGATIVE_KEYWORDS = [
    "payday loan",
    "industrial zone",
    "pawn shop",
    "check cashing",
    "title loan",
    "cash advance",
    "adult entertainment",
    "strip club",
    "drug rehab center",
    "abandoned building",
    "vacant lot",
    "junkyard",
    "scrapyard",
    "landfill",
    "waste transfer station",
    "heavy trucking",
    "truck depot",
    "freight terminal",
    "factory",
    "chemical plant",
    "oil refinery",
    "power plant",
    "warehouse district",
    "storage yard",
    "correctional facility",
    "prison",
    "probation office",
    "crime hotspot",
    "unsafe area",
    "graffiti vandalism",
    "noise complaint",
    "nightclub strip",
    "liquor superstore",
    "gambling hall",
    "slot machines",
    "betting shop",
    "bus depot",
    "highway interchange",
    "auto body shop",
    "car impound",
    "tow yard",
    "self storage",
    "discount motel",
    "homeless shelter",
    "emergency shelter",
]

PERSONA_WEIGHTS: Dict[str, Dict[str, float]] = {
    "Digital Nomad": {
        "coworking": 3.5,
        "specialty coffee": 3.0,
        "boutique fitness": 1.4,
        "artisan bakery": 1.2,
        "wine bar": 0.8,
        "highly rated restaurant": 1.0,
        "art gallery": 0.8,
        "vintage clothing": 0.7,
        "independent bookstore": 1.2,
    },
    "The Foodie": {
        "highly rated restaurant": 3.6,
        "artisan bakery": 3.0,
        "wine bar": 2.2,
        "specialty coffee": 1.4,
        "coworking": 0.8,
        "boutique fitness": 0.8,
        "art gallery": 0.8,
        "vintage clothing": 0.8,
        "independent bookstore": 0.7,
    },
    "The Artist": {
        "art gallery": 3.5,
        "vintage clothing": 3.0,
        "independent bookstore": 2.8,
        "specialty coffee": 1.6,
        "wine bar": 1.2,
        "artisan bakery": 1.0,
        "coworking": 0.9,
        "boutique fitness": 0.7,
        "highly rated restaurant": 1.0,
    },
    "Luxury Foodie": {
        "highly rated restaurant": 3.8,
        "wine bar": 3.2,
        "artisan bakery": 2.0,
        "specialty coffee": 1.2,
        "boutique fitness": 1.0,
        "coworking": 0.6,
        "art gallery": 0.8,
        "vintage clothing": 0.7,
        "independent bookstore": 0.5,
    },
}


def _unique_in_order(values: List[str]) -> List[str]:
    seen = set()
    ordered: List[str] = []
    for value in values:
        if value not in seen:
            ordered.append(value)
            seen.add(value)
    return ordered


ALL_POSITIVE_KEYWORDS = _unique_in_order(BASE_KEYWORDS + EXTRA_KEYWORDS)


@dataclass
class AmenityResult:
    keyword: str
    name: str
    rating: float
    user_ratings_total: int
    lat: float
    lng: float
    place_id: str


def inject_theme() -> None:
    st.markdown(
        """
        <style>
            :root {
                --bg: #0a0a0c;
                --obsidian: rgba(12, 13, 18, 0.62);
                --text: #ecf1ff;
                --muted: #9aa7c2;
                --gem-blue: #69a9ff;
                --deep-violet: #6b4bff;
                --gem-cyan: #65f2ff;
                --gem-pink: #d177ff;
            }

            .stApp {
                background: var(--bg);
                color: var(--text);
                font-family: Inter, Urbanist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                position: relative;
                overflow-x: hidden;
            }

            .stApp::before,
            .stApp::after {
                content: "";
                position: fixed;
                width: 52vmax;
                height: 52vmax;
                border-radius: 999px;
                filter: blur(90px);
                pointer-events: none;
                opacity: 0.32;
                mix-blend-mode: screen;
                z-index: -1;
                animation: spectralShift 14s ease-in-out infinite alternate;
            }

            .stApp::before {
                background: radial-gradient(circle, rgba(77, 124, 255, 0.36), rgba(77, 124, 255, 0));
                top: -14vmax;
                left: -18vmax;
            }

            .stApp::after {
                background: radial-gradient(circle, rgba(120, 79, 255, 0.33), rgba(120, 79, 255, 0));
                bottom: -20vmax;
                right: -18vmax;
                animation-delay: 1.6s;
            }

            @keyframes spectralShift {
                0% { transform: translate3d(0, 0, 0) scale(1); }
                50% { transform: translate3d(2.4vmax, -1.2vmax, 0) scale(1.05); }
                100% { transform: translate3d(-1.4vmax, 2.2vmax, 0) scale(1.02); }
            }

            @keyframes shimmerBorder {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
            }

            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 1; filter: brightness(1.2); }
                100% { transform: scale(1); opacity: 0.8; }
            }

            @keyframes glowPulse {
                0% { box-shadow: 0 0 0 rgba(101, 242, 255, 0.0), 0 0 36px rgba(107, 75, 255, 0.16); }
                50% { box-shadow: 0 0 0 rgba(101, 242, 255, 0.0), 0 0 56px rgba(101, 242, 255, 0.24); }
                100% { box-shadow: 0 0 0 rgba(101, 242, 255, 0.0), 0 0 36px rgba(107, 75, 255, 0.16); }
            }

            div[data-testid="stSidebar"] {
                background: rgba(10, 12, 20, 0.75);
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: saturate(180%) blur(20px);
            }

            .block-container {
                padding-top: 1.4rem;
                padding-bottom: 2rem;
            }

            .hero-shell {
                position: relative;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background: linear-gradient(140deg, rgba(20, 22, 35, 0.62), rgba(11, 13, 20, 0.42));
                border-radius: 28px;
                padding: 1.1rem 1.2rem 1.05rem 1.2rem;
                margin-bottom: 1rem;
                backdrop-filter: saturate(180%) blur(20px);
            }

            .hero-title {
                margin: 0;
                font-size: clamp(1.35rem, 3vw, 2.2rem);
                font-weight: 700;
                letter-spacing: -0.02em;
                background: linear-gradient(90deg, #cdd8f5 12%, #ffffff 56%, #d6e0ff 95%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }

            .hero-subtitle {
                margin-top: 0.38rem;
                color: var(--muted);
                font-size: 0.93rem;
            }

            .proxii-card {
                position: relative;
                background: var(--obsidian);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 1rem 1.05rem;
                margin-bottom: 0.9rem;
                backdrop-filter: saturate(180%) blur(20px);
            }

            .vibe-active {
                animation: glowPulse 3.4s ease-in-out infinite;
            }

            .vibe-active::after {
                content: "";
                position: absolute;
                inset: -2px;
                border-radius: 22px;
                z-index: -1;
                background: radial-gradient(circle at 30% 25%, rgba(107, 75, 255, 0.30), rgba(101, 242, 255, 0.28), rgba(0, 0, 0, 0));
                filter: blur(18px);
            }

            .proxii-kpi {
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--gem-cyan);
                line-height: 1.1;
                text-shadow: 0 0 20px rgba(101, 242, 255, 0.32);
            }

            .proxii-muted {
                color: var(--muted);
                font-size: 0.9rem;
            }

            .icon-line {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1.2rem;
                margin-right: 0.3rem;
                color: #d8e4ff;
                filter: drop-shadow(0 0 10px rgba(105, 169, 255, 0.4));
                font-weight: 300;
            }

            .fade-edge {
                mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
                -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
            }

            .vibe-gauge {
                --score: 0;
                width: min(180px, 42vw);
                aspect-ratio: 1 / 1;
                border-radius: 999px;
                background:
                    radial-gradient(circle at 50% 50%, rgba(12, 14, 24, 0.86) 55%, rgba(12, 14, 24, 0.2) 56%),
                    conic-gradient(from 220deg, rgba(101, 242, 255, 0.95) calc(var(--score) * 1%), rgba(105, 169, 255, 0.90), rgba(107, 75, 255, 0.9), rgba(70, 72, 98, 0.35) 0);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: saturate(180%) blur(20px);
                display: grid;
                place-items: center;
                position: relative;
                margin: 0.1rem auto 0 auto;
                box-shadow: 0 0 42px rgba(104, 133, 255, 0.24);
            }

            .vibe-gauge::before {
                content: "";
                position: absolute;
                inset: 16%;
                border-radius: 999px;
                background: rgba(9, 11, 18, 0.76);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: saturate(180%) blur(20px);
            }

            .vibe-gauge-value {
                position: relative;
                z-index: 2;
                text-align: center;
                line-height: 1;
                font-weight: 700;
                color: #e9f4ff;
                text-shadow: 0 0 16px rgba(101, 242, 255, 0.35);
            }

            .vibe-gauge-value small {
                display: block;
                margin-top: 0.28rem;
                color: var(--muted);
                font-weight: 500;
                font-size: 0.72rem;
                letter-spacing: 0.07em;
                text-transform: uppercase;
            }

            div[data-testid="stTextInput"] > div {
                border-radius: 999px;
                padding: 1px;
                border: 1px solid transparent;
                background:
                    linear-gradient(rgba(11, 13, 20, 0.86), rgba(11, 13, 20, 0.86)) padding-box,
                    linear-gradient(120deg, rgba(105, 169, 255, 0.96), rgba(107, 75, 255, 0.94), rgba(209, 119, 255, 0.9), rgba(105, 169, 255, 0.96)) border-box;
                background-size: 100% 100%, 240% 100%;
                animation: shimmerBorder 7s linear infinite;
                box-shadow: 0 0 26px rgba(88, 124, 255, 0.18);
                backdrop-filter: saturate(180%) blur(20px);
            }

            div[data-testid="stTextInput"] input {
                color: #f0f6ff !important;
            }

            .stButton > button,
            .stDownloadButton > button {
                border-radius: 999px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background: linear-gradient(120deg, rgba(26, 29, 44, 0.95), rgba(17, 18, 30, 0.92));
                color: #eaf2ff;
                box-shadow: 0 0 24px rgba(107, 75, 255, 0.2);
                backdrop-filter: saturate(180%) blur(20px);
            }

            .map-shell {
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 22px;
                padding: 0.45rem;
                background: rgba(11, 13, 21, 0.56);
                backdrop-filter: saturate(180%) blur(20px);
            }

            @media (max-width: 900px) {
                .block-container {
                    padding-top: 1rem;
                }
                .proxii-card {
                    border-radius: 16px;
                    padding: 0.85rem 0.88rem;
                }
                .hero-shell {
                    border-radius: 18px;
                    padding: 0.85rem 0.9rem;
                }
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _required_api_key(api_key: str) -> str:
    key = api_key.strip() if api_key else ""
    if not key:
        raise ValueError("Google Maps API key is required.")
    return key


@st.cache_data(show_spinner=False, ttl=3600)
def geocode_location(location: str, api_key: str) -> Tuple[float, float, str]:
    key = _required_api_key(api_key)
    response = requests.get(
        GOOGLE_GEOCODE_URL,
        params={"address": location, "key": key},
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()

    status = payload.get("status")
    if status != "OK" or not payload.get("results"):
        raise ValueError(f"Could not geocode location '{location}'. Google status: {status}")

    result = payload["results"][0]
    loc = result["geometry"]["location"]
    return float(loc["lat"]), float(loc["lng"]), result.get("formatted_address", location)


def _fetch_nearby_pages(lat: float, lng: float, radius: int, keyword: str, api_key: str) -> List[dict]:
    key = _required_api_key(api_key)
    all_results: List[dict] = []
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "keyword": keyword,
        "key": key,
    }

    for page_idx in range(3):
        response = requests.get(GOOGLE_PLACES_NEARBY_URL, params=params, timeout=20)
        response.raise_for_status()
        payload = response.json()
        status = payload.get("status")

        if status not in {"OK", "ZERO_RESULTS"}:
            if status == "INVALID_REQUEST" and page_idx > 0:
                break
            raise ValueError(f"Places API error for '{keyword}': {status}")

        all_results.extend(payload.get("results", []))
        next_token = payload.get("next_page_token")
        if not next_token:
            break

        time.sleep(1.5)
        params = {"pagetoken": next_token, "key": key}

    return all_results


def select_keywords_for_run(
    persona: str,
    max_positive_keywords: int,
    max_negative_keywords: int,
) -> Tuple[List[str], List[str]]:
    weights = PERSONA_WEIGHTS.get(persona, PERSONA_WEIGHTS["Digital Nomad"])
    ranked_positive = sorted(
        ALL_POSITIVE_KEYWORDS,
        key=lambda keyword: weights.get(keyword, 0.3),
        reverse=True,
    )
    selected_positive = ranked_positive[: max(1, min(max_positive_keywords, len(ranked_positive)))]
    selected_negative = NEGATIVE_KEYWORDS[: max(0, min(max_negative_keywords, len(NEGATIVE_KEYWORDS)))]
    return selected_positive, selected_negative


def build_keyword_batches(keywords: List[str], batch_size: int) -> List[List[str]]:
    safe_batch_size = max(1, batch_size)
    return [keywords[i:i + safe_batch_size] for i in range(0, len(keywords), safe_batch_size)]


@st.cache_data(show_spinner=False, ttl=1800)
def get_nearby_amenities_for_keywords(
    location: str,
    radius: int,
    api_key: str,
    positive_keywords: List[str],
    negative_keywords: List[str],
    batch_size: int,
    inter_batch_sleep_seconds: float,
) -> Dict[str, List[AmenityResult]]:
    lat, lng, _ = geocode_location(location, api_key)
    keywords = _unique_in_order(positive_keywords + negative_keywords)
    amenities: Dict[str, List[AmenityResult]] = {}

    keyword_batches = build_keyword_batches(keywords, batch_size)
    for batch_index, keyword_batch in enumerate(keyword_batches):
        for keyword in keyword_batch:
            rows: List[AmenityResult] = []
            seen_place_ids = set()
            for place in _fetch_nearby_pages(lat, lng, radius, keyword, api_key):
                place_id = place.get("place_id")
                if not place_id or place_id in seen_place_ids:
                    continue

                geo = place.get("geometry", {}).get("location", {})
                row = AmenityResult(
                    keyword=keyword,
                    name=place.get("name", "Unknown"),
                    rating=float(place.get("rating", 0.0) or 0.0),
                    user_ratings_total=int(place.get("user_ratings_total", 0) or 0),
                    lat=float(geo.get("lat", lat)),
                    lng=float(geo.get("lng", lng)),
                    place_id=place_id,
                )
                rows.append(row)
                seen_place_ids.add(place_id)

            amenities[keyword] = rows

        if inter_batch_sleep_seconds > 0 and batch_index < len(keyword_batches) - 1:
            time.sleep(inter_batch_sleep_seconds)

    return amenities


def _rating_quality_multiplier(rating: float, user_ratings_total: int) -> float:
    rating_factor = max(0.6, min(1.25, rating / 4.0 if rating else 0.8))
    social_proof = min(1.2, 1.0 + math.log10(max(1, user_ratings_total)) * 0.08)
    return rating_factor * social_proof


def _distance_decay(distances_m: np.ndarray, decay_length_m: float = 650.0) -> np.ndarray:
    clipped = np.maximum(distances_m - 50.0, 0.0)
    return np.exp(-clipped / decay_length_m)


def weighted_vibe_score(
    amenities: Dict[str, List[AmenityResult]],
    persona: str,
    center_coords: Tuple[float, float],
    negative_keywords: Optional[List[str]] = None,
) -> Tuple[float, Dict[str, float], List[List[float]]]:
    weights = PERSONA_WEIGHTS.get(persona, PERSONA_WEIGHTS["Digital Nomad"])
    signal_scores: Dict[str, float] = {k: 0.0 for k in weights.keys()}
    heat_points: List[List[float]] = []

    saturation_multipliers = np.array([1.0, 0.6, 0.3, 0.2, 0.1])
    negative_penalty_weight = 2.2
    total_negative_penalty = 0.0
    negative_set = set(negative_keywords if negative_keywords is not None else NEGATIVE_KEYWORDS)

    for keyword, places in amenities.items():
        if not places:
            if keyword in signal_scores:
                signal_scores[keyword] = 0.0
            continue

        distances = np.array(
            [geodesic(center_coords, (place.lat, place.lng)).meters for place in places],
            dtype=float,
        )
        order = np.argsort(distances)
        distances = distances[order]
        sorted_places = [places[index] for index in order]
        decays = _distance_decay(distances)

        if keyword in negative_set:
            friction_mult = np.ones_like(decays)
            friction_mult = np.where(distances <= 200.0, 2.0, friction_mult)
            friction_mult = np.where(distances >= 1000.0, 0.2, friction_mult)
            penalties = negative_penalty_weight * decays * friction_mult
            total_negative_penalty += float(np.sum(penalties))
            continue

        capped_count = min(len(sorted_places), len(saturation_multipliers))
        if capped_count == 0:
            signal_scores[keyword] = 0.0
            continue

        weight = weights.get(keyword, 0.5)
        sat = saturation_multipliers[:capped_count]

        quality = np.array(
            [
                _rating_quality_multiplier(
                    sorted_places[i].rating,
                    sorted_places[i].user_ratings_total,
                )
                for i in range(capped_count)
            ],
            dtype=float,
        )

        contributions = weight * decays[:capped_count] * sat * quality
        signal_scores[keyword] = float(np.sum(contributions))

        for i in range(capped_count):
            heat_points.append(
                [
                    sorted_places[i].lat,
                    sorted_places[i].lng,
                    float(max(0.03, contributions[i])),
                ]
            )

    raw_positive = sum(signal_scores.values())
    raw_score = max(0.0, raw_positive - total_negative_penalty)
    vibe_score = float(min(100.0, 100.0 * (1.0 - np.exp(-raw_score / 25.0))))
    return vibe_score, signal_scores, heat_points


def calculate_score(
    amenities: Dict[str, List[AmenityResult]],
    persona: str,
    center_coords: Tuple[float, float],
    negative_keywords: Optional[List[str]] = None,
) -> Tuple[float, Dict[str, float], List[List[float]]]:
    return weighted_vibe_score(amenities, persona, center_coords, negative_keywords)


def compute_neighborhood_match_percentage(
    hotel_address: str,
    persona: str,
    api_key: str,
    positive_keywords: List[str],
    negative_keywords: List[str],
    batch_size: int,
    inter_batch_sleep_seconds: float,
) -> Tuple[float, Dict[str, float], Dict[str, List[AmenityResult]]]:
    amenities = get_nearby_amenities_for_keywords(
        location=hotel_address,
        radius=500,
        api_key=api_key,
        positive_keywords=positive_keywords,
        negative_keywords=negative_keywords,
        batch_size=batch_size,
        inter_batch_sleep_seconds=inter_batch_sleep_seconds,
    )
    center_lat, center_lng, _ = geocode_location(hotel_address, api_key)
    vibe_score, signal_scores, _ = weighted_vibe_score(
        amenities,
        persona,
        (center_lat, center_lng),
        negative_keywords,
    )
    return vibe_score, signal_scores, amenities


def _top_signals(signal_scores: Dict[str, float], top_n: int = 3) -> List[Tuple[str, float]]:
    return sorted(signal_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]


def render_vibe_gauge(vibe_score: float) -> None:
    st.markdown(
        f"""
        <div class=\"proxii-card {'vibe-active' if vibe_score >= 75 else ''}\">
            <div class=\"proxii-muted\"><span class=\"icon-line\">✦</span>Vibe Gauge</div>
            <div class=\"vibe-gauge\" style=\"--score:{vibe_score:.1f};\">
                <div class=\"vibe-gauge-value\">{vibe_score:.1f}<small>Vibe Score</small></div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_folium_map(
    center_lat: float,
    center_lng: float,
    heat_points: Iterable[List[float]],
    vibe_score: float,
) -> folium.Map:
    m = folium.Map(
        location=[center_lat, center_lng],
        zoom_start=13,
        tiles="CartoDB dark_matter",
        control_scale=True,
    )

    heat_data = [[lat, lng, max(0.03, min(1.8, weight))] for lat, lng, weight in heat_points]
    if heat_data:
        HeatMap(
            heat_data,
            min_opacity=0.24,
            radius=18,
            blur=26,
            gradient={
                0.10: "#201840",
                0.35: "#3b2d75",
                0.60: "#4f46e5",
                0.82: "#38bdf8",
                1.00: "#67e8f9",
            },
        ).add_to(m)

    glow_strength = 0.8 if vibe_score >= 75 else 0.55
    sparkle_html = f"""
        <div style=\"display:flex;align-items:center;justify-content:center;\">
            <div style=\"
                width:22px;
                height:22px;
                transform: rotate(45deg);
                background: radial-gradient(circle, rgba(103,232,249,{glow_strength}), rgba(79,70,229,0.75));
                box-shadow: 0 0 14px rgba(103,232,249,0.75), 0 0 26px rgba(79,70,229,0.68);
                border-radius: 3px;
                animation: pulse 3.2s ease-in-out infinite;
            \" ></div>
        </div>
    """

    folium.Marker(
        [center_lat, center_lng],
        icon=DivIcon(
            icon_size=(24, 24),
            icon_anchor=(12, 12),
            html=sparkle_html,
        ),
    ).add_to(m)

    folium.LayerControl().add_to(m)
    return m


def main() -> None:
    st.set_page_config(page_title="Proxii Travel", page_icon="✦", layout="wide")
    inject_theme()

    st.markdown(
        """
        <div class=\"hero-shell\">
            <h1 class=\"hero-title\">Proxii Travel · Spatial Sentiment Navigator</h1>
            <div class=\"hero-subtitle\">Fluid, premium neighborhood intelligence for vibe-first booking decisions.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.sidebar:
        st.header("Settings")
        default_key = os.getenv("MAPS_API_KEY", "")
        api_key = st.text_input("Google Maps API Key", value=default_key, type="password")

        destination = st.text_input("Destination", value="Toronto")
        radius = st.slider("Search radius (meters)", min_value=2000, max_value=5000, value=2000, step=100)
        persona = st.selectbox("Traveler persona", options=list(PERSONA_WEIGHTS.keys()), index=0)

        st.markdown("---")
        st.subheader("API Cost & Speed Controls")
        presets = {
            "Fast": {
                "max_positive_keywords": 12,
                "max_negative_keywords": 6,
                "batch_size": 10,
                "inter_batch_sleep_ms": 0,
            },
            "Balanced": {
                "max_positive_keywords": min(28, len(ALL_POSITIVE_KEYWORDS)),
                "max_negative_keywords": min(12, len(NEGATIVE_KEYWORDS)),
                "batch_size": 6,
                "inter_batch_sleep_ms": 150,
            },
            "Full": {
                "max_positive_keywords": len(ALL_POSITIVE_KEYWORDS),
                "max_negative_keywords": len(NEGATIVE_KEYWORDS),
                "batch_size": 4,
                "inter_batch_sleep_ms": 300,
            },
        }

        preset = st.selectbox("Performance preset", options=["Fast", "Balanced", "Full", "Custom"], index=1)

        if preset == "Custom":
            max_positive_keywords = st.slider(
                "Max positive keywords",
                min_value=8,
                max_value=len(ALL_POSITIVE_KEYWORDS),
                value=min(28, len(ALL_POSITIVE_KEYWORDS)),
                step=1,
            )
            max_negative_keywords = st.slider(
                "Max negative keywords",
                min_value=0,
                max_value=len(NEGATIVE_KEYWORDS),
                value=min(12, len(NEGATIVE_KEYWORDS)),
                step=1,
            )
            batch_size = st.slider("Keyword batch size", min_value=1, max_value=12, value=6, step=1)
            inter_batch_sleep_ms = st.slider("Delay between batches (ms)", min_value=0, max_value=1500, value=150, step=50)
        else:
            max_positive_keywords = presets[preset]["max_positive_keywords"]
            max_negative_keywords = presets[preset]["max_negative_keywords"]
            batch_size = presets[preset]["batch_size"]
            inter_batch_sleep_ms = presets[preset]["inter_batch_sleep_ms"]
            st.caption(
                f"Preset active: {max_positive_keywords} positive, {max_negative_keywords} negative, "
                f"batch {batch_size}, delay {inter_batch_sleep_ms}ms"
            )

        st.markdown("---")
        st.subheader("Hotel / Airbnb Match")
        hotel_address = st.text_input("Accommodation address")
        evaluate_hotel = st.button("Calculate Neighborhood Match")

    if not api_key:
        st.info("Add a Google Maps API key in the sidebar to start exploring vibe data.")
        return

    selected_positive, selected_negative = select_keywords_for_run(
        persona=persona,
        max_positive_keywords=max_positive_keywords,
        max_negative_keywords=max_negative_keywords,
    )

    total_keywords = len(selected_positive) + len(selected_negative)
    total_batches = len(build_keyword_batches(selected_positive + selected_negative, batch_size))
    inter_batch_sleep_seconds = inter_batch_sleep_ms / 1000.0

    try:
        with st.spinner("Fetching amenities and calculating Vibe Score..."):
            amenities = get_nearby_amenities_for_keywords(
                location=destination,
                radius=radius,
                api_key=api_key,
                positive_keywords=selected_positive,
                negative_keywords=selected_negative,
                batch_size=batch_size,
                inter_batch_sleep_seconds=inter_batch_sleep_seconds,
            )
            center_lat, center_lng, formatted = geocode_location(destination, api_key)
            vibe_score, signal_scores, heat_points = weighted_vibe_score(
                amenities,
                persona,
                (center_lat, center_lng),
                selected_negative,
            )
    except Exception as exc:
        st.error(f"Unable to load vibe data: {exc}")
        return

    st.caption(
        f"Using {len(selected_positive)} positive + {len(selected_negative)} negative keywords "
        f"({total_keywords} total across {total_batches} API batches)."
    )

    col1, col2, col3 = st.columns([1, 1, 2])
    with col1:
        render_vibe_gauge(vibe_score)

    with col2:
        total_places = sum(len(rows) for rows in amenities.values())
        st.markdown(
            f"""
            <div class=\"proxii-card\">
                <div class=\"proxii-muted\"><span class=\"icon-line\">⌁</span>Amenities scanned</div>
                <div class=\"proxii-kpi\">{total_places}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col3:
        top = _top_signals(signal_scores)
        top_text = " · ".join([f"{name}: {score:.1f}" for name, score in top]) if top else "No signals"
        active_class = "vibe-active" if vibe_score >= 75 else ""
        st.markdown(
            f"""
            <div class=\"proxii-card {active_class}\">
                <div class=\"proxii-muted\"><span class=\"icon-line\">✧</span>Top vibe signals for {persona}</div>
                <div class=\"fade-edge\" style=\"margin-top: 0.3rem;\">{top_text}</div>
                <div class=\"proxii-muted\" style=\"margin-top: 0.45rem;\">{formatted}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.subheader("Vibe Heatmap")
    st.caption("Dark vector map with soft ember nodes for high-density, high-quality signals.")
    st.markdown("<div class='map-shell'>", unsafe_allow_html=True)
    vibe_map = render_folium_map(center_lat, center_lng, heat_points, vibe_score)
    st_folium(vibe_map, width=None, height=560)
    st.markdown("</div>", unsafe_allow_html=True)

    if evaluate_hotel and hotel_address.strip():
        try:
            with st.spinner("Scoring neighborhood match around this address..."):
                match_score, hotel_signals, hotel_amenities = compute_neighborhood_match_percentage(
                    hotel_address=hotel_address,
                    persona=persona,
                    api_key=api_key,
                    positive_keywords=selected_positive,
                    negative_keywords=selected_negative,
                    batch_size=batch_size,
                    inter_batch_sleep_seconds=inter_batch_sleep_seconds,
                )

            st.markdown("### Neighborhood Match")
            st.success(f"Neighborhood Match: {match_score:.1f}% within 500m of the selected address.")

            signal_rows = [
                {
                    "signal": key,
                    "score": round(value, 2),
                    "count": len(hotel_amenities.get(key, [])),
                }
                for key, value in sorted(hotel_signals.items(), key=lambda x: x[1], reverse=True)
            ]
            st.dataframe(signal_rows, use_container_width=True)
        except Exception as exc:
            st.error(f"Could not score accommodation neighborhood match: {exc}")


if __name__ == "__main__":
    main()
