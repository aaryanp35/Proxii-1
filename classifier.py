#!/usr/bin/env python3
"""
Business Classifier - Rule-Based with Keyword Matching
Classifies businesses into gentrification indicators based on name and Google categories.
Lightweight, no ML models required - uses semantic keyword matching instead.
"""

from typing import Dict, Tuple, List
from dataclasses import dataclass


@dataclass
class ClassificationResult:
    label: str
    confidence: float
    all_scores: Dict[str, float]


# Target labels for classification
TARGET_LABELS = [
    "Growth Pioneer",          # Art galleries, design firms, specialty coffee, yoga
    "Established Upscale",     # Whole Foods, luxury gyms, boutiques, fine dining
    "Essential Service",       # Groceries, pharmacies, schools, basic utilities
    "At-Risk Legacy",          # Pawn shops, laundromats, check cashing, fast food
]

# Keyword mapping for each classification
KEYWORD_SCORES = {
    "Growth Pioneer": [
        "art gallery", "art", "museum", "yoga", "pilates", "design studio", "architecture",
        "architect", "specialty coffee", "third wave", "artisan bakery", "craft", "boutique",
        "independent", "gallery", "studio", "creative", "artist", "craftsman",
        "organic cafe", "farmer market", "farmers market", "wine bar", "craft brewery"
    ],
    "Established Upscale": [
        "whole foods", "erewhon", "trader joe", "luxury", "upscale", "premium", "exclusive",
        "fine dining", "michelin", "high-end", "boutique gym", "designer", "apple store",
        "luxury gym", "spa", "resort", "haute", "gourmet", "organic market"
    ],
    "Essential Service": [
        "pharmacy", "drug store", "grocery", "supermarket", "school", "library", "hospital",
        "medical center", "clinic", "public park", "community center", "post office", "bank",
        "utility", "water", "electric", "gas", "emergency", "fire department", "police"
    ],
    "At-Risk Legacy": [
        "pawn shop", "payday loan", "check cashing", "title loan", "fast food", "laundromat",
        "dry cleaning", "used car", "auto repair", "body shop", "liquor store", "discount store",
        "dollar store", "warehouse", "industrial", "factory", "manufacturing", "distribution"
    ]
}

# Negative indicators that reduce scores for certain categories
NEGATIVE_INDICATORS = {
    "Growth Pioneer": ["factory", "warehouse", "industrial", "pawn", "loan", "fast food"],
    "Established Upscale": ["pawn", "loan", "laundromat", "used car", "discount", "dollar"],
    "Essential Service": ["pawn", "payday", "title loan"],
    "At-Risk Legacy": ["whole foods", "luxury", "fine dining", "boutique", "designer", "upscale"]
}


class BusinessClassifier:
    """
    Classifies businesses into gentrification phase indicators using keyword matching.
    Fast, lightweight, no neural networks required.
    """

    def __init__(self):
        """Initialize the classifier."""
        print("Classifier initialized (keyword-based, no model download needed).")

    def classify_business(
        self,
        name: str,
        categories: List[str] = None,
        confidence_threshold: float = 0.0
    ) -> ClassificationResult:
        """
        Classify a business based on name and Google categories.

        Args:
            name: Business name (e.g., "Specialty Coffee Co.")
            categories: List of Google category strings (e.g., ["Cafe", "Coffee Shop"])
            confidence_threshold: Minimum confidence to accept result (0.0-1.0)

        Returns:
            ClassificationResult with top label, confidence, and all scores
        """
        if not name:
            raise ValueError("Business name cannot be empty")

        # Build input text
        input_text = (name.strip() + " ").lower()
        if categories:
            cats = [c.strip().lower() for c in categories if c and c.strip()]
            if cats:
                input_text += " ".join(cats)

        # Calculate scores for each label
        scores = {}
        for label in TARGET_LABELS:
            score = self._calculate_score(input_text, label)
            scores[label] = score

        # Find top label
        top_label = max(scores, key=scores.get)
        top_confidence = round(scores[top_label] * 100, 2)

        return ClassificationResult(
            label=top_label,
            confidence=top_confidence,
            all_scores={k: round(v * 100, 2) for k, v in scores.items()}
        )

    def _calculate_score(self, text: str, label: str) -> float:
        """
        Calculate match score for a label based on keyword presence.
        Range: 0.0 to 1.0
        """
        if label not in KEYWORD_SCORES:
            return 0.0

        keywords = KEYWORD_SCORES[label]
        negatives = NEGATIVE_INDICATORS.get(label, [])

        # Count keyword matches
        matches = 0
        max_score = 0
        for keyword in keywords:
            if keyword in text:
                matches += 1
                max_score = 1.0
        
        # Partial credit for single-word keyword matches
        if matches == 0:
            single_words = []
            for keyword in keywords:
                for word in keyword.split():
                    single_words.append(word)
            
            for word in set(single_words):
                if word in text:
                    max_score = max(max_score, 0.5)
                    matches += 0.5

        # Subtract negative indicators
        negative_penalty = 0
        for negative in negatives:
            if negative in text:
                negative_penalty += 0.15

        # Normalize score to 0-1 range
        # More matches = higher score, with bonus for multiple matches
        if matches >= 2:
            base_score = min(0.6 + (matches - 1) * 0.1, 1.0)
        else:
            base_score = min(matches * 0.5, max_score)
        
        final_score = max(base_score - negative_penalty, 0.0)

        return final_score

    def classify_batch(
        self,
        businesses: List[Dict[str, any]],
        name_key: str = "name",
        categories_key: str = "categories"
    ) -> List[Dict]:
        """
        Classify a batch of businesses.

        Args:
            businesses: List of dicts with name and categories keys
            name_key: Key for business name in dict
            categories_key: Key for categories list in dict

        Returns:
            List of dicts with original data + classification results
        """
        results = []
        for biz in businesses:
            name = biz.get(name_key, "")
            cats = biz.get(categories_key, [])
            try:
                classification = self.classify_business(name, cats)
                results.append({
                    **biz,
                    "classified_label": classification.label,
                    "confidence": classification.confidence,
                    "all_scores": classification.all_scores
                })
            except Exception as e:
                results.append({
                    **biz,
                    "error": str(e)
                })
        return results


