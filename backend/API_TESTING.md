# API Testing Examples

## Test 1: Basic Temperature Query (New York, July 4th)
```bash
curl -X POST http://localhost:5000/api/v1/weather/query \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 40.7128,
    "lon": -74.0060,
    "dayOfYear": 185,
    "variable": "temperature",
    "threshold": 30,
    "window": 7
  }'
```

## Test 2: Precipitation Query with Date (Mumbai, Monsoon Season)
```bash
curl -X POST http://localhost:5000/api/v1/weather/query \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 19.0760,
    "lon": 72.8777,
    "date": "2024-07-15",
    "variable": "precipitation",
    "threshold": 50,
    "window": 10
  }'
```

## Test 3: Wind Speed Query (Miami, Hurricane Season)
```bash
curl -X POST http://localhost:5000/api/v1/weather/query \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 25.7617,
    "lon": -80.1918,
    "dayOfYear": 250,
    "variable": "windspeed",
    "threshold": 15,
    "window": 14
  }'
```

## Test 4: Get Supported Variables
```bash
curl http://localhost:5000/api/v1/weather/variables
```

## Test 5: Get Cache Statistics
```bash
curl http://localhost:5000/api/v1/weather/cache-stats
```

## Test 6: Health Check
```bash
curl http://localhost:5000/health
```

## Test 7: Invalid Request (Should Return 400)
```bash
curl -X POST http://localhost:5000/api/v1/weather/query \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 1000,
    "lon": -74.0060,
    "variable": "temperature"
  }'
```

## Using HTTPie (if installed)
```bash
# Install: pip install httpie

http POST localhost:5000/api/v1/weather/query \
  lat:=40.7128 \
  lon:=-74.0060 \
  dayOfYear:=185 \
  variable=temperature \
  threshold:=30
```

## Using Postman

1. Create new POST request to `http://localhost:5000/api/v1/weather/query`
2. Set Headers: `Content-Type: application/json`
3. Set Body (raw JSON):
```json
{
  "lat": 40.7128,
  "lon": -74.0060,
  "dayOfYear": 185,
  "variable": "temperature",
  "threshold": 30,
  "window": 7
}
```
4. Send and view response

## JavaScript/Node.js Example
```javascript
const axios = require('axios');

async function testAPI() {
  try {
    const response = await axios.post('http://localhost:5000/api/v1/weather/query', {
      lat: 40.7128,
      lon: -74.0060,
      date: '2024-07-04',
      variable: 'temperature',
      threshold: 30
    });
    
    console.log('Summary:', response.data.summary);
    console.log('Probability:', response.data.stats.exceedance);
    console.log('Download:', response.data.downloadUrl);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();
```

## Python Example
```python
import requests

url = 'http://localhost:5000/api/v1/weather/query'
data = {
    'lat': 40.7128,
    'lon': -74.0060,
    'date': '2024-07-04',
    'variable': 'temperature',
    'threshold': 30
}

response = requests.post(url, json=data)
result = response.json()

print('Summary:', result['summary'])
print('Mean Temperature:', result['stats']['mean'])
print('Exceedance Probability:', result['stats']['exceedance']['percentage'])
```
