#!/usr/bin/env python3
"""
API Bridge - Connects IoT Sensors to Blockchain
Provides REST API for energy data collection and blockchain interaction
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from solar_oracle import SolarOracle
import os
from dotenv import load_dotenv
import json
import threading
import random
from datetime import datetime
import time
from collections import deque
try:
    from OMPython import OMCSessionZMQ
    OMPYTHON_AVAILABLE = True
except ImportError:
    OMPYTHON_AVAILABLE = False
    print("⚠ OMPython not found. Falling back to random simulation.")

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global oracle instance
oracle = None
monitoring_thread = None

# ============================================================================
# CONFIGURATION
# ============================================================================

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
PRODUCER_ADDRESS = os.getenv("PRODUCER_ADDRESS", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

API_PORT = int(os.getenv("API_PORT", 5000))
API_HOST = os.getenv("API_HOST", "0.0.0.0")

# Simulator configuration (server-side automatic readings)
ENABLE_SIMULATOR = os.getenv("ENABLE_SIMULATOR", "true").lower() in ("1", "true", "yes")
SIM_INTERVAL = float(os.getenv("SIM_INTERVAL", 5.0))  # seconds between simulated readings
SIM_MIN_KWH = float(os.getenv("SIM_MIN_KWH", 0.5))
SIM_MAX_KWH = float(os.getenv("SIM_MAX_KWH", 5.0))

# Grid Simulator configuration
ENABLE_GRID_SIM = os.getenv("ENABLE_GRID_SIM", "true").lower() in ("1", "true", "yes")

# Dynamic difficulty (reporting threshold) tuning config
DIFF_WINDOW_SEC = int(os.getenv("DIFF_WINDOW_SEC", 60))  # sliding window for rate (seconds)
DIFF_TARGET_READINGS = float(os.getenv("DIFF_TARGET_READINGS", 6.0))  # desired readings per window
DIFF_STEP = float(os.getenv("DIFF_STEP", 1.0))  # how much to change threshold per adjustment
DIFF_MIN = float(os.getenv("DIFF_MIN", 1.0))
DIFF_MAX = float(os.getenv("DIFF_MAX", 100.0))

# ============================================================================
# STATE MANAGEMENT
# ============================================================================

class EnergyMetrics:
    """Track energy metrics from IoT devices"""
    def __init__(self):
        self.current_production = 0
        self.accumulated_energy = 0
        self.total_reported = 0
        self.reporting_threshold = 10  # kWh
        self.last_report_time = None
        self.report_history = []
    
    def to_dict(self):
        return {
            "current_production": round(self.current_production, 2),
            "accumulated_energy": round(self.accumulated_energy, 2),
            "total_reported": round(self.total_reported, 2),
            "reporting_threshold": self.reporting_threshold,
            "last_report_time": self.last_report_time,
            "reports_count": len(self.report_history)
        }

metrics = EnergyMetrics()

metrics = EnergyMetrics()
metrics_lock = threading.Lock()

# Modelica Bridge Singleton
modelica_bridge = None

class ModelicaBridge:
    def __init__(self, model_path="GridSystem.mo", model_name="GridSystem"):
        self.omc = OMCSessionZMQ()
        self.model_path = os.path.abspath(model_path)
        self.model_name = model_name
        self.is_connected = False
        
        # Load Model
        print(f"Loading Modelica model from {self.model_path}...")
        if not self.omc.sendExpression(f'loadFile("{self.model_path}")'):
            print(f"✗ Failed to load {self.model_name}. Standard library might be missing.")
            # Try loading StdLib just in case
            self.omc.sendExpression("loadModel(Modelica)")
            if not self.omc.sendExpression(f'loadFile("{self.model_path}")'):
                 raise Exception("Could not load model after Modelica lib load.")
        
        # Instantiate
        print(f"Building {self.model_name}...")
        # We use building to get an executable for faster stepped simulation if possible, 
        # but for simplicity we will stick to standard translate/simulate usage
        self.omc.sendExpression(f"instantiateModel({self.model_name})")
        self.is_connected = True
        print(f"✓ Connected to OpenModelica!")

    def get_realcheck(self):
        # Quick check command
        return self.omc.sendExpression("getVersion()")
    
    def simulate_step(self, time_idx):
        # We simulate a small window or fetch based on parameter
        # In a real stepped simulation we would use the interactive API.
        # Here we will simulate 0.1s from current time simply to get a reading.
        # This is computationally expensive but simplest for 'stateless' bridge.
        
        # NOTE: For true interactive, we should use `simulate(..., method="dassl", options="...")` keeping state.
        # But OMPython's easiest path is standard `simulate()`.
        # To simulate "Time passing", we just adjust startTime/stopTime.
        
        start = time_idx
        stop = time_idx + 0.1
        
        cmd = f'simulate({self.model_name}, startTime={start}, stopTime={stop}, numberOfIntervals=1, simflags="-lv=LOG_STATS")'
        res = self.omc.sendExpression(cmd)
        
        # Retrieve Variable Values at end time
        voltage = self.omc.sendExpression(f"val(powerSensor.v, {stop})")
        power = self.omc.sendExpression(f"val(powerSensor.p, {stop})")
        
        return float(voltage), float(power)

# Recent readings timestamps for rate calculation
recent_readings = deque()
last_difficulty_check = time.time()  # throttle difficulty adjustments

def adjust_difficulty_if_needed():
    """Adjust reporting_threshold based on recent reading frequency.
    Only checks and adjusts every DIFF_WINDOW_SEC to avoid thrashing."""
    global last_difficulty_check
    now = time.time()
    
    # Only check difficulty adjustment periodically (not on every reading)
    if now - last_difficulty_check < DIFF_WINDOW_SEC:
        return
    
    last_difficulty_check = now
    
    # prune old timestamps
    cutoff = now - DIFF_WINDOW_SEC
    while recent_readings and recent_readings[0] < cutoff:
        recent_readings.popleft()

    count = len(recent_readings)
    # If too many readings in the window, increase difficulty
    if count > DIFF_TARGET_READINGS:
        # increase threshold
        old = metrics.reporting_threshold
        metrics.reporting_threshold = min(DIFF_MAX, metrics.reporting_threshold + DIFF_STEP)
        if metrics.reporting_threshold != old:
            print(f"[DIFFICULTY] Increased: {old} -> {metrics.reporting_threshold} (rate={count} readings/{DIFF_WINDOW_SEC}s, accumulated={metrics.accumulated_energy:.2f})")
    elif count < DIFF_TARGET_READINGS and metrics.reporting_threshold > DIFF_MIN:
        old = metrics.reporting_threshold
        metrics.reporting_threshold = max(DIFF_MIN, metrics.reporting_threshold - DIFF_STEP)
        if metrics.reporting_threshold != old:
            print(f"[DIFFICULTY] Decreased: {old} -> {metrics.reporting_threshold} (rate={count} readings/{DIFF_WINDOW_SEC}s, accumulated={metrics.accumulated_energy:.2f})")

def process_reading(kwh, device_id='unknown'):
    """
    Centralized processing for a single energy reading.
    Updates metrics and performs auto-reporting when threshold reached.
    Returns a dict with status and whether auto-reported.
    """
    with metrics_lock:
        metrics.current_production = float(kwh)
        metrics.accumulated_energy += float(kwh)

        # record timestamp for frequency-based difficulty adjustments
        recent_readings.append(time.time())
        
        # --- DYNAMIC DIFFICULTY ADJUSTMENT (DDA) ---
        # Goal: Maintain 1 Mint Event every ~30 seconds (for demo pacing)
        # If we are filling the buffer too fast, RAISE the bar (difficulty).
        TARGET_MINT_INTERVAL = 15.0 # seconds
        
        should_report = metrics.accumulated_energy >= metrics.reporting_threshold
        auto_reported = False

        if should_report:
            now = time.time()
            # Calculate time since last mint
            last_time = time.mktime(datetime.fromisoformat(metrics.last_report_time).timetuple()) if metrics.last_report_time else (now - TARGET_MINT_INTERVAL)
            time_delta = now - last_time
            
            # Adjust Difficulty
            old_diff = metrics.reporting_threshold
            if time_delta < TARGET_MINT_INTERVAL:
                # Too fast! Increase difficulty
                metrics.reporting_threshold = min(DIFF_MAX, metrics.reporting_threshold * 1.1)
                print(f"[DDA] ⚡️ Mining too fast ({time_delta:.1f}s < {TARGET_MINT_INTERVAL}s). Difficulty UP: {old_diff:.2f} -> {metrics.reporting_threshold:.2f} kWh")
            else:
                # Too slow! Decrease difficulty (make it easier)
                metrics.reporting_threshold = max(DIFF_MIN, metrics.reporting_threshold * 0.9)
                print(f"[DDA] 🐢 Mining too slow ({time_delta:.1f}s > {TARGET_MINT_INTERVAL}s). Difficulty DOWN: {old_diff:.2f} -> {metrics.reporting_threshold:.2f} kWh")
            
            if oracle:
                # capture amount to report
                amount = metrics.accumulated_energy
                try:
                    success = oracle.report_energy(PRODUCER_ADDRESS, amount)
                    auto_reported = bool(success)
                    if success:
                        metrics.total_reported += amount
                        metrics.last_report_time = datetime.now().isoformat()
                        metrics.report_history.append({
                            "timestamp": metrics.last_report_time,
                            "amount": amount,
                            "difficulty": metrics.reporting_threshold, # Store historical difficulty for graph
                            "device": device_id,
                            "producer": PRODUCER_ADDRESS
                        })
                        metrics.accumulated_energy = 0
                        print(f"[AUTO-REPORT] SUCCESS: {amount:.2f} kWh reported to blockchain (New Diff: {metrics.reporting_threshold:.2f})")
                except Exception as e:
                    print(f"[AUTO-REPORT] ERROR: {str(e)}")
            else:
                 print(f"[AUTO-REPORT] SKIPPED: Oracle not initialized")

        return {
            "kwh": float(kwh),
            "accumulated": round(metrics.accumulated_energy, 2),
            "should_report": should_report,
            "auto_reported": auto_reported,
            "metrics": metrics.to_dict()
        }
# ============================================================================
# INITIALIZATION
# ============================================================================

def initialize_oracle():
    """Initialize the Solar Oracle connection"""
    global oracle
    try:
        oracle = SolarOracle(
            rpc_url=RPC_URL,
            contract_address=CONTRACT_ADDRESS,
            oracle_private_key=ORACLE_PRIVATE_KEY
        )
        print("✓ Oracle initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize oracle: {str(e)}")
        return False

# ============================================================================
# REST API ENDPOINTS
# ============================================================================

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Joulet Energy API Bridge",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get overall system status"""
    oracle_connected = oracle is not None and oracle.w3.is_connected()
    
    return jsonify({
        "status": "ok" if oracle_connected else "disconnected",
        "oracle": {
            "connected": oracle_connected,
            "address": oracle.oracle_address if oracle else None
        },
        "contract": {
            "address": CONTRACT_ADDRESS,
            "status": "deployed"
        },
        "metrics": metrics.to_dict(),
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/energy/report', methods=['POST'])
def report_energy():
    """
    Report energy production to blockchain
    
    Expected JSON:
    {
        "kwh_amount": 10.5,
        "producer_address": "0x...",
        "device_id": "solar_panel_1"
    }
    """
    try:
        data = request.json
        
        # Validate input
        if not data or 'kwh_amount' not in data:
            return jsonify({"error": "Missing kwh_amount"}), 400
        
        kwh_amount = float(data.get('kwh_amount', 0))
        producer_addr = data.get('producer_address', PRODUCER_ADDRESS)
        device_id = data.get('device_id', 'default')
        
        if kwh_amount <= 0:
            return jsonify({"error": "kwh_amount must be positive"}), 400
        
        if oracle is None:
            return jsonify({"error": "Oracle not initialized"}), 500
        
        # Report to blockchain
        success = oracle.report_energy(producer_addr, kwh_amount)
        
        if success:
            # Update metrics
            metrics.accumulated_energy = 0
            metrics.total_reported += kwh_amount
            metrics.last_report_time = datetime.now().isoformat()
            metrics.report_history.append({
                "timestamp": metrics.last_report_time,
                "amount": kwh_amount,
                "device": device_id,
                "producer": producer_addr
            })
            
            return jsonify({
                "success": True,
                "message": f"Reported {kwh_amount} kWh to blockchain",
                "producer": producer_addr,
                "kwh": kwh_amount,
                "metrics": metrics.to_dict()
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Failed to report energy to blockchain"
            }), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/energy/reading', methods=['POST'])
def add_energy_reading():
    """
    Add energy reading from IoT device (doesn't automatically report)
    
    Expected JSON:
    {
        "kwh": 2.5,
        "device_id": "solar_panel_1",
        "timestamp": "2024-01-15T10:30:00Z"
    }
    """
    try:
        data = request.json
        
        if not data or 'kwh' not in data:
            return jsonify({"error": "Missing kwh"}), 400
        
        kwh = float(data.get('kwh', 0))
        device_id = data.get('device_id', 'unknown')
        
        if kwh < 0:
            return jsonify({"error": "kwh cannot be negative"}), 400
        
        # Process reading via centralized function
        result = process_reading(kwh, device_id=device_id)

        response = {
            "success": True,
            "reading": {
                "kwh": kwh,
                "device_id": device_id,
                "timestamp": data.get('timestamp', datetime.now().isoformat())
            },
            "accumulated": result.get('accumulated'),
            "should_report": result.get('should_report'),
            "auto_reported": result.get('auto_reported'),
            "metrics": result.get('metrics')
        }

        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/energy/metrics', methods=['GET'])
def get_metrics():
    """Get current energy metrics"""
    return jsonify({
        "metrics": metrics.to_dict(),
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/energy/history', methods=['GET'])
def get_report_history():
    """Get history of energy reports"""
    limit = request.args.get('limit', 10, type=int)
    
    return jsonify({
        "reports": metrics.report_history[-limit:],
        "total_reports": len(metrics.report_history),
        "total_energy_reported": round(metrics.total_reported, 2),
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/energy/reset', methods=['POST'])
def reset_metrics():
    """Reset energy metrics (for testing)"""
    metrics.accumulated_energy = 0
    metrics.current_production = 0
    metrics.report_history.clear()
    
    return jsonify({
        "message": "Metrics reset",
        "metrics": metrics.to_dict()
    }), 200


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get API configuration (non-sensitive)"""
    return jsonify({
        "contract_address": CONTRACT_ADDRESS,
        "rpc_url": RPC_URL,
        "producer_address": PRODUCER_ADDRESS,
        "reporting_threshold": metrics.reporting_threshold,
        "api_version": "1.0.0"
    }), 200


@app.route('/api/test/simulate', methods=['POST'])
def simulate_reading():
    """Simulate an energy reading (for testing without IoT devices)"""
    try:
        # allow kwh via json or query param
        try:
            payload = request.get_json(silent=True) or {}
        except Exception:
            payload = {}

        kwh = None
        if payload and 'kwh' in payload:
            kwh = float(payload.get('kwh'))
        else:
            kwh = float(request.args.get('kwh', 3.5))

        result = process_reading(kwh, device_id='simulator')

        response = {
            "simulated": True,
            "kwh": kwh,
            "accumulated": result.get('accumulated'),
            "auto_reported": result.get('auto_reported'),
            "metrics": result.get('metrics')
        }

        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/admin/force-report', methods=['POST'])
def force_report():
    """Admin endpoint to manually trigger energy report (for unstuck stuck states)."""
    try:
        with metrics_lock:
            if metrics.accumulated_energy <= 0:
                return jsonify({"error": "No accumulated energy to report"}), 400
            
            if not oracle:
                return jsonify({"error": "Oracle not initialized"}), 500
            
            amount = metrics.accumulated_energy
            try:
                success = oracle.report_energy(PRODUCER_ADDRESS, amount)
                if success:
                    metrics.total_reported += amount
                    metrics.last_report_time = datetime.now().isoformat()
                    metrics.report_history.append({
                        "timestamp": metrics.last_report_time,
                        "amount": amount,
                        "device": "admin_force",
                        "producer": PRODUCER_ADDRESS
                    })
                    metrics.accumulated_energy = 0
                    print(f"[admin] Forced energy report: {amount} kWh")
                    return jsonify({
                        "success": True,
                        "message": f"Forced report of {amount} kWh",
                        "metrics": metrics.to_dict()
                    }), 200
                else:
                    return jsonify({"error": "Failed to report energy"}), 500
            except Exception as e:
                return jsonify({"error": f"Report failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ============================================================================
# GRID STATUS MANAGEMENT (NEW)
# ============================================================================

grid_status = {
    "voltage": 230.0,
    "current": 0.0,
    "power": 0.0,
    "frequency": 50.0,
    "last_update": None,
    "events": []
}
grid_lock = threading.Lock()

@app.route('/api/grid/status', methods=['GET', 'POST'])
def handle_grid_status():
    """
    GET: Retrieve current grid status (Voltage, Frequency, Power)
    POST: Update grid status from Modelica Bridge
    """
    global grid_status
    
    if request.method == 'POST':
        try:
            data = request.json
            with grid_lock:
                grid_status["voltage"] = float(data.get("voltage", 230.0))
                grid_status["current"] = float(data.get("current", 0.0))
                grid_status["power"] = float(data.get("power", 0.0))
                grid_status["last_update"] = time.time()
                
                # Check for Grid Instability (Brownout)
                # Threshold: < 210V (approx 10% drop from 230V)
                if grid_status["voltage"] < 210.0:
                    event_msg = f"BROWNOUT DETECTED! Voltage dipped to {grid_status['voltage']:.1f}V"
                    print(f"\n[GRID ALERT] {event_msg}")
                    
                    # Log event
                    event = {
                        "type": "BROWNOUT", 
                        "voltage": grid_status["voltage"],
                        "timestamp": datetime.now().isoformat()
                    }
                    grid_status["events"].insert(0, event)
                    if len(grid_status["events"]) > 50: grid_status["events"].pop()
                    
                    # --- TRIGGER HIGH PRIORITY BLOCKCHAIN ACTION ---
                    # We report this event to the blockchain immediately
                    # Reuse reporting mechanism but with a custom flag or immediate trigger
                    if oracle:
                        # For now, we simulate a "Grid Stabilization" credit or simply log it.
                        # Ideally, this would call a specific `reportGridOutage()` on the smart contract.
                        # We will send a 0-value transaction or small value to record the timestamp on-chain 
                        # if the contract supports generic data, but here we will just force a report 
                        # of any pending energy to 'save' it before outage, or log it.
                        
                        # Let's implementation the user request: "Trigger a high-priority transaction"
                        # We'll mint a small "Emergency Response" token amount or just log.
                        # Since we can't easily change Solidity, we will use the existing report function 
                        # but perhaps with a specific signal value or just ensure pending energy is flushed.
                        
                        if metrics.accumulated_energy > 0:
                            print(f"[GRID ALERT] Flushing {metrics.accumulated_energy:.2f} kWh to blockchain due to risk.")
                            oracle.report_energy(PRODUCER_ADDRESS, metrics.accumulated_energy)
                            metrics.accumulated_energy = 0
                        else:
                            # If no energy, maybe send a 0.01 'Ping' to show activity during outage
                             pass
                            
            return jsonify({"status": "updated", "voltage": grid_status["voltage"]}), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 400
            
    else: # GET
        return jsonify(grid_status), 200

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({"error": "Internal server error"}), 500


# ============================================================================
# MAIN
# ============================================================================

def simulator_loop():
    """Background simulator that generates random energy readings."""
    print(f"✓ Simulator started: interval={SIM_INTERVAL}s, range={SIM_MIN_KWH}-{SIM_MAX_KWH} kWh")
    while True:
        try:
            kwh = round(random.uniform(SIM_MIN_KWH, SIM_MAX_KWH), 2)
            result = process_reading(kwh, device_id='simulator')
            # Optional: print a short log for visibility
            print(f"[simulator] generated {kwh} kWh, accumulated={result.get('accumulated')}, auto_reported={result.get('auto_reported')}")
        except Exception as e:
            print(f"Simulator error: {e}")
            print(f"Simulator error: {e}")
        time.sleep(SIM_INTERVAL)

def grid_simulation_loop():
    """Background simulator that fluctuates grid voltage."""
    global modelica_bridge
    print(f"✓ Grid Simulator started")
    
    # Try to initialize Modelica if available
    if OMPYTHON_AVAILABLE:
        try:
            modelica_bridge = ModelicaBridge()
        except Exception as e:
            print(f"⚠ Modelica Connection Failed: {e}. Using fallback.")
            modelica_bridge = None
            
    sim_time = 0.0
    
    while True:
        try:
            with grid_lock:
                if modelica_bridge:
                    # -- REAL MODELICA SIMULATION --
                    try:
                        v, p = modelica_bridge.simulate_step(sim_time)
                        grid_status["voltage"] = round(v, 2)
                        grid_status["power"] = round(p, 2)
                        # Derive frequency noise from voltage stability for effect
                        grid_status["frequency"] = 50.0 + random.uniform(-0.05, 0.05) 
                        sim_time += 0.1
                    except Exception as omc_e:
                        print(f"Modelica Error: {omc_e}")
                        # Fallback for just this step
                        grid_status["voltage"] = 230.0
                else:
                    # -- FALLBACK RANDOM SIMULATION --
                    # Fluctuate around 230V
                    base = 230.0
                    noise = random.uniform(-1.5, 1.5)
                    
                    # Rare random dip (brownout sim)
                    if random.random() < 0.05: # 5% chance
                        noise = random.uniform(-25.0, -10.0)
                    
                    new_voltage = base + noise
                    grid_status["voltage"] = round(new_voltage, 2)
                    grid_status["frequency"] = round(50.0 + random.uniform(-0.1, 0.1), 3)

                grid_status["last_update"] = time.time()
                
                # Check for Brownout logic reuse
                if grid_status["voltage"] < 210.0:
                     # Log event simpler here
                    event = {
                        "type": "BROWNOUT", 
                        "voltage": grid_status["voltage"],
                        "timestamp": datetime.now().isoformat()
                    }
                    if not grid_status["events"] or (datetime.now() - datetime.fromisoformat(grid_status["events"][0]["timestamp"])).seconds > 10:
                        grid_status["events"].insert(0, event)
                        if len(grid_status["events"]) > 50: grid_status["events"].pop()
                        print(f"[GRID SIM] Brownout dip to {grid_status['voltage']}V")

        except Exception as e:
            print(f"Grid Sim error: {e}")
        time.sleep(1.0) # Update every second (could be faster for Modelica)

if __name__ == '__main__':
    print("\n" + "="*60)
    print("JOULET ENERGY API BRIDGE")
    print("="*60 + "\n")
    print("✓ Starting fresh — all metrics initialized to defaults\n")
    
    # Initialize oracle
    if initialize_oracle():
        print(f"✓ Starting API server on {API_HOST}:{API_PORT}")
        print("\nAvailable endpoints:")
        print("  GET  /                    - Health check")
        print("  GET  /api/status          - System status")
        print("  POST /api/energy/reading  - Add energy reading")
        print("  POST /api/energy/report   - Report energy to blockchain")
        print("  GET  /api/energy/metrics  - Get metrics")
        print("  GET  /api/energy/history  - Get report history")
        print("  POST /api/energy/reset    - Reset metrics")
        print("  GET  /api/config          - Get configuration")
        print("  POST /api/test/simulate   - Simulate reading\n")
        
        # Run Flask app
        # Start simulator thread if enabled
        if ENABLE_SIMULATOR:
            sim_thread = threading.Thread(target=simulator_loop, daemon=True)
            sim_thread.start()

        # Start grid simulator thread
        if ENABLE_GRID_SIM:
            grid_thread = threading.Thread(target=grid_simulation_loop, daemon=True)
            grid_thread.start()

        app.run(host=API_HOST, port=API_PORT, debug=False)
    else:
        print("✗ Failed to initialize oracle. Check your configuration.")
        exit(1)
