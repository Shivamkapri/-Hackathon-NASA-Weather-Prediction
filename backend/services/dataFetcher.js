const axios = require('axios');
const nasaConfig = require('../config/nasa');

/**
 * Data Fetcher Service
 * 
 * Handles fetching historical weather data from NASA sources
 * Currently implements mock data - will be extended to real NASA APIs
 */

class DataFetcher {
  constructor() {
    this.config = nasaConfig;
  }

  /**
   * Fetch time series data for a point location
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} variable - Variable name (temperature, precipitation, etc.)
   * @param {number} dayOfYear - Target day of year (1-366)
   * @param {number} window - Window around target day (±days)
   * @param {object} yearRange - {start, end} years
   * @returns {Promise<Array>} Array of {date, value} objects
   */
  async fetchPointTimeSeries(lat, lon, variable, dayOfYear, window, yearRange) {
    console.log(`📡 Fetching data for: lat=${lat}, lon=${lon}, variable=${variable}, day=${dayOfYear}`);

    // For hackathon: Start with mock data generator
    // TODO: Replace with real NASA API calls
    const useMockData = process.env.USE_MOCK_DATA !== 'false';

    if (useMockData) {
      return this.generateMockData(lat, lon, variable, dayOfYear, window, yearRange);
    } else {
      // Real NASA API integration
      return this.fetchRealNASAData(lat, lon, variable, dayOfYear, window, yearRange);
    }
  }

  /**
   * Generate realistic mock data for testing
   * Simulates historical weather patterns
   */
  generateMockData(lat, lon, variable, dayOfYear, window, yearRange) {
    const data = [];
    const varConfig = this.config.variables[variable];

    for (let year = yearRange.start; year <= yearRange.end; year++) {
      for (let day = dayOfYear - window; day <= dayOfYear + window; day++) {
        // Handle day-of-year wrap-around
        let actualDay = day;
        let actualYear = year;
        
        if (day < 1) {
          actualDay = 365 + day; // Wrap to previous year end
          actualYear = year - 1;
        } else if (day > 365) {
          actualDay = day - 365; // Wrap to next year start
          actualYear = year + 1;
        }

        // Generate realistic values based on variable type
        let value;
        switch (variable) {
          case 'temperature':
            // Simulate seasonal pattern + random variation
            const seasonalTemp = 15 + 15 * Math.sin((actualDay - 80) * 2 * Math.PI / 365);
            value = seasonalTemp + (Math.random() - 0.5) * 10; // ±5°C variation
            break;

          case 'precipitation':
            // Precipitation is more sporadic (many zeros, occasional high values)
            value = Math.random() < 0.7 ? 0 : Math.random() * 50; // 70% dry days
            break;

          case 'windspeed':
            // Wind speed typically 0-20 m/s
            value = Math.abs(5 + (Math.random() - 0.5) * 10);
            break;

          case 'humidity':
            // Humidity 20-100%
            value = 40 + Math.random() * 50;
            break;

          case 'dust':
            // Dust aerosol (lower values, occasional spikes)
            value = Math.random() * 0.5;
            break;

          default:
            value = Math.random() * 100;
        }

        // Apply unit conversion if needed
        if (varConfig && varConfig.conversion) {
          value = varConfig.conversion(value);
        }

        // Create date string
        const date = this.dayOfYearToDate(actualYear, actualDay);

        data.push({
          date: date.toISOString().split('T')[0],
          value: parseFloat(value.toFixed(2)),
          year: actualYear,
          dayOfYear: actualDay
        });
      }
    }

    console.log(`✅ Generated ${data.length} mock data points`);
    return data;
  }

  /**
   * Fetch real data from NASA APIs
   * TODO: Implement actual API calls to Giovanni/OPeNDAP
   */
  async fetchRealNASAData(lat, lon, variable, dayOfYear, window, yearRange) {
    // Example structure for Giovanni API call
    try {
      const varConfig = this.config.variables[variable];
      
      // Build request parameters
      const params = {
        lat,
        lon,
        variable: varConfig.code,
        startDate: `${yearRange.start}-01-01`,
        endDate: `${yearRange.end}-12-31`,
        // Add more NASA-specific parameters
      };

      // Example: Giovanni time series endpoint
      // const response = await axios.get(this.config.giovanni.baseURL, { params });
      
      // For now, fall back to mock data
      console.warn('⚠️  Real NASA API not yet implemented, using mock data');
      return this.generateMockData(lat, lon, variable, dayOfYear, window, yearRange);

    } catch (error) {
      console.error('❌ Error fetching NASA data:', error.message);
      throw new Error(`Failed to fetch data from NASA: ${error.message}`);
    }
  }

  /**
   * Convert day-of-year to Date object
   */
  dayOfYearToDate(year, dayOfYear) {
    const date = new Date(year, 0, 1);
    date.setDate(dayOfYear);
    return date;
  }

  /**
   * Fetch data for multiple variables at once
   */
  async fetchMultipleVariables(lat, lon, variables, dayOfYear, window, yearRange) {
    const promises = variables.map(variable =>
      this.fetchPointTimeSeries(lat, lon, variable, dayOfYear, window, yearRange)
    );
    return Promise.all(promises);
  }
}

module.exports = new DataFetcher();
