const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

/**
 * CSV Writer Utility
 * 
 * Generates CSV files from query results
 */

class CSVWriter {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'exports');
    this.ensureDirectoryExists();
  }

  /**
   * Ensure exports directory exists
   */
  ensureDirectoryExists() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate CSV file from time series data
   * @param {Array} timeseries - Array of data points
   * @param {Object} meta - Metadata about the query
   * @param {Object} stats - Statistical results
   * @returns {Promise<string>} Path to generated CSV file
   */
  async generateCSV(timeseries, meta, stats) {
    const timestamp = Date.now();
    const filename = `weather_data_${meta.variable}_${timestamp}.csv`;
    const filepath = path.join(this.outputDir, filename);

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'year', title: 'Year' },
        { id: 'dayOfYear', title: 'Day of Year' },
        { id: 'value', title: `${meta.variable} (${meta.units})` }
      ]
    });

    // Write data
    await csvWriter.writeRecords(timeseries);

    // Append metadata and statistics as comments at the end
    const metadataLines = [
      '\n# Metadata',
      `# Location: ${meta.lat}, ${meta.lon}`,
      `# Variable: ${meta.variable}`,
      `# Units: ${meta.units}`,
      `# Day of Year: ${meta.dayOfYear} ±${meta.window} days`,
      `# Year Range: ${meta.yearRange.start}-${meta.yearRange.end}`,
      `# Data Source: ${meta.dataSource}`,
      `# Generated: ${new Date().toISOString()}`,
      '\n# Statistics',
      `# Count: ${stats.count}`,
      `# Mean: ${stats.mean?.toFixed(2)}`,
      `# Median: ${stats.median?.toFixed(2)}`,
      `# Std Dev: ${stats.std?.toFixed(2)}`,
      `# Min: ${stats.min?.toFixed(2)}`,
      `# Max: ${stats.max?.toFixed(2)}`,
      `# P10: ${stats.percentiles?.p10?.toFixed(2)}`,
      `# P25: ${stats.percentiles?.p25?.toFixed(2)}`,
      `# P75: ${stats.percentiles?.p75?.toFixed(2)}`,
      `# P90: ${stats.percentiles?.p90?.toFixed(2)}`,
    ];

    if (stats.exceedance) {
      metadataLines.push(
        `# Threshold: ${stats.exceedance.threshold}`,
        `# Exceedance Probability: ${stats.exceedance.percentage}%`
      );
    }

    fs.appendFileSync(filepath, metadataLines.join('\n'));

    console.log(`📄 CSV generated: ${filename}`);
    return filename;
  }

  /**
   * Get public URL for CSV file
   */
  getPublicURL(filename) {
    return `/api/v1/weather/download/${filename}`;
  }

  /**
   * Clean up old export files (older than 24 hours)
   */
  cleanupOldFiles() {
    const files = fs.readdirSync(this.outputDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    files.forEach(file => {
      const filepath = path.join(this.outputDir, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filepath);
        console.log(`🧹 Deleted old export: ${file}`);
      }
    });
  }
}

module.exports = new CSVWriter();
