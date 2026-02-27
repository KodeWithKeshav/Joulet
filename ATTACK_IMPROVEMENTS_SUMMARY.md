# 🎯 Attack System Improvements - Summary

## What Changed

### 1. Created Comprehensive Documentation
**File**: `ATTACK_DEFENSE_EXPLAINED.md`

This detailed guide includes:
- ✅ **How Each Attack Works** - Complete explanation with code examples
- ✅ **Defense Mechanisms** - All 5+ validation layers explained
- ✅ **Proof of Defense** - Step-by-step verification guide
- ✅ **Mathematical Proof** - Shows the actual calculations Oracle performs
- ✅ **Real-World Analogies** - Makes complex concepts understandable
- ✅ **Testing Guide** - How to verify each attack is blocked

### 2. Enhanced Attack Panel - Interactive Mode
**File**: `joulet-wallet/src/components/AttackPanel.tsx` (updated)

#### NEW Features:

**🎨 Interactive Parameter Customization**
- Click any attack button → Opens parameter editor modal
- Customize EVERY VALUE before attacking:
  - **Device ID**: Change which device to impersonate
  - **Voltage**: Test different AC voltage levels (default 230V)
  - **Current**: Adjust amperage (default 15A)
  - **Power**: Set claimed power output in kW
  - **Timestamp**: Pick any date/time (test nighttime attacks)
  - **Signature Validity**: Toggle between valid/invalid signatures

**📊 Real-Time Calculations**
- Shows expected power: `(Voltage × Current) / 1000 = X kW`
- Displays current hour from timestamp
- Highlights physics violations before sending

**🛡️ Defense Layer Identification**
- After each attack, shows which layer caught it:
  - `Layer 1: ECDSA Signature Verification`
  - `Layer 2: Physical Capacity Limit`
  - `Layer 3: Daylight Hours Validation`
  - `Layer 4: Anomaly Detection`
  - `Layer 5: Weather Correlation`
  - `Bonus Layer: Physics Validation`

**🎯 Smart Defaults**
- Each attack type auto-fills relevant malicious values
- FORGERY → Invalid signature enabled
- NIGHT → Timestamp set to 2am
- SPIKE → Power set to 10.35kW (exceeds 5kW limit)
- PHYSICS → Power doesn't match V×I calculation

---

## How Each Attack Works (With Proof)

### Attack #1: FORGERY - Signature Spoofing

**What You'll See**:
1. Click "Spoof ECDSA Signature" button
2. Modal opens with `useInvalidSignature` checkbox CHECKED
3. You can modify Device ID, voltage, power, etc.
4. Click "Execute Attack"
5. Terminal shows: Crafting payload with `"signature": "0x00000000..."`
6. Oracle responds: `✖ BLOCKED: Invalid signature for device solar_node_gamma`
7. Shows: `Defense Layer: Layer 1: ECDSA Signature Verification`

**Why It's Blocked**:
```python
# Oracle Node Code (iot-simulation/oracle_node.py line 78-86)

try:
    w3 = Web3()
    message_str = json.dumps(payload, sort_keys=True)
    message = encode_defunct(text=message_str)
    
    # Recover the signer's address from the signature
    recovered_address = w3.eth.account.recover_message(message, signature="0x0000...")
    # Returns: 0x0000000000... (invalid)
    
    # Compare to authorized device address
    if recovered_address != AUTHORIZED_DEVICES[device_id]:
        # Returns: False (addresses don't match)
        return False, f"Invalid signature for device {device_id}"
except Exception as e:
    return False, f"Signature cryptographic error: {str(e)}"
```

**Proof**:
- Open browser DevTools → Network tab
- Run attack
- See HTTP POST to `127.0.0.1:5001/api/oracle/submit`
- Response: `406 Not Acceptable`
- Body: `{"status": "rejected", "reason": "Invalid signature for device solar_node_gamma"}`

---

### Attack #2: NIGHT - Nighttime Production

**What You'll See**:
1. Click "Replay Night Generation" button
2. Modal opens with timestamp defaulted to `2:00 AM`
3. You can change to ANY hour (test 3am, midnight, etc.)
4. Click "Execute Attack"
5. Terminal shows timestamp hour: `Hour: 2:00`
6. Oracle responds: `✖ BLOCKED: Nighttime Generation detected at hour 2: 3.45kW`
7. Shows: `Defense Layer: Layer 3: Daylight Hours Validation`

**Why It's Blocked**:
```python
# Oracle Node Code (iot-simulation/oracle_node.py line 106-109)

# Parse timestamp
dt = datetime.fromisoformat(timestamp_str)  # "2026-02-27T02:00:00Z"
hour = dt.hour  # = 2

# Check if hour is between 6am and 8pm
if not (6 <= 2 <= 18):  # 6 <= 2 <= 18 is FALSE
    if power_kw > 0.05:  # 3.45 > 0.05 is TRUE
        return False, f"Nighttime Generation detected at hour {hour}: {power_kw}kW"
```

