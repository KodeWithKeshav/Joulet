# Joulet API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
No authentication required for demo. In production, implement API key authentication.

---

## Health & Status Endpoints

### 1. Health Check
**Endpoint:** `GET /`

**Description:** Simple health check to verify API is running

**Response:**
```json
{
  "status": "healthy",
  "service": "Joulet Energy API Bridge",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

---

### 2. System Status
**Endpoint:** `GET /api/status`

**Description:** Get overall system status including oracle connection and metrics

**Response:**
```json
{
  "status": "ok",
  "oracle": {
    "connected": true,
    "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  "contract": {
    "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "status": "deployed"
  },
  "metrics": {
    "current_production": 2.5,
    "accumulated_energy": 7.5,
    "total_reported": 20.0,
    "reporting_threshold": 10,
    "last_report_time": "2024-01-15T10:25:00.000000",
    "reports_count": 2
  },
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

---

## Energy Data Endpoints

### 3. Add Energy Reading
**Endpoint:** `POST /api/energy/reading`

**Description:** Submit an energy reading from an IoT device. Automatically reports to blockchain when threshold is reached.

**Request Body:**
```json
{
  "kwh": 2.5,
  "device_id": "solar_panel_1",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Required Fields:**
- `kwh` (float): Energy produced in kilowatt-hours (must be >= 0)

**Optional Fields:**
- `device_id` (string): Identifier for the IoT device
- `timestamp` (string): ISO format timestamp

**Response:**
```json
{
  "success": true,
  "reading": {
    "kwh": 2.5,
    "device_id": "solar_panel_1",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "accumulated": 7.5,
  "should_report": false,
  "auto_reported": false,
  "metrics": {
    "current_production": 2.5,
    "accumulated_energy": 7.5,
    "total_reported": 20.0,
    "reporting_threshold": 10,
    "last_report_time": "2024-01-15T10:25:00.000000",
    "reports_count": 2
  }
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:5000/api/energy/reading \
  -H "Content-Type: application/json" \
  -d '{
    "kwh": 5.5,
    "device_id": "solar_panel_1"
  }'
```

---

### 4. Report Energy to Blockchain
**Endpoint:** `POST /api/energy/report`

**Description:** Manually submit accumulated energy to blockchain and mint tokens

**Request Body:**
```json
{
  "kwh_amount": 10.5,
  "producer_address": "0x70997970C51812e339D9B73b0245ad59422d3d12",
  "device_id": "solar_panel_1"
}
```

**Required Fields:**
- `kwh_amount` (float): Amount of energy to report (must be > 0)

**Optional Fields:**
- `producer_address` (string): Address to credit tokens to (default from env)
- `device_id` (string): Device identifier

**Response:**
```json
{
  "success": true,
  "message": "Reported 10.5 kWh to blockchain",
  "producer": "0x70997970C51812e339D9B73b0245ad59422d3d12",
  "kwh": 10.5,
  "metrics": {
    "current_production": 0,
    "accumulated_energy": 0,
    "total_reported": 30.5,
    "reporting_threshold": 10,
    "last_report_time": "2024-01-15T10:30:45.000000",
    "reports_count": 3
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to report energy to blockchain"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:5000/api/energy/report \
  -H "Content-Type: application/json" \
  -d '{
    "kwh_amount": 15.0,
    "producer_address": "0x70997970C51812e339D9B73b0245ad59422d3d12"
  }'
```

---

### 5. Get Energy Metrics
**Endpoint:** `GET /api/energy/metrics`

**Description:** Get current energy production and reporting metrics

**Response:**
```json
{
  "metrics": {
    "current_production": 2.5,
    "accumulated_energy": 7.5,
    "total_reported": 20.0,
    "reporting_threshold": 10,
    "last_report_time": "2024-01-15T10:25:00.000000",
    "reports_count": 2
  },
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

**Example with cURL:**
```bash
curl http://localhost:5000/api/energy/metrics
```

---

### 6. Get Report History
**Endpoint:** `GET /api/energy/history?limit=10`

**Description:** Get history of energy reports submitted to blockchain

**Query Parameters:**
- `limit` (integer, default=10): Number of records to return

**Response:**
```json
{
  "reports": [
    {
      "timestamp": "2024-01-15T10:25:00.000000",
      "amount": 10.0,
      "device": "solar_panel_1",
      "producer": "0x70997970C51812e339D9B73b0245ad59422d3d12"
    },
    {
      "timestamp": "2024-01-15T10:15:00.000000",
      "amount": 10.0,
      "device": "solar_panel_1",
      "producer": "0x70997970C51812e339D9B73b0245ad59422d3d12"
    }
  ],
  "total_reports": 2,
  "total_energy_reported": 20.0,
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

**Example with cURL:**
```bash
curl "http://localhost:5000/api/energy/history?limit=5"
```

---

### 7. Reset Metrics (Testing)
**Endpoint:** `POST /api/energy/reset`

**Description:** Reset all energy metrics (useful for testing). Do NOT use in production.

**Response:**
```json
{
  "message": "Metrics reset",
  "metrics": {
    "current_production": 0,
    "accumulated_energy": 0,
    "total_reported": 0,
    "reporting_threshold": 10,
    "last_report_time": null,
    "reports_count": 0
  }
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:5000/api/energy/reset
```

---

## Configuration Endpoints

### 8. Get Configuration
**Endpoint:** `GET /api/config`

**Description:** Get non-sensitive API configuration

**Response:**
```json
{
  "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "rpc_url": "http://127.0.0.1:8545",
  "producer_address": "0x70997970C51812e339D9B73b0245ad59422d3d12",
  "reporting_threshold": 10,
  "api_version": "1.0.0"
}
```

**Example with cURL:**
```bash
curl http://localhost:5000/api/config
```

---

## Testing Endpoints

### 9. Simulate Energy Reading (Testing Only)
**Endpoint:** `POST /api/test/simulate?kwh=3.5`

**Description:** Simulate an energy reading without real IoT device. For testing purposes only.

**Query Parameters:**
- `kwh` (float, default=3.5): Amount of energy to simulate

**Response:**
```json
{
  "simulated": true,
  "kwh": 5.5,
  "accumulated": 8.0,
  "metrics": {
    "current_production": 5.5,
    "accumulated_energy": 8.0,
    "total_reported": 20.0,
    "reporting_threshold": 10,
    "last_report_time": "2024-01-15T10:25:00.000000",
    "reports_count": 2
  }
}
```

**Example with cURL:**
```bash
# Simulate 5.5 kWh
curl -X POST "http://localhost:5000/api/test/simulate?kwh=5.5"

# Simulate default 3.5 kWh
curl -X POST "http://localhost:5000/api/test/simulate"
```

---

## Error Responses

### Common Error Codes

**400 Bad Request** - Invalid input
```json
{
  "error": "Missing kwh_amount"
}
```

**404 Not Found** - Endpoint doesn't exist
```json
{
  "error": "Endpoint not found"
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Internal server error"
}
```

---

## Usage Examples

### Complete Energy Flow

#### 1. Simulate IoT readings until threshold
```bash
# Reading 1: 3.5 kWh
curl -X POST "http://localhost:5000/api/test/simulate?kwh=3.5"

# Reading 2: 4.0 kWh
curl -X POST "http://localhost:5000/api/test/simulate?kwh=4.0"

# Reading 3: 3.0 kWh (total: 10.5 - should trigger report)
curl -X POST "http://localhost:5000/api/test/simulate?kwh=3.0"
```

#### 2. Check metrics
```bash
curl http://localhost:5000/api/energy/metrics
```

#### 3. View history
```bash
curl http://localhost:5000/api/energy/history
```

#### 4. Check blockchain status
```bash
curl http://localhost:5000/api/status
```

---

## Rate Limiting
Currently no rate limiting. In production, implement:
- Rate limiting per IP address
- API key quotas
- Request throttling

---

## Data Types

### Energy Values
- Stored as floats (decimal numbers)
- Precision: 2 decimal places
- Units: kWh (kilowatt-hours)

### Addresses
- Ethereum addresses (40 hex characters with 0x prefix)
- Must be checksummed for Web3 operations
- API automatically converts to checksum format

### Timestamps
- ISO 8601 format (e.g., "2024-01-15T10:30:45.123456")
- UTC timezone
- Generated by server if not provided

---

## Blockchain Integration

### Energy Reporting Flow
```
1. IoT Device sends energy reading → API /api/energy/reading
2. API accumulates energy in buffer
3. When accumulated >= threshold (10 kWh) → Auto-report
4. Oracle submits tx to JouletToken.reportEnergyProduction()
5. Smart contract mints JLT tokens = energy / MINING_DIFFICULTY
6. Tokens appear in producer wallet
```

### Transaction Details
- **Gas Limit**: 200,000
- **Gas Price**: Auto (current network rate)
- **Confirmation**: Waits for transaction receipt

---

## Environment Variables

Required in `.env` file:

```
RPC_URL=http://127.0.0.1:8545          # Blockchain RPC endpoint
CONTRACT_ADDRESS=0x5FbDB...            # Deployed contract address
ORACLE_PRIVATE_KEY=0xac09...           # Oracle account private key
PRODUCER_ADDRESS=0xf39F...             # Producer wallet address
API_PORT=5000                          # API server port
API_HOST=0.0.0.0                       # API bind address
REPORTING_THRESHOLD=10                 # Energy amount to trigger report
READING_INTERVAL=30                    # Seconds between readings
```

---

## Support & Testing

### Test with Postman
1. Import base URL: `http://localhost:5000`
2. Create requests for each endpoint
3. Check response times and status codes

### Test with Python
```python
import requests

# Check status
response = requests.get('http://localhost:5000/api/status')
print(response.json())

# Simulate reading
response = requests.post(
    'http://localhost:5000/api/test/simulate',
    params={'kwh': 5.5}
)
print(response.json())
```

### Test with JavaScript/Node.js
```javascript
// Check status
fetch('http://localhost:5000/api/status')
  .then(r => r.json())
  .then(data => console.log(data));

// Simulate reading
fetch('http://localhost:5000/api/test/simulate?kwh=5.5', {
  method: 'POST'
})
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## Version History

### v1.0.0 (Current)
- Initial API release
- Basic energy reading and reporting
- Blockchain integration
- Testing endpoints

---

**Last Updated:** 2024-01-15
**API Version:** 1.0.0
