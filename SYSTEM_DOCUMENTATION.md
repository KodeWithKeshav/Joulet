# 🌟 Joulet System Documentation

## Complete Guide to the Decentralized Energy Trading Platform

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [How It Works](#how-it-works)
5. [User Roles](#user-roles)
6. [Security & Validation](#security--validation)
7. [Smart Contract](#smart-contract)
8. [Technology Stack](#technology-stack)
9. [API Reference](#api-reference)
10. [Attack Simulation](#attack-simulation)

---

## 🎯 System Overview

**Joulet** is a blockchain-based platform for **decentralized energy trading** that connects renewable energy producers (like solar panel owners) with consumers. It creates a trusted marketplace where:

- **Energy producers** generate electricity and earn cryptocurrency (JLT tokens)
- **Consumers** buy energy tokens to support renewable energy
- **Oracles** validate energy readings to prevent fraud
- **Smart contracts** automatically handle payments and token minting

### Key Features
✅ **Proof of Generation**: Blockchain verifies actual energy production  
✅ **Fraud Prevention**: Multi-oracle validation with 5-layer security checks  
✅ **Carbon Credits**: Automatic NFT generation for environmental impact tracking  
✅ **DEX Integration**: Built-in exchange for buying/selling energy tokens  
✅ **Real-time Simulation**: Physics-based grid modeling with brownout detection  
✅ **Attack Testing**: Security demonstration through adversarial simulations  

---

## 🏗️ System Architecture

The Joulet platform consists of **7 main components** working together:

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                              │
│              (Wallet App - Port 5175)                            │
│   • Dashboard  • Token Swaps  • Energy Mining  • Attacks        │
└────────────────────┬─────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│  API BRIDGE  │          │  BLOCKCHAIN  │
│  Port 5004   │◄────────►│  Port 8545   │
│              │          │              │
│ • Simulator  │          │ • Hardhat    │
│ • Metrics    │          │ • JLT Token  │
│ • Grid Data  │          │ • Contract   │
└──────┬───────┘          └──────────────┘
       │                         ▲
       │                         │
       ▼                         │
┌──────────────┐                 │
│ ORACLE NODES │                 │
│ Port 5001-03 │                 │
│              │                 │
│ 5 Validation │                 │
│ Checks       │                 │
└──────┬───────┘                 │
       │                         │
       ▼                         │
┌──────────────┐                 │
│  CONSENSUS   │─────────────────┘
│  ENGINE      │
│  Port 5010   │
│              │
│ • Aggregates │
│ • Merkle Tree│
│ • Submits TX │
└──────────────┘
```

### Data Flow
1. **Energy Generation**: Solar panels generate electricity (simulated)
2. **API Bridge**: Collects energy readings every 5 seconds
3. **Oracle Nodes**: Validate each reading (5 security checks)
4. **Consensus Engine**: Aggregates oracle votes using reputation weights
5. **Blockchain**: Records verified energy and mints JLT tokens
6. **Wallet App**: Displays balance and enables trading

---

## 🔧 Core Components

### 1. **Blockchain Layer** (Hardhat + Smart Contract)

**Location**: `blockchain/`  
**Network**: Ethereum (Local Testnet)  
**RPC**: http://127.0.0.1:8545  

**Smart Contract**: `JouletToken.sol`
- ERC-20 token standard for JLT (Joulet Token)
- **1 JLT = 10 kWh of verified energy production** (adjustable difficulty)
- Initial supply: 500,000 JLT (for DEX liquidity)
- Minting controlled by Oracle Consensus Engine only
- Integrated Carbon Credit NFT tracking

**Key Functions**:
```solidity
reportEnergyProduction(address producer, uint256 kWh, bytes32 merkleRoot)
  → Mints JLT tokens based on verified energy
  → Auto-generates Carbon NFT every 1220 kWh
  
setDifficulty(uint256 newDifficulty)
  → Adjusts how many kWh = 1 JLT token
  
balanceOf(address account)
  → Returns JLT token balance
```

**Deployed Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

---

### 2. **API Bridge** (Python/Flask)

**Location**: `iot-simulation/api_bridge.py`  
**Port**: 5004  
**Role**: Central hub connecting simulation, oracles, and frontend

**What It Does**:
- **Simulates solar energy production** (0-5 kWh per reading)
- Tracks accumulated energy waiting to be reported
- Monitors blockchain connection status
- Provides REST API for frontend queries
- Simulates grid conditions (voltage, frequency)

**Physics Model**:
- Solar panel efficiency varies by time of day
- Temperature affects output (higher temp = less efficiency)
- Cloud cover simulation (randomized)
- Nighttime = zero production

**Key Configuration** (`.env`):
```bash
SIM_INTERVAL=5.0        # Readings every 5 seconds
SIM_MIN_KWH=0.5         # Minimum per reading
SIM_MAX_KWH=5.0         # Maximum per reading
REPORTING_THRESHOLD=10  # Submit to blockchain every 10 kWh
```

---

### 3. **Oracle Nodes** (Fraud Prevention)

**Location**: `iot-simulation/oracle_node.py`  
**Ports**: 5001, 5002, 5003  
**Role**: Validate energy readings before blockchain submission

**The 5 Security Checks**:

#### Check 1: **Valid ECDSA Signature**
- Verifies reading comes from authorized device
- Uses cryptographic signature (private key signing)
- Prevents impersonation attacks

#### Check 2: **Capacity Limit**
- Ensures power doesn't exceed physical panel limits (5 kW)
- Prevents exaggerated production claims

#### Check 3: **Daylight Hours**
- Solar panels only produce during day (6am-8pm)
- Rejects nighttime production claims

#### Check 4: **No Sudden Spikes**
- Checks if reading is >50% higher than previous
- Prevents fraudulent "spike" attacks

#### Check 5: **Weather Correlation**
- Queries real weather API (Open-Meteo)
- Validates production matches cloud cover
- Expected output = panel capacity × (1 - cloud_cover × 0.7)

**Attack Responses**:
- ✅ **Valid**: Votes "VALID" to Consensus Engine
- ❌ **Invalid**: Votes "INVALID" with reason
- All votes include oracle reputation weight

---

### 4. **Consensus Engine** (Decision Maker)

**Location**: `iot-simulation/consensus_engine.py`  
**Port**: 5010  
**Role**: Aggregate oracle votes and submit to blockchain

**How It Works**:

**Step 1: Receive Votes**
- Collects votes from all 3 oracle nodes
- Each vote includes: `VALID` or `INVALID` + reason

**Step 2: Reputation-Weighted Voting**
- Each oracle has a reputation score (starts at 1.0)
- Correct votes → reputation +0.01
- Incorrect votes → reputation -0.05
- Final decision = weighted majority

**Step 3: Batch Accumulation**
- Collects valid readings until threshold met (10 kWh)
- Prevents spamming blockchain with micro-transactions

**Step 4: Merkle Tree Generation**
- Creates cryptographic proof of all readings in batch
- Allows verification without storing all data on-chain
- Merkle root = single hash representing all readings

**Step 5: Blockchain Submission**
- Calls smart contract: `reportEnergyProduction()`
- Includes: producer address, kWh amount, merkle root
- Smart contract mints JLT tokens to producer

**Step 6: Adaptive Difficulty**
- Monitors time between submissions
- Target: 15 seconds between transactions
- Too fast → increase difficulty (more kWh per token)
- Too slow → decrease difficulty

---

### 5. **Joulet Wallet** (User Interface)

**Location**: `joulet-wallet/`  
**Port**: 5175  
**Framework**: React + TypeScript + Vite

**User Profiles** (Pre-configured Hardhat accounts):
- **Producer** (Account #0): Energy generator, receives mined tokens
- **Consumer A** (Account #1): Buyer with $200 USD balance
- **Consumer B** (Account #2): Buyer with $200 USD balance  
- **Consumer C** (Account #3): Buyer with $200 USD balance
- **Consumer D** (Account #4): Buyer with $200 USD balance

**Features**:

#### 📊 **Dashboard View**
- Live JLT balance from blockchain
- Total energy generated (kWh)
- Verified batches count
- Connection status (API + Oracle)
- Grid health monitor (voltage, frequency)

#### 💱 **Token Swaps (DEX)**
- **Buy JLT**: Pay USD → receive JLT tokens
- **Sell JLT**: Pay JLT → receive USD
- Current rate: **1 JLT = $0.50** (configurable)
- DEX liquidity pool: 49,800 JLT available

#### ⚡ **Energy Mining** (Producer Only)
- Submit signed energy readings
- Real-time difficulty display
- Pending energy accumulation
- Transaction history

#### 🎯 **Attack Panel** (Security Demo)
- Test system security with 4 attack types
- Shows real-time oracle validation
- Educational demonstration of fraud prevention

#### 📜 **Activity Log**
- Recent transactions
- System incidents
- Blockchain confirmations

---

### 6. **Decentralized Exchange (DEX)**

**Wallet Address**: `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` (Hardhat Account #9)  
**Liquidity**: 49,800 JLT tokens  

**How It Works**:
- Automated Market Maker (AMM) design
- Fixed exchange rate: **$0.50 per JLT**
- On-chain token transfers (not off-chain order book)

**Buy Flow**:
1. User selects amount of JLT to buy
2. Cost calculated: amount × $0.50
3. Check USD balance sufficient
4. DEX transfers JLT to user wallet (on-chain)
5. USD balance deducted (off-chain tracking)

**Sell Flow**:
1. User selects amount of JLT to sell
2. Value calculated: amount × $0.50
3. Check JLT balance sufficient
4. User transfers JLT to DEX wallet (on-chain)
5. USD balance credited (off-chain tracking)

---

### 7. **Device Key Management**

**Location**: `joulet-wallet/src/core/keyManager.ts`

**Purpose**: Simulates IoT device authentication for energy readings

**How It Works**:
- Each user profile has a **wallet key** (blockchain identity)
- System generates a **device key** (IoT solar meter identity)
- Device signs energy readings with its private key
- Oracle nodes verify signatures against authorized device list

**Key Storage**:
- Wallet keys: Hardhat pre-funded accounts
- Device keys: Randomly generated ECDSA keypairs
- Device registry: `iot-simulation/devices.json`

---

## 🔄 How It Works (Complete Flow)

### **Energy Producer Journey**

**1. Initial Setup** (Automatic)
```
Producer logs in → System generates device keys
→ Registers device with oracles → DEX pool initialized
```

**2. Energy Generation** (Every 5 seconds)
```
Solar simulation runs → Generates 0.5-5 kWh reading
→ Device signs reading with private key
→ Sent to API Bridge (accumulates)
```

**3. Energy Validation** (Per reading)
```
Reading hits oracle nodes → All 3 run 5 checks
→ Each votes VALID or INVALID → Consensus Engine aggregates
→ Weighted majority determines outcome
```

**4. Batch Submission** (Every 10 kWh accumulated)
```
Consensus Engine: accumulated >= 10 kWh
→ Generate Merkle tree of readings
→ Submit to blockchain: reportEnergyProduction()
→ Smart contract mints JLT tokens
→ Verification counter incremented
```

**5. Token Rewards**
```
kWh accumulated ÷ difficulty = tokens to mint
Example: 100 kWh ÷ 10 = 10 JLT tokens
→ Tokens appear in wallet balance
→ Can trade on DEX or hold
```

### **Energy Consumer Journey**

**1. Initial Setup**
```
Consumer logs in → Receives $200 USD starting balance
→ Connected to blockchain & API
```

**2. Buying Energy Tokens**
```
Open DEX modal → Select amount (e.g., 100 JLT)
→ Cost = 100 × $0.50 = $50 USD
→ Click "Execute Buy" → DEX transfers JLT on-chain
→ USD balance deducted → JLT balance updates
```

**3. Using Tokens**
```
Hold for value appreciation (as energy market grows)
Sell back to DEX for USD
Transfer to other wallets (P2P energy trading)
Track carbon offset via token holdings
```

---

## 👥 User Roles

### **Producer** (Energy Generator)
- **Profile**: Account #0
- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Capabilities**:
  - Generate energy readings
  - Earn JLT tokens for production
  - Auto-create Carbon NFTs (1 per 1220 kWh)
  - Trade tokens on DEX
  - Initialize DEX liquidity pool

### **Consumer** (Energy Buyer)
- **Profiles**: Accounts #1-4
- **Starting Balance**: $200 USD each
- **Capabilities**:
  - Buy JLT tokens with USD
  - Sell JLT tokens for USD
  - View live energy market data
  - Track grid health metrics
  - Support renewable energy

### **Oracle Node** (Validator)
- **Automated Service** (no human interaction)
- **Responsibilities**:
  - Validate all energy readings
  - Vote on authenticity
  - Maintain reputation score
  - Prevent fraud attempts

### **Consensus Engine** (Decision Maker)
- **Automated Service** (no human interaction)
- **Responsibilities**:
  - Aggregate oracle votes
  - Generate cryptographic proofs
  - Submit verified batches to blockchain
  - Adjust mining difficulty dynamically
  - Distribute token rewards

---

## 🔒 Security & Validation

### **Multi-Layer Security Architecture**

#### **Layer 1: Cryptographic Authentication**
- ECDSA signature verification
- Prevents device impersonation
- Private keys never transmitted

#### **Layer 2: Physical Constraints**
- Capacity limit validation (max 5 kW)
- Prevents impossible power levels
- Based on real solar panel specs

#### **Layer 3: Time-Based Validation**
- Daylight hours enforcement (6am-8pm)
- Zero production at night
- Timezone-aware checks

#### **Layer 4: Anomaly Detection**
- Sudden spike detection (>50% jump)
- Compares to previous readings
- Flags unusual patterns

#### **Layer 5: External Verification**
- Live weather API integration
- Cloud cover correlation
- Real-world data validation

#### **Layer 6: Reputation System**
- Oracle nodes earn/lose reputation
- Bad actors lose voting power
- Incentivizes honest validation

#### **Layer 7: Merkle Proof System**
- Cryptographic batch verification
- Tamper-proof data integrity
- Efficient on-chain storage

### **Attack Prevention Summary**

| Attack Type | Defense Mechanism | Detection Method |
|------------|------------------|------------------|
| **Signature Forgery** | ECDSA verification | Invalid signature rejected |
| **Night Production** | Time validation | Timestamp check + geolocation |
| **Power Spike** | Anomaly detection | >50% increase flagged |
| **Over-capacity** | Physical limits | Exceeds 5kW rejected |
| **Weather Mismatch** | External API | Cloud cover correlation |
| **Replay Attack** | Timestamp validation | Old timestamps rejected |
| **Sybil Attack** | Device registry | Only authorized devices |

---

## 📜 Smart Contract

### **JouletToken.sol** Technical Details

**Inheritance**: ERC20, Ownable  
**Compiler**: Solidity 0.8.20  
**Gas Optimization**: Moderate (batch submissions reduce tx count)

### **State Variables**
```solidity
address public oracleConsensus;           // Authorized oracle address
uint256 public currentDifficulty = 10;    // kWh per token (adaptive)

// Fractional accumulation (handles partial kWh)
mapping(address => uint256) public providerAccumulatedKwhForTokens;

// Batch tracking
mapping(uint256 => VerifiedBatch) public batches;
uint256 public currentBatchId;

// Carbon NFT tracking (lightweight, not full ERC721)
mapping(uint256 => CarbonNFT) public carbonNfts;
mapping(address => uint256) public carbonNftBalance;
uint256 public constant NFT_MINT_THRESHOLD = 1220; // kWh
```

### **Main Functions**

#### **reportEnergyProduction()**
```solidity
function reportEnergyProduction(
    address producerWallet, 
    uint256 kWhAmount, 
    bytes32 merkleRoot
) public
```
**Access**: Only `oracleConsensus` address  
**Process**:
1. Accumulates kWh for producer
2. Calculates tokens to mint (kWh ÷ difficulty)
3. Mints JLT tokens if threshold reached
4. Records batch with merkle root
5. Auto-mints Carbon NFT if 1220+ kWh accumulated
6. Emits `EnergyReported` event

**Example (Demo Configuration):**
```
Producer submits 100 kWh, difficulty = 10
→ 100 ÷ 10 = 10 tokens to mint
→ Mint 10 JLT to producer wallet
→ Accumulate toward Carbon NFT threshold
```

**Example (Production Configuration):**
```
Producer submits 5000 kWh, difficulty = 1000
→ 5000 ÷ 1000 = 5 tokens to mint
→ Mint 5 JLT to producer wallet
→ Accumulate toward Carbon NFT threshold
```

**Note:** Current demo uses `difficulty = 10` for faster token visualization. Production deployments should use `difficulty = 1000` (adjustable via `setDifficulty()`).

#### **setDifficulty()**
```solidity
function setDifficulty(uint256 _newDifficulty) public
```
**Access**: Oracle Consensus or Owner  
**Purpose**: Dynamically adjust token emission rate  
**Logic**: Called by consensus engine based on submission rate

#### **Carbon NFT Auto-Generation**
```solidity
// Every 1220 kWh = 1 Carbon Credit NFT
if (providerAccumulatedKwh[producer] >= NFT_MINT_THRESHOLD) {
    uint256 nftId = ++_nftTokenIds;
    carbonNfts[nftId] = CarbonNFT({
        owner: producer,
        mintedAt: block.timestamp,
        kWhRepresented: NFT_MINT_THRESHOLD
    });
    carbonNftBalance[producer]++;
    emit CarbonNftMinted(producer, nftId, NFT_MINT_THRESHOLD);
}
```

### **Events**
```solidity
event EnergyReported(
    uint256 indexed batchId,
    address indexed producerWallet,
    uint256 kWhProduced,
    uint256 tokensMinted,
    bytes32 merkleRoot
);

event CarbonNftMinted(
    address indexed producerWallet,
    uint256 indexed nftId,
    uint256 kWhRepresented
);
```

---

## 🛠️ Technology Stack

### **Blockchain**
- **Ethereum**: Base blockchain platform
- **Hardhat**: Development environment & local testnet
- **Solidity**: Smart contract language (v0.8.20)
- **OpenZeppelin**: Security-audited contract libraries
- **Ethers.js**: JavaScript blockchain interaction library

### **Backend**
- **Python 3.9+**: Core backend language
- **Flask**: REST API framework
- **Web3.py**: Python Ethereum library
- **OMPython**: Modelica simulation interface (optional)
- **Requests**: HTTP client for external APIs

### **Frontend**
- **React 19**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool & dev server
- **Zustand**: State management
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **Lucide**: Icon library

### **Cryptography**
- **ECDSA**: Elliptic Curve Digital Signature Algorithm
- **SHA-256**: Hashing for Merkle trees
- **Keccak-256**: Ethereum-standard hashing

### **External Services**
- **Open-Meteo API**: Real weather data (free tier)
- Cloud cover correlation for validation

---

## 📡 API Reference

### **API Bridge Endpoints** (Port 5004)

#### **GET /** - Health Check
```bash
curl http://localhost:5004/
```
**Response**:
```json
{
  "status": "Joulet Energy API Bridge",
  "version": "1.0",
  "uptime_seconds": 1234.5
}
```

#### **GET /api/status** - System Status
```bash
curl http://localhost:5004/api/status
```
**Response**:
```json
{
  "blockchain": {
    "connected": true,
    "contract_address": "0x5FbDB...",
    "oracle_address": "0xf39Fd..."
  },
  "energy": {
    "pending_kwh": 7.5,
    "total_reported": 123.4,
    "last_reading": "2026-02-27 19:15:30"
  },
  "simulator": {
    "enabled": true,
    "interval_sec": 5.0,
    "current_power_kw": 3.2
  },
  "difficulty": {
    "current": 10,
    "kwh_per_token": 10
  }
}
```

#### **GET /api/grid/status** - Grid Metrics
```bash
curl http://localhost:5004/api/grid/status
```
**Response**:
```json
{
  "rms_voltage": 230.5,
  "frequency": 50.02,
  "is_brownout": false,
  "grid_health": "STABLE",
  "last_update": "2026-02-27T19:15:30.123Z"
}
```

#### **POST /api/energy/reading** - Submit Reading
```bash
curl -X POST http://localhost:5004/api/energy/reading \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "solar_001",
    "power_kw": 3.5,
    "signature": "0x5de4111..."
  }'
```

#### **GET /api/energy/metrics** - Get Metrics
```bash
curl http://localhost:5004/api/energy/metrics
```

#### **GET /api/config** - Get Configuration
```bash
curl http://localhost:5004/api/config
```

### **Consensus Engine Endpoints** (Port 5010)

#### **GET /api/consensus/status** - Engine Status
```bash
curl http://localhost:5010/api/consensus/status
```
**Response**:
```json
{
  "status": "online",
  "total_batches": 12,
  "total_kwh_verified": 123.4,
  "current_difficulty": 10,
  "oracle_reputation": {
    "oracle_1": 1.02,
    "oracle_2": 0.98,
    "oracle_3": 1.05
  },
  "pending_votes": 2
}
```

#### **POST /api/consensus/vote** - Submit Oracle Vote
```bash
curl -X POST http://localhost:5010/api/consensus/vote \
  -H "X-Internal-Key: joulet_internal_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "oracle_1",
    "approval": "VALID",
    "payload": {...}
  }'
```

### **Oracle Node Endpoints** (Port 5001)

#### **GET /api/status** - Oracle Status
```bash
curl http://localhost:5001/api/status
```

#### **POST /api/oracle/submit** - Submit for Validation
```bash
curl -X POST http://localhost:5001/api/oracle/submit \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "Device_ID": "solar_001",
      "Voltage": 230.1,
      "Current": 15,
      "Power_kW": 3.45,
      "Timestamp": "2026-02-27T13:40:45.292Z"
    },
    "signature": "0x5de4111afa1a4..."
  }'
```

---

## ⚔️ Attack Simulation

The wallet app includes an **Attack Panel** for security demonstrations.

### **4 Attack Types**

#### **1. FORGERY - Invalid Signature**
**Goal**: Submit reading with fake signature  
**Payload**: `signature: "0x00000..."`  
**Expected Result**: ❌ Rejected by Check #1 (ECDSA verification)  
**Message**: `"Invalid signature - authentication failed"`

#### **2. NIGHT - Nighttime Production**
**Goal**: Claim solar production at 2am  
**Payload**: `Timestamp: "2026-02-26T02:00:00Z"`  
**Expected Result**: ❌ Rejected by Check #3 (Daylight hours)  
**Message**: `"Solar production outside daylight hours (6am-8pm)"`

#### **3. SPIKE - Power Surge**
**Goal**: Claim 10.35 kW (>50% jump from 3.45 kW)  
**Payload**: `Power_kW: 10.35`  
**Expected Result**: ❌ Rejected by Check #4 (Anomaly detection)  
**Message**: `"Sudden spike detected - >50% increase from previous"`

#### **4. PHYSICS - Overcapacity**
**Goal**: Claim 24.5 kW (exceeds 5 kW limit)  
**Payload**: `Power_kW: 24.5`  
**Expected Result**: ❌ Rejected by Check #2 (Capacity limit)  
**Message**: `"Power exceeds physical capacity limit (5kW)"`

### **Using the Attack Panel**

1. Login as any user profile
2. Click **"Attack"** tab
3. Select attack type from buttons
4. Watch terminal output in real-time
5. See oracle validation response
6. Check incident log for details

**Educational Value**: Demonstrates that the system successfully prevents common fraud attempts through multi-layer validation.

---

## 🚀 Running the System

### **Prerequisites**
- Node.js 18+
- Python 3.9+
- Git

### **Quick Start**

**Option 1: Windows (Automatic)**
```bash
# From project root
.\start.bat
# Select option 1 (All components)
```

**Option 2: Manual Start**

```bash
# Terminal 1: Blockchain
cd blockchain
npm install
npx hardhat node

# Terminal 2: Deploy Contract
cd blockchain
npm run deploy

# Terminal 3: API Bridge
cd iot-simulation
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python api_bridge.py

# Terminal 4: Consensus Engine
cd iot-simulation
python consensus_engine.py

# Terminal 5: Oracle Node
cd iot-simulation
python oracle_node.py --port 5001 --id oracle_1

# Terminal 6: Wallet App
cd joulet-wallet
npm install
npm run dev
```

### **Access URLs**
- **Wallet**: http://localhost:5175
- **Blockchain**: http://127.0.0.1:8545
- **API Bridge**: http://localhost:5004
- **Consensus**: http://127.0.0.1:5010
- **Oracle 1**: http://127.0.0.1:5001

---

## 📊 System Metrics

### **Performance**
- **Energy Reading Interval**: 5 seconds
- **Batch Submission**: Every 10 kWh accumulated
- **Oracle Validation**: <1 second per reading
- **Blockchain TX**: ~2 seconds confirmation
- **Token Minting**: Instant (same transaction)

### **Scalability**
- **Current**: Handles 1 producer, unlimited consumers
- **Design Capacity**: 100+ producers with 3 oracle nodes
- **Bottleneck**: Blockchain transaction throughput (not simulation)

### **Economics**
- **Token Value**: $0.50 per JLT (configurable)
- **Production Rate**: ~1-4 kWh per 5-second reading
- **Daily Production**: ~17,280-69,120 kWh (assumes 8hrs daylight)
- **Daily Tokens**: ~1,728-6,912 JLT (at difficulty 10)
- **Carbon NFT Rate**: 1 NFT per 1,220 kWh (~3 days of production)

---

## 🎓 Key Concepts Explained

### **What is a Merkle Tree?**
A cryptographic data structure that:
- Combines multiple readings into one hash
- Allows verification without storing all data
- Reduces blockchain storage costs
- Proves data integrity mathematically

**Example**:
```
Reading 1: hash(data1) = A
Reading 2: hash(data2) = B
Reading 3: hash(data3) = C
Reading 4: hash(data4) = D

Level 1: hash(A+B) = AB, hash(C+D) = CD
Level 2: hash(AB+CD) = ABCD (Merkle Root)

Store only "ABCD" on-chain, keep A,B,C,D off-chain
```

### **What is Oracle Reputation?**
A scoring system where:
- Honest validators gain reputation
- Dishonest validators lose reputation
- Higher reputation = more voting power
- Incentivizes correct validation

### **What is Dynamic Difficulty?**
An automatic adjustment mechanism:
- Target: 1 blockchain TX every 15 seconds
- Too many TX → increase difficulty (more kWh per token)
- Too few TX → decrease difficulty (fewer kWh per token)
- Keeps blockchain load manageable

### **What are Carbon Credits?**
Environmental impact tokens:
- 1 NFT = 1,220 kWh of renewable energy
- Represents CO₂ offset (~610 kg CO₂)
- Can be traded, retired, or held
- Auto-generated by smart contract

---

## 🔍 Troubleshooting

### **Common Issues**

**Problem**: "Connection Refused" errors
**Solution**: Ensure all services running (check ports with `netstat -an | findstr "5004 5010 5001 8545"`)

**Problem**: "Insufficient liquidity" on DEX
**Solution**: System auto-seeds 50,000 JLT on first producer login

**Problem**: No tokens being minted
**Solution**: Check accumulated energy >= difficulty threshold (10 kWh default)

**Problem**: Oracle rejections
**Solution**: Check device is registered in `devices.json` and signature is valid

---

## 📝 Summary

**Joulet** is a complete decentralized energy trading platform demonstrating:

✅ **Blockchain integration** for transparent energy markets  
✅ **Multi-oracle validation** for fraud prevention  
✅ **Real-time simulation** of energy generation  
✅ **Automated token economics** with dynamic difficulty  
✅ **Carbon credit tracking** for environmental impact  
✅ **DEX functionality** for peer-to-peer trading  
✅ **Security testing** through attack simulations  

The system proves that blockchain technology can create trusted, transparent markets for renewable energy while preventing fraud through cryptographic validation and reputation systems.

---

## 📚 Additional Resources

- **Smart Contract Code**: `blockchain/contracts/JouletToken.sol`
- **API Documentation**: This file, Section 9
- **Integration Guide**: `INTEGRATION_GUIDE.md`
- **Setup Instructions**: `SETUP.md`
- **Quick Reference**: `QUICK_REFERENCE.md`

---

*Last Updated: February 27, 2026*  
*Version: 1.0.0*  
*Platform: Joulet Beta*
