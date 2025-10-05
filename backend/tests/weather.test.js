const request = require('supertest');
const app = require('../index');

describe('Weather API Tests', () => {
  
  describe('POST /api/v1/weather/query', () => {
    it('should return weather statistics for valid query', async () => {
      const response = await request(app)
        .post('/api/v1/weather/query')
        .send({
          lat: 40.7128,
          lon: -74.0060,
          dayOfYear: 180,
          variable: 'temperature',
          threshold: 30,
          window: 7
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.mean).toBeDefined();
      expect(response.body.stats.exceedance).toBeDefined();
      expect(response.body.downloadUrl).toBeDefined();
    });

    it('should reject invalid latitude', async () => {
      const response = await request(app)
        .post('/api/v1/weather/query')
        .send({
          lat: 100, // Invalid
          lon: -74.0060,
          dayOfYear: 180,
          variable: 'temperature'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/weather/query')
        .send({
          lat: 40.7128,
          lon: -74.0060
          // Missing dayOfYear and variable
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should convert date to dayOfYear', async () => {
      const response = await request(app)
        .post('/api/v1/weather/query')
        .send({
          lat: 40.7128,
          lon: -74.0060,
          date: '2023-07-04', // July 4th
          variable: 'temperature'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.dayOfYear).toBe(185); // Approximately
    });
  });

  describe('GET /api/v1/weather/variables', () => {
    it('should return list of supported variables', async () => {
      const response = await request(app)
        .get('/api/v1/weather/variables')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.variables).toBeInstanceOf(Array);
      expect(response.body.variables.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/weather/cache-stats', () => {
    it('should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/v1/weather/cache-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cache).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });
});
