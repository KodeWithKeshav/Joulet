# 🚀 Complete Setup Guide for Joulet

This guide will walk you through setting up the entire Joulet energy trading platform from scratch.

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Step-by-Step Setup](#step-by-step-setup)
3. [Configuration](#configuration)
4. [Running the System](#running-the-system)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Software
- **Node.js**: v18.0.0 or higher
- **Python**: v3.9 or higher
- **npm** or **yarn**: Latest version
- **Git**: For cloning repository

### Hardware
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 2GB free
- **Network**: Internet connection for dependencies

### Optional (for testnet deployment)
- MetaMask or Web3 wallet
- Testnet ETH from faucet (Sepolia, Mumbai, etc.)

---

## Step-by-Step Setup

### Step 1: Clone and Navigate to Project

```bash
cd joulet-project
pwd  # Verify you're in the right directory
```

---

### Step 2: Setup Blockchain Layer

#### 2.1 Install Blockchain Dependencies
```bash
cd blockchain
npm install
```

Expected output:
```
added XX packages in XX seconds
```

#### 2.2 Verify Compilation
```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

#### 2.3 Create Environment File
```bash
# No .env file needed for local Hardhat
# Configuration is in hardhat.config.js
cat hardhat.config.js
```

✅ **Blockchain setup complete!**

---

### Step 3: Setup IoT Simulation & API

#### 3.1 Navigate to IoT Directory
```bash
cd ../iot-simulation
```

#### 3.2 Create Python Virtual Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Verify activation (should show "venv" in prompt)
which python  # Linux/Mac - should show path with "venv"
```

#### 3.3 Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Expected output:
```
Successfully installed web3-6.x.x web3-eth-account-0.x.x flask-3.x.x ...
```

#### 3.4 Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit the .env file
nano .env  # or vim, or your preferred editor
```

**Key settings in .env:**
```
RPC_URL=http://127.0.0.1:8545          # Hardhat local node
CONTRACT_ADDRESS=0x5FbDB...             # (Update after deployment)
ORACLE_PRIVATE_KEY=0xac09...           # Hardhat account 0
PRODUCER_ADDRESS=0xf39F...             # Hardhat account 1
API_PORT=5000
API_HOST=0.0.0.0
```

**Where to get these values:**
- When you run `npx hardhat node`, you'll see 20 test accounts with private keys
- Use Account 0 for ORACLE_PRIVATE_KEY
- Use Account 1 for PRODUCER_ADDRESS
- CONTRACT_ADDRESS: Get this after deployment in Step 4

✅ **IoT setup complete!**

---

### Step 4: Setup Frontend Dashboard

#### 4.1 Navigate to Client Directory
```bash
cd ../client
```

#### 4.2 Install Frontend Dependencies
```bash
npm install
```

Expected output:
```
added XX packages in XX seconds
```

#### 4.3 Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit the .env file
nano .env
```

**Key settings in .env:**
```
VITE_CONTRACT_ADDRESS=0x5FbDB...       # Same as blockchain
VITE_RPC_URL=http://127.0.0.1:8545     # Local Hardhat
VITE_API_URL=http://localhost:5000     # API Bridge
VITE_CHAIN_ID=1337                      # Hardhat chain ID
```

✅ **Frontend setup complete!**

---

## Configuration

### Updating Configuration After Deployment

After deploying the smart contract, you'll get a contract address. Update it everywhere:

```bash
# 1. Update IoT .env
cd iot-simulation
nano .env
# Change: CONTRACT_ADDRESS=0x<new_address>

# 2. Update frontend .env
cd ../client
nano .env
# Change: VITE_CONTRACT_ADDRESS=0x<new_address>
```

### Default Test Accounts (Hardhat)

When you run `npx hardhat node`, you get 20 test accounts:

```
Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account 1: 0x70997970C51812e339D9B73b0245ad59422d3d12 (10000 ETH)
...
```

**Use for:**
- Account 0: Oracle (energy meter, reports data)
- Account 1: Producer (receives tokens)
- Account 2: Consumer (buys tokens)

---

## Running the System

### Option A: Automated Startup (Easiest)

```bash
cd joulet-project

# On macOS/Linux
chmod +x start.sh
./start.sh

# On Windows
start.bat
```

Then select option 1 to start all components.

---

### Option B: Manual Startup (More Control)

#### Terminal 1: Start Blockchain
```bash
cd blockchain
npx hardhat node

# You'll see:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

#### Terminal 2: Deploy Contract
```bash
cd blockchain
npm run deploy

# You'll see:
# Joulet Token successfully deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copy the contract address, then update .env files in iot-simulation and client**

#### Terminal 3: Start API Bridge
```bash
cd iot-simulation

# Activate venv if not already active
source venv/bin/activate

# Update .env with contract address from deployment

python api_bridge.py

# You'll see:
# ✓ Connected to blockchain
# ✓ Oracle address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# ✓ Contract loaded at 0x5FbDB...
# Starting API server on 0.0.0.0:5000
```

#### Terminal 4: Start Frontend
```bash
cd client

# Update .env with contract address and API URL

npm run dev

# You'll see:
# VITE v5.x.x  ready in XXX ms
# 
# ➜  Local:   http://localhost:5173/
```

Open your browser and go to **http://localhost:5173**

---

## Testing

### Test 1: Check Blockchain Connection
```bash
# From iot-simulation terminal, check logs
# Should see: ✓ Connected to blockchain at http://127.0.0.1:8545
```

### Test 2: Check API Health
```bash
curl http://localhost:5000/
# Response: {"status": "healthy", "service": "Joulet Energy API Bridge", ...}
```

### Test 3: Simulate Energy Reading
```bash
curl -X POST "http://localhost:5000/api/test/simulate?kwh=5.5"

# Response should show accumulated energy
```

### Test 4: Check Metrics
```bash
curl http://localhost:5000/api/energy/metrics

# Response shows current production, accumulated, total reported
```

### Test 5: Frontend Dashboard
1. Open http://localhost:5173
2. Click "Producer" tab
3. Click "Generate Solar Energy"
4. Watch the progress bar fill
5. When it reaches 10 kWh, you should see a new block in the Live Ledger

### Test 6: End-to-End Energy Flow
```
1. Producer generates energy (click button)
2. Energy accumulates in buffer
3. At 10 kWh threshold, tokens are minted
4. Check blockchain ledger (new block appears)
5. Producer wallet receives JLT token
6. Consumer can now buy the token
7. Consumer redeems token for energy credits
```

---

## Troubleshooting

### Issue: "Cannot find module 'web3'"
```bash
cd iot-simulation
source venv/bin/activate
pip install web3
```

### Issue: "Connection refused on localhost:8545"
- Make sure Hardhat node is running in Terminal 1
- Verify with: `curl http://127.0.0.1:8545` (should timeout or respond with error)

### Issue: "Contract not found at address"
- Deploy the contract: `npm run deploy`
- Copy the returned address
- Update CONTRACT_ADDRESS in .env files

### Issue: "Oracle has 0 balance"
- Hardhat automatically funds accounts with 10000 ETH
- Check if using correct account (Account 0)
- Restart Hardhat node if needed

### Issue: "Port 5000 already in use"
```bash
# Kill process using port 5000
lsof -i :5000  # Find process ID
kill -9 <PID>   # Kill it

# Or change API port in .env
API_PORT=5001
```

### Issue: "Port 5173 already in use"
```bash
# Kill process or run on different port
npm run dev -- --port 5174
```

### Issue: "ModuleNotFoundError: No module named 'flask'"
```bash
cd iot-simulation
source venv/bin/activate
pip install flask flask-cors
```

### Issue: "Module 'dotenv' has no attribute 'load_dotenv'"
```bash
# Verify .env file exists in iot-simulation directory
ls -la .env

# If missing, create it:
cp .env.example .env
```

### Issue: Frontend shows "Disconnected"
1. Check that blockchain is running
2. Verify VITE_RPC_URL in client/.env is correct
3. Clear browser cache: Ctrl+Shift+Del
4. Hard refresh: Ctrl+Shift+R

### Issue: Transaction fails silently
1. Check API bridge logs for errors
2. Verify oracle account has ETH (should have 10000 from Hardhat)
3. Check contract is properly deployed

---

## Next Steps

After successful setup:

1. **Explore the Dashboard**
   - Switch between Producer and Consumer roles
   - Generate energy and watch tokens mint
   - Practice trading and redemption

2. **Review Smart Contract**
   - Open `blockchain/contracts/JouletToken.sol`
   - Understand the minting logic
   - Review access control

3. **API Integration**
   - Try different API endpoints
   - Use Postman or Insomnia for testing
   - Build custom scripts

4. **Customization**
   - Adjust MINING_DIFFICULTY (currently 10)
   - Change JLT_RATE (currently $0.50)
   - Modify reporting thresholds

5. **Deployment**
   - Test on Sepolia testnet
   - Deploy to mainnet (when ready)
   - Integrate with real IoT devices

---

## Getting Help

If you encounter issues:

1. **Check logs carefully** - they usually explain the problem
2. **Verify all .env files** - most issues are configuration
3. **Ensure all processes are running** - you need 3 terminals
4. **Clear caches** - npm cache, browser cache, Python cache
5. **Restart everything** - sometimes needed after changes

---

## Quick Reference

```bash
# Blockchain commands
cd blockchain && npx hardhat node          # Start node
cd blockchain && npm run deploy            # Deploy contract
cd blockchain && npm run compile           # Compile contracts

# Python commands
python3 -m venv venv                      # Create venv
source venv/bin/activate                  # Activate venv
pip install -r requirements.txt           # Install packages

# Frontend commands
npm install                                # Install dependencies
npm run dev                                # Development server
npm run build                              # Production build

# Useful URLs
Blockchain RPC:  http://127.0.0.1:8545
API Bridge:      http://localhost:5000
Dashboard:       http://localhost:5173
```

---

**Ready to go! 🎉 Start with Step 2 and follow the guide sequentially.**
