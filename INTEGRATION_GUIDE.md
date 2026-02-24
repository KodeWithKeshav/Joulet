# 🔗 Joulet System Architecture - How Components Connect

## Connection Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER (Your Browser)                          │
│                  http://localhost:5173                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ (HTTP/REST)
         ┌───────────────────────────────────┐
         │   FRONTEND DASHBOARD (React)      │
         │   - Displays UI                   │
         │   - Handles user interactions     │
         │   - Calls API endpoints           │
         └──────────┬──────────────────────┬─┘
                    │                      │
                    │ (HTTP REST calls)    │ (Direct RPC calls)
                    │                      │
       ┌────────────▼─────────────┐   ┌───▼─────────────────┐
       │  API BRIDGE (Python)     │   │ BLOCKCHAIN (Hardhat)│
       │ http://localhost:5000    │   │ http://127.0.0.1:8545
       │                          │   │                     │
       │ - Flask server           │   │ - Local test network│
       │ - Aggregates energy      │   │ - Smart contract    │
       │ - Manages metrics        │   │ - Mints tokens      │
       │ - Submits to blockchain  │   │ - Token transfers   │
       └────────────┬─────────────┘   └───▲─────────────────┘
                    │                      │
                    └──────────┬───────────┘
                               │ (Web3.py)
                               │
                    ┌──────────▼──────────┐
                    │  Smart Contract     │
                    │  JouletToken.sol    │
                    │  (ERC20 Token)      │
                    │                     │
                    │ - reportEnergy()    │
                    │ - redeemEnergy()    │
                    │ - balanceOf()       │
                    └─────────────────────┘
```

---

## Component Connections

### 1. Frontend → API Bridge
**File:** `client/src/App.jsx`

The frontend now connects to the API bridge via HTTP REST calls:

```javascript
// Configuration
const API_URL = 'http://localhost:5000';

// API call function
const apiCall = async (endpoint, method = 'GET', data = null) => {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  return await response.json();
};

// Example: Send energy reading
await apiCall('/api/test/simulate', 'POST', { kwh: 5.5 });
```

**Endpoints Used:**
- `GET /api/status` - Check connection status
- `GET /api/energy/metrics` - Get current metrics
- `POST /api/test/simulate` - Simulate energy reading

**Connection Status Indicators:**
- Green light + "API Connected" → API is running
- Red light + "API Disconnected" → Need to start API bridge

### 2. API Bridge → Blockchain
**File:** `iot-simulation/api_bridge.py`

The API bridge connects to the blockchain via Web3.py:

```python
# Configuration
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0x5FbDB...")
ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY", "0xac09...")

# Web3 initialization
self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
self.contract = self.w3.eth.contract(address=contract_address, abi=contract_abi)

# Submit to blockchain
tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
```

**What Happens:**
1. API receives energy reading
2. Accumulates energy in buffer
3. When threshold (10 kWh) reached → submits to blockchain
4. Smart contract mints tokens
5. Tokens appear in producer wallet

### 3. Blockchain → Smart Contract
**File:** `blockchain/contracts/JouletToken.sol`

The smart contract runs on the blockchain and:

```solidity
// When energy is reported
function reportEnergyProduction(address producerWallet, uint256 kWhAmount) public {
  require(msg.sender == energyMeter, "Only authorized IoT meters");
  uint256 tokensToMint = kWhAmount / MINING_DIFFICULTY;
  _mint(producerWallet, tokensToMint * 10 ** decimals());
  emit EnergyReported(kWhAmount, tokensToMint);
}
```

---

## Data Flow Example: Energy Generation

**Step 1: User clicks "Generate Solar Energy"**
```
Frontend (React App)
  └─ User clicks button
```

**Step 2: Frontend calls API**
```
Frontend → POST /api/test/simulate?kwh=5.5 → API Bridge
```

**Step 3: API accumulates energy**
```
API Bridge
  ├─ accumulated_energy += 5.5 kWh
  ├─ Check: Is accumulated ≥ 10 kWh?
  └─ Returns: { accumulated: 5.5, should_report: false }
```

**Step 4: When 10 kWh reached, API submits to blockchain**
```
API Bridge
  ├─ accumulated_energy = 15.5 kWh (threshold reached)
  ├─ Call: contract.reportEnergyProduction(producer, 15.5)
  └─ Submits: Transaction to Hardhat node
