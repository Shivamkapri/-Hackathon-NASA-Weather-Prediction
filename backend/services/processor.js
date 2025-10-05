/**
 * Statistical Processor Service
 * 
 * Computes statistics, probabilities, and distributions from time series data
 */

class Processor {
  /**
   * Compute comprehensive statistics from data array
   * @param {Array} dataPoints - Array of {date, value} objects
   * @param {number} threshold - Optional threshold for exceedance probability
   * @returns {Object} Statistics object
   */
  computeStats(dataPoints, threshold = null) {
    // Extract values and filter out null/undefined/NaN
    const values = dataPoints
      .map(d => d.value)
      .filter(v => v !== null && v !== undefined && !isNaN(v));

    if (values.length === 0) {
      return {
        error: 'No valid data points',
        count: 0
      };
    }

    // Sort values for percentile calculation
    const sorted = [...values].sort((a, b) => a - b);

    // Basic statistics
    const stats = {
      count: values.length,
      mean: this.mean(values),
      median: this.median(sorted),
      std: this.standardDeviation(values),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      percentiles: {
        p10: this.percentile(sorted, 10),
        p25: this.percentile(sorted, 25),
        p50: this.percentile(sorted, 50),
        p75: this.percentile(sorted, 75),
        p90: this.percentile(sorted, 90),
        p95: this.percentile(sorted, 95),
        p99: this.percentile(sorted, 99)
      }
    };

    // Exceedance probability if threshold provided
    if (threshold !== null) {
      const exceedCount = values.filter(v => v > threshold).length;
      stats.exceedance = {
        threshold,
        probability: exceedCount / values.length,
        count: exceedCount,
        percentage: ((exceedCount / values.length) * 100).toFixed(1)
      };
    }

    // Generate histogram
    stats.distribution = this.createHistogram(values, 20);

    return stats;
  }

  /**
   * Calculate mean (average)
   */
  mean(values) {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate median (50th percentile)
   */
  median(sortedValues) {
    const mid = Math.floor(sortedValues.length / 2);
    if (sortedValues.length % 2 === 0) {
      return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
    }
    return sortedValues[mid];
  }

  /**
   * Calculate standard deviation
   */
  standardDeviation(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Calculate percentile
   */
  percentile(sortedValues, p) {
    if (sortedValues.length === 0) return null;
    
    const index = (p / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Create histogram bins and counts
   */
  createHistogram(values, numBins = 20) {
    if (values.length === 0) {
      return { bins: [], counts: [] };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / numBins;

    const bins = [];
    const counts = new Array(numBins).fill(0);

    // Create bin edges
    for (let i = 0; i <= numBins; i++) {
      bins.push(min + i * binWidth);
    }

    // Count values in each bin
    values.forEach(v => {
      let binIndex = Math.floor((v - min) / binWidth);
      if (binIndex >= numBins) binIndex = numBins - 1; // Edge case for max value
      if (binIndex < 0) binIndex = 0;
      counts[binIndex]++;
    });

    return {
      bins: bins.map(b => parseFloat(b.toFixed(2))),
      counts,
      binWidth: parseFloat(binWidth.toFixed(2))
    };
  }

  /**
   * Analyze trend over time (optional advanced feature)
   * Groups data by year and computes trend
   */
  analyzeTrend(dataPoints) {
    const yearlyMeans = {};

    dataPoints.forEach(point => {
      const year = point.year || parseInt(point.date.split('-')[0]);
      if (!yearlyMeans[year]) {
        yearlyMeans[year] = [];
      }
      yearlyMeans[year].push(point.value);
    });

    const trendData = Object.keys(yearlyMeans)
      .sort()
      .map(year => ({
        year: parseInt(year),
        mean: this.mean(yearlyMeans[year]),
        count: yearlyMeans[year].length
      }));

    // Simple linear regression
    const slope = this.linearRegression(trendData);

    return {
      yearlyMeans: trendData,
      trend: {
        slope: slope.toFixed(4),
        direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
        changePerDecade: (slope * 10).toFixed(2)
      }
    };
  }

  /**
   * Simple linear regression to find trend slope
   */
  linearRegression(data) {
    const n = data.length;
    if (n < 2) return 0;

    const sumX = data.reduce((sum, d) => sum + d.year, 0);
    const sumY = data.reduce((sum, d) => sum + d.mean, 0);
    const sumXY = data.reduce((sum, d) => sum + d.year * d.mean, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.year * d.year, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Generate textual summary of conditions
   */
  generateSummary(stats, variable, threshold) {
    let summary = '';

    if (stats.exceedance) {
      const prob = stats.exceedance.percentage;
      summary = `There is a ${prob}% chance that ${variable} will exceed ${threshold} based on historical data (${stats.count} observations).`;
      
      if (prob < 10) {
        summary += ' This is a rare occurrence.';
      } else if (prob < 30) {
        summary += ' This happens occasionally.';
      } else if (prob < 60) {
        summary += ' This is fairly common.';
      } else {
        summary += ' This is very likely.';
      }
    } else {
      summary = `Historical ${variable}: mean=${stats.mean.toFixed(1)}, median=${stats.median.toFixed(1)}, range=[${stats.min.toFixed(1)}, ${stats.max.toFixed(1)}]`;
    }

    return summary;
  }

  /**
   * Check data quality
   */
  assessDataQuality(dataPoints) {
    const total = dataPoints.length;
    const valid = dataPoints.filter(d => 
      d.value !== null && 
      d.value !== undefined && 
      !isNaN(d.value)
    ).length;

    const missing = total - valid;
    const missingPercent = (missing / total * 100).toFixed(1);

    return {
      total,
      valid,
      missing,
      missingPercent,
      quality: missingPercent < 10 ? 'good' : missingPercent < 30 ? 'fair' : 'poor',
      warning: missingPercent > 30 ? 'High percentage of missing data may affect reliability' : null
    };
  }
}

module.exports = new Processor();
