const mongoose = require('mongoose');

/**
 * Schema for storing user queries and cached results
 * This helps with performance and allows users to save/revisit queries
 */
const savedQuerySchema = new mongoose.Schema({
  // Query Parameters
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  dayOfYear: {
    type: Number,
    required: true,
    min: 1,
    max: 366
  },
  variable: {
    type: String,
    required: true,
    enum: ['temperature', 'precipitation', 'windspeed', 'humidity', 'dust']
  },
  threshold: {
    type: Number,
    default: null
  },
  window: {
    type: Number,
    default: 7,
    min: 0,
    max: 30
  },
  yearRange: {
    start: {
      type: Number,
      default: 1980
    },
    end: {
      type: Number,
      default: 2023
    }
  },

  // Results (cached)
  results: {
    meta: mongoose.Schema.Types.Mixed,
    stats: mongoose.Schema.Types.Mixed,
    exceedance: mongoose.Schema.Types.Mixed,
    distribution: mongoose.Schema.Types.Mixed,
    timeseries: [mongoose.Schema.Types.Mixed]
  },

  // Metadata
  locationName: String,
  userId: String, // Optional: for user authentication
  queryHash: {
    type: String,
    unique: true,
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days TTL
    index: { expires: 0 } // Automatic deletion
  }
});

// Create compound index for fast lookups
savedQuerySchema.index({ latitude: 1, longitude: 1, dayOfYear: 1, variable: 1 });

// Method to generate query hash
savedQuerySchema.methods.generateHash = function() {
  const crypto = require('crypto');
  const queryString = `${this.latitude},${this.longitude},${this.dayOfYear},${this.variable},${this.window},${this.yearRange.start},${this.yearRange.end}`;
  return crypto.createHash('md5').update(queryString).digest('hex');
};

// Pre-save hook to generate hash
savedQuerySchema.pre('save', function(next) {
  if (!this.queryHash) {
    this.queryHash = this.generateHash();
  }
  next();
});

module.exports = mongoose.model('SavedQuery', savedQuerySchema);
