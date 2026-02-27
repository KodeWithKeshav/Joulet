# 💡 Joulet Quick Reference & Tips

## 🚀 Super Quick Start (3 Steps)

```bash
# 1. Navigate to project
cd joulet-project

# 2. Run startup script
chmod +x start.sh && ./start.sh

# 3. Select option 1 and open browser to http://localhost:5173
```

**Done!** You now have a running energy trading platform.

---

## 🎮 Dashboard Quick Guide

### Producer Console
- **Generate Solar Energy** - Click button to simulate energy production
- **Progress Bar** - Shows kWh accumulated (0/10 kWh = 0/1 token)
- **Auto-Mining** - At 10 kWh, 1 JLT token is automatically minted
- **Wallet** - Shows JLT balance and USD holdings
- **Live Ledger** - Shows all blockchain transactions

### Consumer Dashboard
- **Energy Marketplace** - Shows available JLT tokens for purchase
- **Buy JLT** - Purchase tokens using USD
- **My Dashboard** - Shows wallet balance and energy credits
- **Redeem Energy** - Burn 1 JLT to get 10 kWh energy credits

---

## 🔗 System Components Map

```
Your Machine
├── Terminal 1: Blockchain (http://127.0.0.1:8545)
│   └── Hardhat Node - Simulates Ethereum
│
├── Terminal 2: Smart Contract
│   └── JouletToken - Handles token minting/trading
│
├── Terminal 3: API Bridge (http://localhost:5000)
│   ├── Receives energy from IoT devices
│   ├── Submits to blockchain
│   └── Tracks metrics
│
└── Terminal 4: Dashboard (http://localhost:5173)
    └── React UI for testing
```

---

## 🔧 Important Configuration Files

### Must Update After First Deployment

1. **Contract Address** (appears after `npm run deploy`)
   - Update in: `iot-simulation/.env` → CONTRACT_ADDRESS
   - Update in: `client/.env` → VITE_CONTRACT_ADDRESS

2. **Oracle Account** (use Account 0 from Hardhat)
   - Set in: `iot-simulation/.env` → ORACLE_PRIVATE_KEY

3. **Producer Account** (use Account 1 from Hardhat)
   - Set in: `iot-simulation/.env` → PRODUCER_ADDRESS

---

## 📊 Key Numbers to Remember

| Parameter | Value | Meaning |
|-----------|-------|---------|
| Mining Difficulty (Demo) | 10 | 10 kWh = 1 JLT token |
| Mining Difficulty (Production) | 1000 | 1000 kWh = 1 JLT token |
| JLT Rate | $0.50 | 1 JLT costs $0.50 |
| Reporting Threshold | 10 kWh | Energy amount to trigger blockchain report |
| Carbon NFT Threshold | 1220 kWh | Auto-mint carbon credit NFT |
| Chain ID | 1337 | Hardhat test network ID |
| API Port | 5004 | Where to access REST API |
| Dashboard Port | 5175 | Where to access UI |

**⚠️ Configuration Note:** Demo uses accelerated 10 kWh rate for real-time visualization. Production should use 1000 kWh rate per economic model.

---

## 🧪 Testing Shortcuts

### Fastest Test Flow (30 seconds)

1. **Click Generate** → Click 5 times → See 10+ kWh → Auto-mine → 1 JLT minted
2. **View Ledger** → See new MINT block
3. **Switch to Consumer** → Buy 5 JLT → See TRADE block
4. **Click Redeem** → Burn token → See BURN block

**Total:** 3 blocks, 1 token minted, 1 token traded, 1 token burned

### API Quick Test

```bash
# Is API running?
curl http://localhost:5000/

# How much energy accumulated?
curl http://localhost:5000/api/energy/metrics

# How many reports sent?
curl http://localhost:5000/api/energy/history | grep -o "total_reports"

# Simulate IoT device sending 5.5 kWh
curl -X POST "http://localhost:5000/api/test/simulate?kwh=5.5"
```

---

## 🐛 Quick Fixes

### "Port 5000 already in use"
```bash
# Find process
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change port in iot-simulation/.env
API_PORT=5001
```

### "ModuleNotFoundError: No module named 'flask'"
```bash
cd iot-simulation
source venv/bin/activate
pip install flask flask-cors
```

### "Contract at address doesn't exist"
```bash
# Redeploy contract
cd blockchain
npm run deploy

# Copy new address and update .env files
```

### "Cannot connect to blockchain"
```bash
# Make sure Hardhat is running in Terminal 1
cd blockchain
npx hardhat node
```

---

## 📝 File Modification Cheat Sheet

### Change Energy Difficulty (10 kWh = 1 JLT)
**File:** `blockchain/contracts/JouletToken.sol`
```solidity
uint256 public constant MINING_DIFFICULTY = 10;  // Change this
```

### Change JLT Price ($0.50)
**File:** `client/src/App.jsx`
```javascript
const JLT_RATE = 0.50;  // Change this
```

### Change API Reporting Threshold (auto-report at X kWh)
**File:** `iot-simulation/api_bridge.py`
```python
REPORTING_THRESHOLD = 10  # Change this
```

### Change Dashboard Port (5173)
**File:** `client/vite.config.js`
```javascript
server: {
  port: 5173  // Change this
}
```

---

## 🔐 Account Passwords (Hardhat Test Accounts)

When you run `npx hardhat node`, you get 20 test accounts:

```
Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETH Balance: 10000 ETH (free!)

Account 1: 0x70997970C51812e339D9B73b0245ad59422d3d12
Private Key: 0x59c6995e6f3789f0503cc565cf308ba32ba6ac9bfbcf2f0c2c87e20c3a4f2aa7
ETH Balance: 10000 ETH (free!)
```

