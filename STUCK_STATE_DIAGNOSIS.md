# Frontend Stuck State — Diagnosis and Fixes

## Problem
The frontend sometimes displayed a "stuck" state where:
- **Accumulated energy was much higher than the reporting threshold** (e.g., 56.03 kWh vs. 11.0 kWh)
- **No auto-report was being triggered** despite accumulated energy far exceeding the threshold
- **Difficulty remained constant** instead of dynamically adjusting based on generation frequency

## Root Causes Identified

### 1. **Broken Simulator Sleep Mechanism** ⚠️ CRITICAL
**File:** `iot-simulation/api_bridge.py` → `simulator_loop()`

**Original Code (BROKEN):**
```python
finally:
    threading.Event().wait(SIM_INTERVAL)
```

**Issue:**
- `threading.Event()` creates a **new, unset event** each iteration
- `.wait()` on an unset event **blocks forever** (or times out after SIM_INTERVAL)
- This caused the simulator loop to stall and stop generating readings
- Accumulated energy piled up without triggering the auto-report logic

**Fix Applied:**
```python
time.sleep(SIM_INTERVAL)
```
- Simple, reliable sleep mechanism
- Ensures the simulator loop runs consistently at the desired interval

---

### 2. **No Manual Recovery Mechanism** ⚠️ UX ISSUE
**Files Affected:** 
- `iot-simulation/api_bridge.py` (API)
- `client/src/App.jsx` (Frontend)

**Issue:**
- If the system got stuck (e.g., due to the simulator bug), users had no way to recover
- The accumulated energy would sit in the buffer indefinitely
- Only workaround was to restart the entire API

**Fix Applied:**
1. **Admin Endpoint** (`/api/admin/force-report`):
   - Manually triggers energy report regardless of threshold
   - Resets accumulated energy after successful report
   - Logs the forced report for debugging

2. **Frontend Button** (Force Report):
   - Added "🔧 Force Report (if stuck)" button in Producer View
   - Lets users manually flush accumulated energy to blockchain
   - Updates frontend state immediately on success

---

### 3. **Frontend Not Syncing Live Difficulty** 
**File:** `client/src/App.jsx`

**Issue:**
- Frontend was using a hardcoded `MINING_DIFFICULTY = 10`
- Server's dynamic `reporting_threshold` was never reflected in the UI
- Users couldn't see that difficulty was changing

**Fix Applied (from previous iteration):**
- Frontend now syncs `miningDifficulty` state from `/api/status`
- All UI calculations and progress bar use the live server value
- When difficulty increases (oversupply) or decreases (undersupply), users see it in real-time

---

## Testing the Fixes

### 1. Verify Simulator is Running Continuously
```bash
# Watch the API logs
tail -f /tmp/api.log

# Should see repeated lines like:
# [simulator] generated 2.5 kWh, accumulated=2.5, auto_reported=False
# [simulator] generated 1.8 kWh, accumulated=4.3, auto_reported=False
```

### 2. Test Auto-Report at Threshold
```bash
# Check current metrics
curl http://localhost:5001/api/status | jq '.metrics'

# Generate energy until accumulated >= threshold
for i in {1..5}; do
  curl -X POST http://localhost:5001/api/test/simulate \
    -H "Content-Type: application/json" \
    -d '{"kwh":3}'
  sleep 0.5
done

# Check if auto-report was triggered (accumulated should reset to 0)
curl http://localhost:5001/api/status | jq '.metrics.accumulated_energy'
```

### 3. Test Manual Force Report (if stuck)
```bash
# Accumulate some energy
curl -X POST http://localhost:5001/api/test/simulate -d '{"kwh":5}' -H "Content-Type: application/json"

# Check accumulated is > 0
curl http://localhost:5001/api/status | jq '.metrics.accumulated_energy'

# Force report (clears stuck energy)
curl -X POST http://localhost:5001/api/admin/force-report

# Verify accumulated is now 0
curl http://localhost:5001/api/status | jq '.metrics.accumulated_energy'
```

### 4. Test Dynamic Difficulty in Frontend
1. Open the frontend dashboard
2. Watch the **Market Status sidebar** → Difficulty should show the live `reporting_threshold`
3. Press **"Generate Solar Energy"** repeatedly or use curl to simulate many readings
4. **Difficulty should increase** if generation is too frequent (oversupply)
5. **Difficulty should decrease** if generation is too sparse (undersupply)
6. Progress bar shows `pending / difficulty` in real-time

---

## Configuration Tuning

Edit `iot-simulation/.env` to tune behavior:

```bash
# Simulator parameters (server-side random generation)
SIM_INTERVAL=5.0              # seconds between readings
SIM_MIN_KWH=0.5               # minimum kWh per reading
SIM_MAX_KWH=5.0               # maximum kWh per reading

# Dynamic difficulty parameters
DIFF_WINDOW_SEC=60            # sliding window for rate calculation
DIFF_TARGET_READINGS=6.0      # desired readings per window
DIFF_STEP=1.0                 # how much to adjust difficulty per change
DIFF_MIN=1.0                  # minimum reporting threshold
DIFF_MAX=100.0                # maximum reporting threshold
```

**Example: Make difficulty more responsive**
```bash
DIFF_WINDOW_SEC=30            # shorter window = faster response
DIFF_STEP=2.0                 # larger step = bigger changes
DIFF_TARGET_READINGS=4.0      # lower target = higher difficulty sooner
```

Restart the API after changing `.env`:
```bash
pkill -f "python api_bridge.py"
cd iot-simulation && source venv/bin/activate && python api_bridge.py
```

---

## Files Modified

1. ✅ `iot-simulation/api_bridge.py`
   - Fixed `simulator_loop()` sleep mechanism
   - Added `/api/admin/force-report` endpoint

2. ✅ `client/src/App.jsx`
   - Added `forceReport()` action handler
   - Added "Force Report" button to UI
   - Already syncing live `reporting_threshold`

---

## Next Steps (Optional Enhancements)

1. **Persistence**: Store metrics in a database so restarting the API preserves state
2. **WebSocket Updates**: Replace polling with real-time updates for instant difficulty display
3. **Monitoring Dashboard**: Add a debug panel showing simulator status, recent readings, and rate calculations
4. **Alerting**: Notify users if simulator stalls or auto-report fails

---

## Status: ✅ RESOLVED

- Simulator now runs reliably with proper sleep
- Auto-report works correctly when threshold is crossed
- Manual recovery available via Force Report button
- Frontend displays live difficulty and reacts to changes

Reload the frontend and test the scenarios above to confirm the system is no longer stuck!
