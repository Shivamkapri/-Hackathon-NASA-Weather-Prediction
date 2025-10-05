const Joi = require('joi');

/**
 * Input Validation Schemas using Joi
 */

const weatherQuerySchema = Joi.object({
  // Location (required)
  lat: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),

  lon: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),

  // Time (day of year OR date)
  dayOfYear: Joi.number()
    .integer()
    .min(1)
    .max(366)
    .messages({
      'number.base': 'Day of year must be a number',
      'number.integer': 'Day of year must be an integer',
      'number.min': 'Day of year must be between 1 and 366',
      'number.max': 'Day of year must be between 1 and 366'
    }),

  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format'
    }),

  // Variable (required)
  variable: Joi.string()
    .valid('temperature', 'precipitation', 'windspeed', 'humidity', 'dust')
    .required()
    .messages({
      'any.only': 'Variable must be one of: temperature, precipitation, windspeed, humidity, dust',
      'any.required': 'Variable is required'
    }),

  // Optional parameters
  threshold: Joi.number()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Threshold must be a number'
    }),

  window: Joi.number()
    .integer()
    .min(0)
    .max(30)
    .default(7)
    .messages({
      'number.base': 'Window must be a number',
      'number.integer': 'Window must be an integer',
      'number.min': 'Window must be at least 0',
      'number.max': 'Window cannot exceed 30 days'
    }),

  yearRange: Joi.object({
    start: Joi.number()
      .integer()
      .min(1980)
      .max(2023)
      .default(1980),
    end: Joi.number()
      .integer()
      .min(1980)
      .max(2023)
      .default(2023)
  }).default({ start: 1980, end: 2023 }),

  // Optional location name
  locationName: Joi.string()
    .max(200)
    .optional()

}).or('dayOfYear', 'date') // Must provide either dayOfYear or date
  .messages({
    'object.missing': 'Either dayOfYear or date must be provided'
  });

/**
 * Validate request body against schema
 */
const validateWeatherQuery = (req, res, next) => {
  const { error, value } = weatherQuerySchema.validate(req.body, {
    abortEarly: false, // Return all errors, not just the first
    stripUnknown: true // Remove unknown fields
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Convert date to dayOfYear if date was provided
  if (value.date && !value.dayOfYear) {
    const date = new Date(value.date);
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    value.dayOfYear = Math.floor(diff / oneDay) + 1;
  }

  // Attach validated data to request
  req.validatedData = value;
  next();
};

module.exports = {
  weatherQuerySchema,
  validateWeatherQuery
};
