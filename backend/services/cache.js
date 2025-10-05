const NodeCache = require('node-cache');

/**
 * Cache Service
 * 
 * In-memory cache for query results to improve performance
 * For production, consider Redis for distributed caching
 */

class CacheService {
  constructor() {
    // TTL in seconds (default 1 hour)
    this.cache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL) || 3600,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false // Better performance, but be careful with mutations
    });

    // Track stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  /**
   * Generate cache key from query parameters
   */
  generateKey(params) {
    const { lat, lon, variable, dayOfYear, window, yearRange } = params;
    return `query:${lat}:${lon}:${variable}:${dayOfYear}:${window}:${yearRange.start}:${yearRange.end}`;
  }

  /**
   * Get value from cache
   */
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      console.log(`🎯 Cache HIT: ${key}`);
      return value;
    }
    this.stats.misses++;
    console.log(`❌ Cache MISS: ${key}`);
    return null;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null) {
    const success = ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value);
    if (success) {
      this.stats.sets++;
      console.log(`💾 Cache SET: ${key}`);
    }
    return success;
  }

  /**
   * Delete key from cache
   */
  delete(key) {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  flush() {
    this.cache.flushAll();
    console.log('🧹 Cache flushed');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.cache.keys();
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      keys: keys.length,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      hitRate: `${hitRate}%`,
      memoryUsage: this.cache.getStats()
    };
  }
}

module.exports = new CacheService();