Use Account 0 as Oracle, Account 1 as Producer.

---

## 📡 API Endpoints Quick List

```bash
# Health
GET /

# Status
GET /api/status

# Submit energy
POST /api/energy/reading

# Report to blockchain
POST /api/energy/report

# Get metrics
GET /api/energy/metrics

# Get history
GET /api/energy/history

# Reset (for testing)
POST /api/energy/reset

# Simulate device (for testing)
POST /api/test/simulate?kwh=5.5
```

---

## 🎯 Common Tasks & Solutions

### Task: Manually trigger blockchain transaction
```bash
# API will auto-report when 10 kWh is accumulated
# Or manually:
curl -X POST http://localhost:5000/api/energy/report \
  -H "Content-Type: application/json" \
  -d '{"kwh_amount": 15.0}'
```

### Task: Reset everything (start fresh)
```bash
# 1. Stop all terminals (Ctrl+C)
# 2. Reset metrics
curl -X POST http://localhost:5000/api/energy/reset

# 3. Restart Hardhat node and redeploy contract
cd blockchain
npx hardhat node  # New terminal 1
npm run deploy    # New terminal 2
```

### Task: Add a new energy source (e.g., wind turbine)
```python
# In api_bridge.py, add:
@app.route('/api/energy/wind-reading', methods=['POST'])
def add_wind_reading():
    # Similar to add_energy_reading() but for wind
    pass
```

### Task: Deploy to Sepolia testnet
```bash
# 1. Update hardhat.config.js with Sepolia RPC
# 2. Fund your wallet with Sepolia ETH (from faucet)
# 3. Set SEPOLIA_PRIVATE_KEY in .env
# 4. Deploy:
npm run deploy -- --network sepolia
```

---

## 🚦 Status Indicators

### Dashboard Status (Top Right)
- **"Connected to Joulet Testnet"** = Blockchain connected ✓
- **"Block Height #1025"** = Blockchain is running ✓

### API Bridge Status
- **"Oracle address: 0xf39..."** = Oracle initialized ✓
- **"Contract loaded at 0x5Fb..."** = Contract connected ✓

### Console Errors
- **"Cannot POST /api/energy/reading"** = API not running
- **"Failed to connect to 127.0.0.1:8545"** = Blockchain not running

---

## 📚 File Sizes (Know What You're Working With)

```
api_bridge.py        ~8 KB  - Flask REST API
solar_oracle.py      ~6 KB  - IoT simulator
App.jsx              ~12 KB - React dashboard
JouletToken.sol      ~2 KB  - Smart contract
README.md            ~15 KB - Project documentation
SETUP.md             ~25 KB - Setup guide
API_DOCUMENTATION.md ~20 KB - API reference

Total Project Size:  ~100 KB (pretty small!)
```

---

## ⚡ Performance Tips

### Make it Faster
- [ ] Use SSD for blockchain data (faster disk I/O)
- [ ] Close unused browser tabs (less memory)
- [ ] Use Chrome/Brave (faster than Firefox for local testing)
- [ ] Reduce polling interval in API (faster updates)

### Make it More Reliable
- [ ] Increase gas limit if transactions fail
- [ ] Use confirmed block numbers (not pending)
- [ ] Add retry logic for network failures
- [ ] Log all transactions for debugging

---

## 🎓 Learning Path

### Week 1: Understand the System
- [ ] Read README.md cover to cover
- [ ] Run the dashboard and play with it
- [ ] Check API endpoints with curl
- [ ] Read smart contract code

### Week 2: Modify & Experiment
- [ ] Change energy difficulty to 5 (easier minting)
- [ ] Adjust JLT price to $1.00
- [ ] Add logging to track transactions
- [ ] Create custom API endpoints

### Week 3: Integration
- [ ] Connect real IoT device data
- [ ] Add database persistence
- [ ] Implement user authentication
- [ ] Deploy to testnet

### Week 4: Production
- [ ] Audit smart contract
- [ ] Set up CI/CD pipeline
- [ ] Deploy to mainnet
- [ ] Monitor and optimize

---

## 🆘 Emergency Recovery

### Blockchain Corrupted?
```bash
# Start fresh
cd blockchain
rm -rf artifacts cache
npx hardhat clean
npm run compile
npx hardhat node  # Fresh network
npm run deploy    # Redeploy
```

### Python Issues?
```bash
# Rebuild environment
cd iot-simulation
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend Issues?
```bash
# Clear everything
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📞 When You're Stuck

1. **Check logs** - Terminal output has the answer 90% of the time
2. **Verify .env** - Most issues are configuration
3. **Ensure all processes running** - Need blockchain + API + frontend
4. **Read the error** - Read it carefully, top to bottom
5. **Google the error** - Exact error message usually has solution
6. **Check GitHub Issues** - Hardhat/Web3/React communities
7. **Ask in forums** - Stack Overflow, Reddit, Discord servers

---

## 🎉 Success Checklist

You know you're good when:

- [ ] Hardhat node starts without errors
- [ ] Smart contract deploys successfully
- [ ] API bridge connects to contract
- [ ] Dashboard loads at http://localhost:5173
- [ ] Clicking "Generate Energy" produces readings
- [ ] Energy accumulates in progress bar
- [ ] At 10 kWh, token is minted automatically
- [ ] New block appears in Live Ledger
- [ ] Can switch between Producer/Consumer
- [ ] Consumer can buy and redeem tokens
- [ ] All blocks show in ledger with correct types

**If all ✓ = You're done! Time to customize and deploy!** 🚀

---

**Happy coding!** ⚡ Feel free to customize, fork, and deploy this to production. The future of energy trading is in your hands!
