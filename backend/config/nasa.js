/**
 * NASA Data Sources Configuration
 * 
 * This file contains endpoints and configuration for NASA Earth observation data sources
 */

module.exports = {
  // GES DISC Giovanni API
  giovanni: {
    baseURL: 'https://giovanni.gsfc.nasa.gov/giovanni/daac-bin',
    endpoints: {
      timeSeries: '/wms_ag4?',
    },
    defaultParams: {
      service: 'WMS',
      version: '1.1.0',
      request: 'GetMap',
    }
  },

  // GES DISC OPeNDAP (Hyrax)
  opendap: {
    baseURL: 'https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap',
    datasets: {
      // MERRA-2 2-meter Temperature (daily)
      t2m: '/MERRA2/M2SDNXSLV.5.12.4/',
      // GPM Precipitation
      precipitation: '/GPM_L3/GPM_3IMERGDF.06/',
      // MERRA-2 10-meter Wind Speed
      wind: '/MERRA2/M2SDNXSLV.5.12.4/',
    }
  },

  // Earthdata Search
  earthdata: {
    baseURL: 'https://cmr.earthdata.nasa.gov/search',
    auth: {
      username: process.env.NASA_EARTHDATA_USERNAME,
      password: process.env.NASA_EARTHDATA_PASSWORD,
    }
  },

  // Variable Definitions (for mapping user requests to dataset variables)
  variables: {
    temperature: {
      code: 't2m',
      units: 'K',
      displayUnits: '°C',
      description: '2-meter air temperature',
      conversion: (k) => k - 273.15, // Kelvin to Celsius
    },
    precipitation: {
      code: 'precip',
      units: 'mm/day',
      displayUnits: 'mm/day',
      description: 'Daily precipitation',
      conversion: (v) => v, // Already in mm/day
    },
    windspeed: {
      code: 'wnd10m',
      units: 'm/s',
      displayUnits: 'm/s',
      description: '10-meter wind speed',
      conversion: (v) => v,
    },
    humidity: {
      code: 'rh2m',
      units: '%',
      displayUnits: '%',
      description: '2-meter relative humidity',
      conversion: (v) => v,
    },
    dust: {
      code: 'dust',
      units: 'kg/m^2',
      displayUnits: 'kg/m²',
      description: 'Dust aerosol optical depth',
      conversion: (v) => v,
    }
  },

  // Default Query Parameters
  defaults: {
    startYear: 1980,
    endYear: 2023,
    window: 7, // ±7 days around target day-of-year
  }
};
