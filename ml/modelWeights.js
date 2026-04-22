// Ridge Regression weights trained on 25 labeled zipcodes from zip-index.json.
// Features: [driversCount, risksCount]
// driversCount = number of positive indicator categories that fired
// risksCount   = number of negative indicator categories that fired
//
// Retrain: python ml/train.py  (adds new samples from Supabase over time)
//
// Stats: R²=0.982, n=25, alpha=1.0
export const MODEL_VERSION = "1.0.0";

export const INTERCEPT = 68.117;

// Indexed to match FEATURE_NAMES
export const FEATURE_NAMES = ["driversCount", "risksCount"];
export const WEIGHTS = [1.181, -2.187];

// Blend ratio: how much weight to give the ML score vs rule-based score.
// At 0.4 ML / 0.6 rule-based, the model acts as a correction signal.
// Increase toward 1.0 as training data grows.
export const ML_BLEND = 0.4;

export function predictScore(driversCount, risksCount) {
  const raw = INTERCEPT + WEIGHTS[0] * driversCount + WEIGHTS[1] * risksCount;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