```

**Step 5: Blockchain processes transaction**
```
Smart Contract
  ├─ Receives: reportEnergyProduction(producer, 15.5)
  ├─ Calculates: 15.5 kWh ÷ 10 = 1 JLT token
  ├─ Mints: 1 JLT → producer's wallet
  └─ Emits: EnergyReported(15.5, 1)
```

**Step 6: Frontend updates from API**
```
Frontend (polling every 5 seconds)
  ├─ Calls: GET /api/energy/metrics
  ├─ Gets: { accumulated_energy: 0, total_reported: 15.5 }
  ├─ Updates: Producer wallet shows 1 JLT
  └─ Adds: New block to Live Ledger
```

---

## How to Verify Connections

### 1. Check API is Running
```bash
curl http://localhost:5000/

# Response should show: {"status": "healthy", ...}
```

### 2. Check API can access Blockchain
```bash
curl http://localhost:5000/api/status

# Response shows oracle.connected: true/false
```

### 3. Check Blockchain is Running
```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return current block number
```

### 4. Check Frontend can reach API
Open browser console (F12) and run:
```javascript
fetch('http://localhost:5000/api/status')
  .then(r => r.json())
  .then(d => console.log(d))

// Should show API status
```

---

## Configuration Files

### Frontend Configuration
**File:** `client/.env`
```
VITE_API_URL=http://localhost:5000
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=0x5FbDB...
```

### API Bridge Configuration
**File:** `iot-simulation/.env`
```
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB...
ORACLE_PRIVATE_KEY=0xac09...
PRODUCER_ADDRESS=0xf39F...
API_PORT=5000
```

### Blockchain Configuration
**File:** `blockchain/hardhat.config.js`
```javascript
networks: {
  hardhat: {
    chainId: 1337
  }
}
```

---

## Connection Requirements

### For Everything to Work:

1. **Blockchain Running** ✓
   - Command: `cd blockchain && npx hardhat node`
   - Port: 8545
   - Status: Shows "Started HTTP and WebSocket JSON-RPC server"

2. **Smart Contract Deployed** ✓
   - Command: `cd blockchain && npm run deploy`
   - Output: Shows contract address
   - Must update: .env files with address

3. **API Bridge Running** ✓
   - Command: `cd iot-simulation && python api_bridge.py`
   - Port: 5000
   - Status: Shows "Oracle initialized successfully"

4. **Frontend Running** ✓
   - Command: `cd client && npm run dev`
   - Port: 5173
   - Status: Shows "Local: http://localhost:5173"

---

## What's Connected Now?

### ✅ Fully Connected:
- ✓ API Bridge ↔ Blockchain (Web3.py)
- ✓ API Bridge ↔ Smart Contract (via RPC)
- ✓ Frontend ↔ API Bridge (HTTP REST)
- ✓ Frontend shows connection status

### ✅ What This Enables:
- Frontend can send energy readings to API
- API aggregates and reports to blockchain
- Smart contract mints tokens
- Frontend receives real metrics from API
- Live ledger shows actual transactions

### 🔧 What You Can Test:
1. Click "Generate Energy" → Creates API call
2. Watch metrics update from real API
3. See tokens minted on real smart contract
4. Check blockchain via RPC endpoint
5. Monitor energy accumulation in real-time

---

## Troubleshooting Connections

### "API Disconnected" in Dashboard
→ Check: Is API bridge running? `curl http://localhost:5000/`

### "Blockchain Disconnected" 
→ Check: Is Hardhat node running? Look for port 8545
→ Check: Is contract deployed? Check .env files have address

### Energy not updating
→ Check: API logs show received requests?
→ Check: .env files have correct contract address?
→ Check: Oracle has ETH for gas? (Should auto-fund from Hardhat)

### Transactions failing
→ Check: Oracle account has ETH balance
→ Check: CONTRACT_ADDRESS matches deployed address
→ Check: Contract is at correct address on blockchain

---

## Summary

Your Joulet platform is now **fully integrated**:

```
User Interface (React)
        ↓ HTTP REST
   API Bridge (Python/Flask)
        ↓ Web3/RPC
   Blockchain (Hardhat)
        ↓ Solidity
   Smart Contract (JouletToken)
```

Everything communicates! The frontend now has real connections to the API and blockchain, not just local simulation. 🎉
