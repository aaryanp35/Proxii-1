"""
Ridge Regression trainer for zipcode scoring.

Usage:
  python ml/train.py

Reads:
  zip-index.json          – 25 bootstrapped labeled samples (drivers/risks counts + score)
  ml/training_data.json   – accumulated live samples saved from the API (optional)

Writes:
  ml/modelWeights.js      – updated ES module with new coefficients

Install deps once:
  pip install scikit-learn numpy
"""

import json
import math
import os
import re
from datetime import datetime

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import r2_score

ROOT = os.path.dirname(os.path.dirname(__file__))


def load_zip_index():
    path = os.path.join(ROOT, "zip-index.json")
    with open(path) as f:
        data = json.load(f)
    rows = []
    for entry in data.values():
        rows.append({
            "driversCount": entry["drivers"],
            "risksCount": entry["risks"],
            "score": entry["score"],
        })
    return rows


def load_live_samples():
    path = os.path.join(ROOT, "ml", "training_data.json")
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return json.load(f)


def build_matrices(rows):
    X = np.array([[r["driversCount"], r["risksCount"]] for r in rows], dtype=float)
    y = np.array([r["score"] for r in rows], dtype=float)
    return X, y


def update_weights_module(intercept, weights, r2, n):
    path = os.path.join(ROOT, "ml", "modelWeights.js")
    with open(path) as f:
        src = f.read()

    def replace(pattern, value):
        return re.sub(pattern, value, src, flags=re.MULTILINE)

    src = replace(r'export const MODEL_VERSION = ".*?"', f'export const MODEL_VERSION = "{datetime.today().strftime("%Y.%m.%d")}"')
    src = replace(r'export const INTERCEPT = [\d.]+', f'export const INTERCEPT = {round(intercept, 3)}')
    src = replace(r'export const WEIGHTS = \[.*?\]', f'export const WEIGHTS = [{round(weights[0], 3)}, {round(weights[1], 3)}]')
    src = replace(r'// Stats: R²=[\d.]+, n=\d+', f'// Stats: R²={round(r2, 3)}, n={n}')

    with open(path, "w") as f:
        f.write(src)


def main():
    rows = load_zip_index()
    live = load_live_samples()

    if live:
        print(f"Merging {len(live)} live sample(s) with {len(rows)} index samples")
        rows = rows + live
    else:
        print(f"Using {len(rows)} bootstrapped samples (no live data yet)")

    X, y = build_matrices(rows)

    model = Ridge(alpha=1.0)
    model.fit(X, y)

    y_pred = model.predict(X)
    r2 = r2_score(y, y_pred)

    print(f"\nResults:")
    print(f"  intercept : {model.intercept_:.3f}")
    print(f"  driversCount weight : {model.coef_[0]:.3f}")
    print(f"  risksCount weight   : {model.coef_[1]:.3f}")
    print(f"  R²        : {r2:.3f}  (n={len(rows)})")

    # Spot-check a few
    print("\nSpot checks:")
    for r in rows[:5]:
        pred = model.intercept_ + model.coef_[0] * r["driversCount"] + model.coef_[1] * r["risksCount"]
        print(f"  drivers={r['driversCount']} risks={r['risksCount']} → pred={pred:.1f}  actual={r['score']}")

    update_weights_module(model.intercept_, model.coef_, r2, len(rows))
    print("\nUpdated ml/modelWeights.js")


if __name__ == "__main__":
    main()
