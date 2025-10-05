const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { validateWeatherQuery } = require('../middleware/validator');

/**
 * Weather API Routes
 * Base path: /api/v1/weather
 */

// Main query endpoint
// POST /api/v1/weather/query
// Body: { lat, lon, dayOfYear (or date), variable, threshold?, window?, yearRange? }
router.post('/query', validateWeatherQuery, weatherController.query);

// Download CSV export
// GET /api/v1/weather/download/:filename
router.get('/download/:filename', weatherController.downloadCSV);

// Get query history
// GET /api/v1/weather/history?page=1&limit=20
router.get('/history', weatherController.getHistory);

// Get cache statistics (useful for debugging)
// GET /api/v1/weather/cache-stats
router.get('/cache-stats', weatherController.getCacheStats);

// Clear cache (admin endpoint)
// DELETE /api/v1/weather/cache
router.delete('/cache', weatherController.clearCache);

// Get supported variables and their metadata
// GET /api/v1/weather/variables
router.get('/variables', weatherController.getVariables);

module.exports = router;
