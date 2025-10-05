# NASA Weather Prediction Backend API


to test in cmmd write  curl -X POST "http://localhost:5000/api/v1/weather/query" -H "Content-Type: application/json" -d "{\"lat\":40.7128,\"lon\":-74.0060,\"dayOfYear\":185,\"variable\":\"temperature\",\"threshold\":30}"


Backend API for the NASA Space Apps Challenge 2025 - "Will It Rain On My Parade?"

## 🚀 Features

- **Historical Weather Analysis**: Compute probabilities based on decades of NASA Earth observation data
- **Statistical Processing**: Mean, median, percentiles, exceedance probabilities
- **Multiple Variables**: Temperature, precipitation, wind speed, humidity, dust/aerosol
- **Smart Caching**: Fast response times with intelligent caching
- **CSV Export**: Download raw data with metadata
- **Data Visualization Ready**: Returns histogram and time series data
- **Robust Validation**: Input validation with detailed error messages
- **Production Ready**: Rate limiting, CORS, security headers, error handling

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB (optional for development)
- NASA Earthdata account (for real data integration)

## 🛠️ Installation

1. **Clone and navigate to backend directory**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `NASA_EARTHDATA_USERNAME`: Your NASA Earthdata username
- `NASA_EARTHDATA_PASSWORD`: Your NASA Earthdata password

4. **Start the server**:

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api/v1/weather
```

### 1. Query Weather Data

**POST** `/query`

Get historical weather statistics for a location and date.

**Request Body**:
```json
{
  "lat": 40.7128,
  "lon": -74.0060,
  "dayOfYear": 185,
  "variable": "temperature",
  "threshold": 30,
  "window": 7,
  "yearRange": {
    "start": 1980,
    "end": 2023
  }
}
```

**Parameters**:
- `lat` (number, required): Latitude (-90 to 90)
- `lon` (number, required): Longitude (-180 to 180)
- `dayOfYear` (number): Day of year (1-366) OR `date` (YYYY-MM-DD)
- `variable` (string, required): One of: `temperature`, `precipitation`, `windspeed`, `humidity`, `dust`
- `threshold` (number, optional): Threshold for exceedance probability
- `window` (number, optional): Days around target date (default: 7)
- `yearRange` (object, optional): Year range for analysis

**Response**:
```json
{
  "success": true,
  "meta": {
    "variable": "temperature",
    "units": "°C",
    "lat": 40.7128,
    "lon": -74.0060,
    "dayOfYear": 185,
    "window": 7,
    "yearRange": { "start": 1980, "end": 2023 },
    "dataSource": "NASA GES DISC / Giovanni",
    "quality": {
      "total": 644,
      "valid": 644,
      "missing": 0,
      "quality": "good"
    }
  },
  "stats": {
    "count": 644,
    "mean": 24.5,
    "median": 24.3,
    "std": 3.2,
    "min": 15.2,
    "max": 34.8,
    "percentiles": {
      "p10": 19.5,
      "p25": 22.1,
      "p50": 24.3,
      "p75": 26.8,
      "p90": 29.2
    },
    "exceedance": {
      "threshold": 30,
      "probability": 0.15,
      "count": 97,
      "percentage": "15.0"
    }
  },
  "trend": {
    "yearlyMeans": [...],
    "trend": {
      "slope": "0.0234",
      "direction": "increasing",
      "changePerDecade": "0.23"
    }
  },
  "summary": "There is a 15.0% chance that temperature will exceed 30 based on historical data (644 observations). This happens occasionally.",
  "distribution": {
    "bins": [15.2, 16.2, 17.2, ...],
    "counts": [5, 12, 23, ...],
    "binWidth": 1.0
  },
  "timeseries": [
    { "date": "1980-07-01", "value": 23.5, "year": 1980, "dayOfYear": 183 },
    ...
  ],
  "downloadUrl": "/api/v1/weather/download/weather_data_temperature_1234567890.csv",
  "cached": false
}
```

### 2. Download CSV Export

**GET** `/download/:filename`

Download CSV file with full data and metadata.

### 3. Get Supported Variables

**GET** `/variables`

Get list of available weather variables.

**Response**:
```json
{
  "success": true,
  "variables": [
    {
      "name": "temperature",
      "code": "t2m",
      "units": "°C",
      "description": "2-meter air temperature"
    },
    ...
  ]
}
```

### 4. Get Query History

**GET** `/history?page=1&limit=20`

Get previously executed queries (requires MongoDB).

### 5. Cache Management

**GET** `/cache-stats` - Get cache statistics
**DELETE** `/cache` - Clear cache (admin)

## 🧪 Testing

Run tests:
```bash
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