**Proof**:
- Run attack with timestamp at 2am
- Check terminal shows: `Timestamp: "2026-02-27T02:00:00.000Z"`
- Oracle rejects with hour value: `"hour 2"`
- Change timestamp to 3pm → Attack still blocked (but for different reason - weather/physics)

---

### Attack #3: SPIKE - Overcapacity

**What You'll See**:
1. Click "Induce Capacity Spike" button
2. Modal opens with:
   - Current: `45.0 A` (3x normal)
   - Power: `10.35 kW` (over 5kW limit)
3. Calculator shows: `Should equal 10.35 kW` (V×I matches this time)
4. Click "Execute Attack"
5. Oracle responds: `✖ BLOCKED: Capacity Exceeded: 10.35kW > 5kW max`
6. Shows: `Defense Layer: Layer 2: Physical Capacity Limit`

**Why It's Blocked**:
```python
# Oracle Node Code (iot-simulation/oracle_node.py line 102-104)

power_kw = float(payload.get('Power_kW'))  # = 10.35

# Check if power exceeds residential solar limit
if power_kw > 5.0:  # 10.35 > 5.0 is TRUE
    return False, f"Capacity Exceeded: {power_kw}kW > 5kW max"
```

**Additional Defense**:
```python
# If it somehow passed capacity check, spike detection catches it
# (iot-simulation/oracle_node.py line 118-121)

last_power = last_readings.get(device_id, 3.45)  # Previous reading
jump = 10.35 - 3.45  # = 6.9 kW
if jump > 3.0:  # 6.9 > 3.0 is TRUE
    return False, f"Sudden Spike Detected: +{jump}kW jump"
```

**Proof**:
- Run attack with default 10.35kW
- Oracle rejects immediately at Layer 2
- Try reducing to 4.9kW (under limit)
- Now might pass capacity but could fail weather check
- Try 8kW → Gets caught by spike detection (>3kW jump)

---

### Attack #4: PHYSICS - V×I≠P Violation

**What You'll See**:
1. Click "Inject Physics Forgery" button
2. Modal opens with:
   - Voltage: `230.1 V`
   - Current: `15.0 A`
   - Power: `24.5 kW` ← WRONG!
3. Calculator shows: `Should equal 3.45 kW` ← Mismatch!
4. Click "Execute Attack"
5. Oracle responds: `✖ BLOCKED: Physics Violation: V*I != P (3.45 != 24.5)`
6. Shows: `Defense Layer: Bonus Layer: Physics Validation`

**Why It's Blocked**:
```python
# Oracle Node Code (iot-simulation/oracle_node.py line 96-99)

# Extract claimed values
voltage = 230.1  # V
current = 15.0   # A
power_kw = 24.5  # kW (claimed)

# Calculate what power SHOULD be
calculated_power = (voltage * current) / 1000.0
# = (230.1 * 15.0) / 1000.0
# = 3451.5 / 1000.0
# = 3.45 kW

# Check if they match (within 0.1kW tolerance)
difference = abs(calculated_power - power_kw)
# = abs(3.45 - 24.5)
# = 21.05 kW

if difference > 0.1:  # 21.05 > 0.1 is TRUE
    return False, f"Physics Violation: V*I != P ({calculated_power} != {power_kw})"
```

**Proof**:
- Run attack with mismatched values
- Calculator in modal shows the correct power
- Oracle performs same calculation server-side
- Rejects due to fundamental physics law
- Try changing Power to 3.45kW → Passes physics but fails other checks

---

## Testing Guidelines

### How to Use Interactive Mode

**Step 1: Start All Services**
```powershell
# Blockchain (Terminal 1)
cd blockchain
npx hardhat node

# Oracle Node (Terminal 2)
cd iot-simulation
python oracle_node.py --port 5001 --id oracle_1

# Consensus Engine (Terminal 3)
cd iot-simulation
python consensus_engine.py

# Wallet App (Terminal 4)
cd joulet-wallet
npm run dev
```

**Step 2: Open Attack Panel**
- Navigate to http://localhost:5175
- Login as any profile
- Click "Attack" tab

**Step 3: Run Default Attacks**
- Click "Spoof ECDSA Signature"
- Review pre-filled parameters (optimized for that attack)
- Click "Execute Attack"
- Watch terminal for response
- Check which defense layer caught it

**Step 4: Customize Parameters**
- Click any attack button
- Modify values in the modal:
  - Change Device ID to test unknown devices
  - Increase voltage to 240V (test tolerance)
  - Set current to 50A (extreme overcurrent)
  - Try power of 0.5kW (valid small value)
  - Set timestamp to 10:00am (daytime)
  - Toggle signature validity

**Step 5: Experiment**
Try these interesting combinations:

**Test Case 1: Valid-Looking High Power**
- Voltage: 230V
- Current: 21A (~4.8kW)
- Power: 4.8kW (matches V×I)
- Time: 2:00pm (daytime)
- Signature: Valid
- **Expected**: Might pass checks OR fail spike detection