def classify_business(name: str, categories: List[str] = None) -> Tuple[str, float]:
    """
    Convenience function: Classify a single business.
    
    Args:
        name: Business name
        categories: List of Google categories (optional)
    
    Returns:
        Tuple of (label, confidence_percentage)
    
    Example:
        >>> label, confidence = classify_business("Blue Bottle Coffee", ["Cafe", "Coffee Shop"])
        >>> print(f"{label}: {confidence}%")
        Growth Pioneer: 75.0%
    """
    # Use module-level singleton classifier
    if not hasattr(classify_business, "_classifier"):
        classify_business._classifier = BusinessClassifier()
    
    result = classify_business._classifier.classify_business(name, categories)
    return result.label, result.confidence


if __name__ == "__main__":
    # Example usage and testing
    print("\n" + "=" * 70)
    print("Proxii Business Classifier - Rule-Based Keyword Matching")
    print("=" * 70 + "\n")

    # Initialize classifier
    classifier = BusinessClassifier()

    # Test cases
    test_cases = [
        {
            "name": "Blue Bottle Coffee",
            "categories": ["Cafe", "Coffee Shop", "Restaurant"]
        },
        {
            "name": "Whole Foods Market",
            "categories": ["Grocery Store", "Organic Market", "Natural Foods"]
        },
        {
            "name": "CheckSmart Financial",
            "categories": ["Payday Loan Provider", "Check Cashing"]
        },
        {
            "name": "Walgreens Pharmacy",
            "categories": ["Pharmacy", "Drug Store", "Retail"]
        },
        {
            "name": "Contemporary Art Gallery",
            "categories": ["Art Gallery", "Museum"]
        },
        {
            "name": "Luxury Fitness Studio",
            "categories": ["Gym", "Fitness Center", "Yoga Studio"]
        },
        {
            "name": "LaundroMat Plus",
            "categories": ["Laundromat", "Dry Cleaning"]
        },
        {
            "name": "Apple Store",
            "categories": ["Electronics Store", "Apple Retail", "Tech Store"]
        }
    ]

    print("Classifying test businesses:\n")
    for i, test in enumerate(test_cases, 1):
        result = classifier.classify_business(test["name"], test["categories"])
        print(f"{i}. {test['name']}")
        print(f"   Categories: {', '.join(test['categories'])}")
        print(f"   ➜ Label: {result.label}")
        print(f"   ➜ Confidence: {result.confidence}%")
        print(f"   All Scores: {result.all_scores}\n")

    # Demonstrate batch processing
    print("\n" + "-" * 70)
    print("Batch Processing Example:")
    print("-" * 70 + "\n")
    batch_results = classifier.classify_batch(test_cases)
    import json
    print(json.dumps([{
        "name": r.get("name"),
        "label": r.get("classified_label"),
        "confidence": r.get("confidence")
    } for r in batch_results], indent=2))