## 📊 Data Sources

Currently uses mock data for rapid development. To integrate real NASA data:

1. Create NASA Earthdata account at https://urs.earthdata.nasa.gov/
2. Add credentials to `.env`
3. Set `USE_MOCK_DATA=false` in `.env`
4. Implement NASA API calls in `services/dataFetcher.js`

### NASA Data Sources:
- **GES DISC Giovanni**: Time series extraction
- **OPeNDAP (Hyrax)**: Direct NetCDF access
- **Earthdata Search**: Dataset discovery

## 🏗️ Project Structure

```
backend/
├── config/
│   ├── db.js                 # MongoDB configuration
│   └── nasa.js              # NASA API endpoints & variables
├── controllers/
│   └── weatherController.js # Business logic
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   └── validator.js         # Input validation
├── models/
│   └── SavedQuery.js        # MongoDB schema
├── routes/
│   └── weather.js           # API routes
├── services/
│   ├── cache.js             # Caching service
│   ├── dataFetcher.js       # NASA data fetching
│   └── processor.js         # Statistical processing
├── tests/
│   └── weather.test.js      # API tests
├── utils/
│   └── csvWriter.js         # CSV generation
├── exports/                 # Generated CSV files
├── index.js                 # Server entry point
├── package.json
└── .env.example
```

## 🔒 Security

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- CORS configured for frontend origin
- Input validation on all endpoints
- No sensitive data in error messages (production)

## 🚀 Deployment

### Environment Variables for Production:
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
NASA_EARTHDATA_USERNAME=your_username
NASA_EARTHDATA_PASSWORD=your_password
FRONTEND_URL=https://your-frontend-domain.com
```

### Deploy to:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **DigitalOcean App Platform**: Connect GitHub repo
- **AWS Elastic Beanstalk**: Package and deploy

## 📝 Example Usage

### Using cURL:
```bash
curl -X POST http://localhost:5000/api/v1/weather/query \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6139,
    "lon": 77.2090,
    "date": "2024-07-15",
    "variable": "precipitation",
    "threshold": 10
  }'
```

### Using JavaScript (fetch):
```javascript
const response = await fetch('http://localhost:5000/api/v1/weather/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lat: 28.6139,
    lon: 77.2090,
    date: '2024-07-15',
    variable: 'precipitation',
    threshold: 10
  })
});

const data = await response.json();
console.log(data.summary);
```

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Submit PR

## 📄 License

MIT License - NASA Space Apps Challenge 2025

## 🆘 Troubleshooting

**MongoDB connection fails**:
- Make sure MongoDB is running locally or use MongoDB Atlas
- Check `MONGODB_URI` in `.env`
- Server will run without DB in development mode

**Rate limit errors**:
- Adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`
- Clear cache: `DELETE /api/v1/weather/cache`

**Mock data only**:
- This is expected for initial development
- Set `USE_MOCK_DATA=false` when NASA API integration is complete

## 📞 Support

For NASA Space Apps Challenge:
- Check documentation: https://www.spaceappschallenge.org/
- NASA Earthdata: https://earthdata.nasa.gov/

---

Built with ❤️ for NASA Space Apps Challenge 2025



# Server Configuration
PORT=5000
NODE_ENV=development
tshivamkapri_db_user
SzvlGD5P0Po17Ld3
# MongoDB Configuration
MONGODB_URI=mongodb+srv://tshivamkapri_db_user:SzvlGD5P0Po17Ld3@cluster0.omoalay.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# NASA Earthdata Credentials (get from https://urs.earthdata.nasa.gov/)
NASA_EARTHDATA_USERNAME=your_username
NASA_EARTHDATA_PASSWORD=your_password

# API Configuration
API_VERSION=v1
CACHE_TTL=3600

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
.env.example