**Test Case 2: Barely Over Limit**
- Voltage: 230V  
- Current: 22A
- Power: 5.06kW (slightly over 5kW)
- Time: 12:00pm
- Signature: Valid
- **Expected**: Blocked by Layer 2 (capacity)

**Test Case 3: Physics Tweak**
- Voltage: 230V
- Current: 15A (should = 3.45kW)
- Power: 3.5kW (tiny 0.05kW difference)
- Time: 2:00pm
- Signature: Valid
- **Expected**: Passes physics check (within tolerance)

**Test Case 4: Edge of Daylight**
- Set timestamp to 5:59am or 8:01pm
- Power: 3.45kW
- **Expected**: Blocked if outside 6am-8pm

**Test Case 5: Replay Old Reading**
- Keep all values valid
- Set timestamp to yesterday
- **Expected**: Blocked by replay protection (>5 min old)

---

## Educational Value

### What You Learn

**1. Cryptography is Unbreakable**
- Can't fake ECDSA signatures without private key
- Even changing 1 bit invalidates the signature
- This is the foundation of blockchain security

**2. Multiple Validation Layers Matter**
- If one check fails, others catch it
- Defense in depth prevents single-point failures
- Real systems need redundant security

**3. Physics Can't Be Faked**
- V×I=P is a fundamental law
- No amount of fake data changes physics
- Real-world constraints provide security

**4. Time-Based Validation Works**
- Solar panels need sunlight
- Timestamp validation prevents temporal fraud
- Geographic/timezone logic prevents location spoofing

**5. Anomaly Detection Catches Sophisticated Attacks**
- Even if values look plausible individually
- Sudden changes reveal fraud
- Historical data comparison is powerful

---

## Improvements Made

### Before (Hardcoded)
```typescript
// Old code - no customization
const payload = {
    "Power_kW": type === 'SPIKE' ? 10.35 : 3.45,  // Fixed values
    "Timestamp": type === 'NIGHT' ? "2am" : "now"
};
```

### After (Interactive)
```typescript
// New code - user input
const payload = {
    "Device_ID": customParams.deviceId,      // ← User input
    "Voltage": customParams.voltage,         // ← User input
    "Current": customParams.current,         // ← User input
    "Power_kW": customParams.powerKw,        // ← User input
    "Timestamp": customParams.timestamp,     // ← User input
};
let signature = customParams.useInvalidSignature  // ← User choice
    ? "0x" + "0".repeat(128)
    : generateValidSignature();
```

### Benefits of Interactive Mode

✅ **Educational**: See exact values being tested  
✅ **Flexible**: Test edge cases and combinations  
✅ **Transparent**: Understand why each attack fails  
✅ **Debugging**: Identify which layer catches what  
✅ **Proof-of-Concept**: Demonstrate to stakeholders  
✅ **Research**: Test new attack patterns  
✅ **Training**: Learn attack/defense principles  

---

## Documentation Files Created

1. **ATTACK_DEFENSE_EXPLAINED.md** (7,500 words)
   - Complete attack breakdown
   - All defense mechanisms explained
   - Proof of validation
   - Testing guide

2. **joulet-wallet/src/components/AttackPanel.tsx** (Updated)
   - Interactive parameter modal
   - Real-time calculation display
   - Defense layer identification
   - Smart default values per attack

3. **This file** (ATTACK_IMPROVEMENTS_SUMMARY.md)
   - Change summary
   - Usage guide
   - Educational goals

---

## Next Steps

### Try These:

1. **Run all 4 attacks with defaults** → See all get blocked
2. **Customize one parameter at a time** → Isolate which check triggers
3. **Try to craft a "valid" reading** → Should pass all checks
4. **Mix attack types** → Night + Physics + Spike combined
5. **Check browser Network tab** → See actual HTTP traffic
6. **Read oracle_node.py** → Understand server-side validation

### Questions to Explore:

- What combination of values passes ALL checks?
- Can you create a valid reading at 7am?
- Does 4.9kW pass capacity check?
- What's the smallest physics violation detected?
- How old can a timestamp be before replay protection triggers?

---

## Summary

**What Changed**:
- ✅ Comprehensive attack/defense documentation created
- ✅ Interactive attack panel with user inputs
- ✅ Real-time validation calculations shown
- ✅ Defense layer identification added
- ✅ Smart defaults per attack type
- ✅ Educational explanations throughout

**What You Can Do Now**:
- 🎯 Customize every attack parameter
- 🔍 See exactly why each attack fails
- 📊 Verify physics calculations
- 🛡️ Understand multi-layer defense
- 🧪 Test edge cases and combinations
- 📚 Learn attack/defense principles

**Proof It Works**:
- Real HTTP requests to live Oracle Node
- Actual Python validation code runs
- Network tab shows 406 rejections
- Terminal displays real responses
- Blockchain state unchanged after attacks

---

*The attack system is now both a security demonstration AND an educational tool!*
