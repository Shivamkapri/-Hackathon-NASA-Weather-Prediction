const dataFetcher = require('../services/dataFetcher');
const processor = require('../services/processor');
const cache = require('../services/cache');
const csvWriter = require('../utils/csvWriter');
const nasaConfig = require('../config/nasa');
const SavedQuery = require('../models/SavedQuery');

/**
 * Weather Query Controller
 * 
 * Main business logic for processing weather queries
 */

class WeatherController {
  /**
   * Main query endpoint - POST /api/v1/weather/query
   * Fetches historical data and computes statistics
   */
  async query(req, res, next) {
    try {
      const params = req.validatedData;
      
      console.log('🔍 Processing weather query:', {
        lat: params.lat,
        lon: params.lon,
        variable: params.variable,
        dayOfYear: params.dayOfYear
      });

      // Generate cache key
      const cacheKey = cache.generateKey(params);

      // Check cache first
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        return res.json({
          success: true,
          cached: true,
          ...cachedResult
        });
      }

      // Fetch data from NASA sources
      const timeseries = await dataFetcher.fetchPointTimeSeries(
        params.lat,
        params.lon,
        params.variable,
        params.dayOfYear,
        params.window,
        params.yearRange
      );

      if (!timeseries || timeseries.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data available for the specified location and time period'
        });
      }

      // Compute statistics
      const stats = processor.computeStats(timeseries, params.threshold);

      // Assess data quality
      const quality = processor.assessDataQuality(timeseries);

      // Analyze trend (optional)
      const trend = processor.analyzeTrend(timeseries);

      // Generate summary text
      const summary = processor.generateSummary(
        stats,
        params.variable,
        params.threshold
      );

      // Get variable metadata
      const varConfig = nasaConfig.variables[params.variable];

      // Build metadata
      const meta = {
        variable: params.variable,
        units: varConfig.displayUnits,
        lat: params.lat,
        lon: params.lon,
        locationName: params.locationName || `${params.lat}, ${params.lon}`,
        dayOfYear: params.dayOfYear,
        window: params.window,
        yearRange: params.yearRange,
        dataSource: 'NASA GES DISC / Giovanni',
        queryDate: new Date().toISOString(),
        quality
      };

      // Generate CSV export
      const csvFilename = await csvWriter.generateCSV(timeseries, meta, stats);
      const downloadUrl = csvWriter.getPublicURL(csvFilename);

      // Build response
      const result = {
        success: true,
        meta,
        stats,
        trend,
        summary,
        distribution: stats.distribution,
        timeseries: timeseries.slice(0, 100), // Limit to 100 points in response (full data in CSV)
        downloadUrl,
        cached: false
      };

      // Cache the result
      cache.set(cacheKey, result);

      // Optionally save to database for history
      if (process.env.NODE_ENV !== 'development') {
        try {
          const savedQuery = new SavedQuery({
            latitude: params.lat,
            longitude: params.lon,
            dayOfYear: params.dayOfYear,
            variable: params.variable,
            threshold: params.threshold,
            window: params.window,
            yearRange: params.yearRange,
            locationName: params.locationName,
            results: result
          });
          await savedQuery.save();
        } catch (dbError) {
          console.warn('⚠️  Failed to save query to database:', dbError.message);
          // Don't fail the request if DB save fails
        }
      }

      res.json(result);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Download CSV file - GET /api/v1/weather/download/:filename
   */
  async downloadCSV(req, res, next) {
    try {
      const { filename } = req.params;
      const filepath = require('path').join(__dirname, '..', 'exports', filename);

      // Security check - ensure filename doesn't contain path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename'
        });
      }

      // Check if file exists
      if (!require('fs').existsSync(filepath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found or expired'
        });
      }

      res.download(filepath);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get saved queries - GET /api/v1/weather/history
   */
  async getHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const queries = await SavedQuery.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .select('-results'); // Don't return full results, just metadata

      const total = await SavedQuery.countDocuments();

      res.json({
        success: true,
        data: queries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cache statistics - GET /api/v1/weather/cache-stats
   */
  getCacheStats(req, res) {
    const stats = cache.getStats();
    res.json({
      success: true,
      cache: stats
    });
  }

  /**
   * Clear cache - DELETE /api/v1/weather/cache
   */
  clearCache(req, res) {
    cache.flush();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  }

  /**
   * Get supported variables - GET /api/v1/weather/variables
   */
  getVariables(req, res) {
    const variables = Object.entries(nasaConfig.variables).map(([key, config]) => ({
      name: key,
      code: config.code,
      units: config.displayUnits,
      description: config.description
    }));

    res.json({
      success: true,
      variables
    });
  }
}

module.exports = new WeatherController();
