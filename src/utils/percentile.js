/**
 * Calculate national percentile statistics for a given score
 * @param {number} score - The numerical score (0-100)
 * @returns {Object} Object containing percentile, rankLabel, and z-score
 */
export function getNationalStats(score) {
  // Constants for distribution
  const MEAN = 50;
  const STD_DEV = 15;
  const SIGMOID_FACTOR = 1.654;

  // Calculate z-score
  const zScore = (score - MEAN) / STD_DEV;

  // Calculate percentile using sigmoid approximation
  // Formula: 1 / (1 + Math.exp(-1.654 * z))
  const percentile = Math.round((1 / (1 + Math.exp(-SIGMOID_FACTOR * zScore))) * 100);

  // Determine rank label based on percentile thresholds
  let rankLabel;
  if (percentile > 95) {
    rankLabel = 'Elite Growth';
  } else if (percentile > 75) {
    rankLabel = 'High Growth';
  } else if (percentile > 40) {
    rankLabel = 'Market Standard';
  } else {
    rankLabel = 'Developing';
  }

  return {
    percentile: Math.max(0, Math.min(100, percentile)),
    rankLabel,
    zScore: Math.round(zScore * 100) / 100,
    score,
    topPercentage: Math.max(0, Math.min(100, 100 - percentile))
  };
}
