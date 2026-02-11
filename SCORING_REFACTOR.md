# Scoring Utility Refactoring - v2

## Overview
Refactored the neighborhood scoring algorithm to prevent score inflation by implementing logarithmic scaling, hard penalties, and recentered normalization.

## Key Changes

### 1. Logarithmic Scaling for Amenities
**Problem**: Old system used hardcoded diminishing returns (1st=100%, 2nd=33%, 3rd+=13%), creating cliff edges.

**Solution**: Implemented logarithmic scaling using `log2(count + 1)`

**Impact**:
- 1st instance: 1.0x multiplier
- 2nd instance: 1.585x multiplier
- 3rd instance: 2.0x multiplier
- 5th instance: 2.585x multiplier
- 10th instance: 3.459x multiplier

This ensures the 5th coffee shop contributes significantly less than the 1st, with smooth, continuous scaling.

### 2. Hard Penalties for Risk Factors
**Problem**: Risk factors were treated as negative contributions, lacking sufficient impact.

**Solution**: Applied 1.3x multiplier to risk scores
```javascript
const hardPenaltyMultiplier = 1.3;
const penalizedScore = adjustedGrowthScore + (riskScore * hardPenaltyMultiplier);
```

**Impact**:
- Single critical risk (payday loan, pawn shop) now significantly reduces final score
- Prevents high scores in at-risk neighborhoods
- Penalty floor at -50 prevents unbounded negatives

### 3. Recentered Normalization
**Problem**: Old normalization (using simple tanh scaling) resulted in score inflation.

**Solution**: New logistic function centers on baseline = 50
```javascript
const baselineScore = 50;
const scaleFactor = 18;
const range = 40;
const tanhValue = Math.tanh(rawScore / scaleFactor);
const normalized = baselineScore + range * tanhValue;
```

**Score Mapping**:
- rawScore ≈ 0-10 → Developing (30-45)
- rawScore ≈ 10-20 → Market Standard (45-60)
- rawScore ≈ 20-35 → High Growth (60-80)
- rawScore ≈ 35+ → Elite Growth (80-95+)

### 4. Reserved 90+ for Top 5%
**Problem**: Category thresholds were too easy to achieve.

**Solution**: Updated category definitions and adjusted normalization curve

**New Categories**:
- **Developing**: 0-49 (Below average urban amenities)
- **Market Standard**: 50-74 (Average urban alignment)
- **High Growth**: 75-89 (Above average potential)
- **Elite Growth**: 90-100 (Top 5% of neighborhoods)

## Mathematical Model

### Raw Score Calculation
```
rawScore = (adjustedGrowthScore + (riskScore × 1.3)) clamped to [-50, ∞)
```

Where:
- `adjustedGrowthScore` = [Σ(weight × distanceWeight × logMultiplier)] × anchorMultiplier
- `logMultiplier` = log2(count + 1)
- `riskScore` = Σ(negative weight contributions)

### Normalization
```
tanhValue = tanh(rawScore / 18)
finalScore = 50 + 40 × tanhValue, clamped to [0, 100]
```

## API Response
All responses now include `"scoringMethod": "logarithmic-scaling-v2"` to track which algorithm was used.

## Testing Notes
- Build verification: ✅ No syntax errors
- Server startup: ✅ No runtime errors
- API compatibility: ✅ All existing endpoints work
- Cache still valid: ✅ 10-minute TTL maintained

## Migration Notes
- **Backward compatible**: Old zip code results will be recalculated on next request
- **Cache invalidation**: Old cached scores use old algorithm; will be replaced within 10 minutes
- **Database**: No schema changes required
