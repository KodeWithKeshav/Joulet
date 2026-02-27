#!/usr/bin/env python3
"""
Grid Bridge - Connects Modelica Simulation to API Bridge
Runs the OpenModelica simulation and pushes live data to the API.
"""
import sys
import time
import requests
import numpy as np
import os
import datetime

# Helper to check if running in a "fake" mode if OMPython is missing
try:
    from OMPython import OMCSessionZMQ
    OM_AVAILABLE = True
except ImportError:
    OM_AVAILABLE = False
    print("Warning: OMPython not found. Please install OpenModelica and OMPython.")
    print("Running in Mock Mode for demonstration purposes if OMPython is absent logic isn't strictly enforced yet.")

# Configuration
API_URL = "http://localhost:5001/api/grid/status"
MODEL_FILE = "GridSystem.mo"
MODEL_NAME = "GridSystem"

def run_bridge():
    if not OM_AVAILABLE:
        print("Error: OMPython is required. Install it via 'pip install OMPython' and ensure OpenModelica is in PATH.")
        print("Entering MOCK MODE to simulate functionality without OMPython...")
        mock_loop()
        return

    print(f"Initializing OpenModelica Session for {MODEL_NAME}...")
    try:
        omc = OMCSessionZMQ()
    except Exception as e:
        print(f"OpenModelica Init Error: {e}")
        print("Could not find OpenModelica binary. Falling back to MOCK MODE.")
        mock_loop()
        return
    
    # Load Model
    path = os.path.abspath(MODEL_FILE)
    if not omc.sendExpression(f'loadFile("{path}")'):
        print(f"Failed to load {path}")
        return

    print("Model loaded. Starting simulation loop...")
    
    # We will simulate in small steps
    step_size = 0.1
    current_time = 0.0
    
    # Initialize simulation
    omc.sendExpression(f"instantiateModel({MODEL_NAME})")
    
    # Note: Truly "interactive" stepping in OMPython can be complex depending on the version.
    # Standard approach: buildModel -> ./GridSystem -override ...
    # Or use the interactive API.
    # For robust "Real-time" loop with OMPython, we often use `simulate(..., stopTime=...)` repeatedly or `step()`.
    # To keep it simple and robust for this script, we will run short simulations and read the final value.
    
    # Better Approach for a "Bridge": 
    # Use the generated executable with the -port flag or just re-run for next step (slow but easy) 
    # OR use the 'step' functionality if available.
    # Given OMPython variations, we'll try a repeated simulation strategy which is safer for a script.
    
    while True:
        try:
            # Simulate a small window. 
            # Note: Re-simulating from 0 every time is slow. 
            # We'll use start time = current, stop = current + step.
            # State persistence is tricky without Linearization or specialized flags.
            # A simpler "Mock" of the modelica bridge for the sake of the Python script:
            # We will just ask OMPython to evaluate the variables at a specific time if possible, 
            # but usually we run the binary.
            
            # Let's assume we run the simulation for a small step.
            cmd = f"simulate({MODEL_NAME}, startTime={current_time}, stopTime={current_time+step_size}, numberOfIntervals=1, method='dassl', resultFile='grid_res')"
            res = omc.sendExpression(cmd)
            
            if "error" in str(res).lower():
                print("Simulation Error:", res)
                time.sleep(1)
                continue

            # distinct variables to read
            # powerSensor.p, powerSensor.v, powerSensor.i
            # The result file will have them.
            # OMPython helper to read result:
            val_v = omc.sendExpression("val(powerSensor.v, " + str(current_time+step_size) + ")")
            val_i = omc.sendExpression("val(powerSensor.i, " + str(current_time+step_size) + ")")
            val_p = omc.sendExpression("val(powerSensor.p, " + str(current_time+step_size) + ")")
            
            # Send to API
            payload = {
                "voltage": float(val_v),
                "current": float(val_i),
                "power": float(val_p),
                "timestamp": time.time()
            }
            
            try:
                r = requests.post(API_URL, json=payload, timeout=0.5)
                # verify status
                if r.status_code != 200:
                    print(f"API Error: {r.status_code}")
                else:
                     print(f"Sent: {payload['voltage']:.1f}V, {payload['power']:.1f}W")
            except Exception as e:
                print(f"Connection Error: {e}")

            current_time += step_size
            time.sleep(step_size) # Real-time wait
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print("Loop Error:", e)
            time.sleep(1)

def mock_loop():
    """Fallback physics-based RLC circuit simulation when OMPython is missing.
    Uses same parameters as GridSystem.mo for consistency."""
    import math
    import random
    
    print("Starting RLC Circuit Physics Simulation (no OpenModelica)...")
    
    # Circuit parameters matching GridSystem.mo
    V_SOURCE_PEAK = 325.27   # 230V RMS = 325.27V peak (matches gridSource.V)
    BASE_FREQ = 50.0         # Hz (matches gridSource.freqHz)
    L_GRID = 0.01            # Grid inductance (H)
    C_GRID = 0.001          # Grid capacitance (F) — tuned so X_L ≈ X_C at 50Hz
    R_BASE = 50.0            # Base load resistance (matches loadProfile.offset)
    R_AMP = 50.0             # Load amplitude (matches loadProfile.amplitude)
    
    sim_hour = 0.0  # Simulated hour counter
    
    while True:
        # Trapezoidal load profile (matching GridSystem.mo Trapezoid block)
        # Rising 6am-7am, plateau 7am-5pm, falling 5pm-6pm
        hour_of_day = sim_hour % 24
        if 6 <= hour_of_day < 7:
            load_factor = (hour_of_day - 6)  # Ramp 0→1
        elif 7 <= hour_of_day < 17:
            load_factor = 1.0  # Full load plateau
        elif 17 <= hour_of_day < 18:
            load_factor = (18 - hour_of_day)  # Ramp 1→0
        else:
            load_factor = 0.2  # Nighttime base
        
        # Dynamic resistance (lower R = heavier load = more current draw)
        R_load = R_BASE + R_AMP * (1.0 - load_factor)
        R_load = max(10.0, R_load)
        
        # Angular frequency
        omega = 2 * math.pi * BASE_FREQ
        
        # RLC impedance: Z = sqrt(R² + (ωL - 1/(ωC))²)
        X_L = omega * L_GRID
        X_C = 1.0 / (omega * C_GRID)
        Z = math.sqrt(R_load**2 + (X_L - X_C)**2)
        
        # V_load_rms = (R/Z) * V_source_rms  (voltage divider)
        V_source_rms = V_SOURCE_PEAK / math.sqrt(2)
        V_load_rms = (R_load / Z) * V_source_rms
        
        # Add Gaussian grid noise (σ = 2V, matching GridSystem.mo NormalNoise sigma=20 scaled to RMS)
        noise = random.gauss(0, 2.0)
        V_load_rms += noise
        
        # Rare brownout event (~5% chance): sudden load surge
        if random.random() < 0.05:
            print("[RLC] SIMULATING BROWNOUT: Load Surge...")
            surge_R = 3.0  # Very low resistance = massive current draw
            surge_Z = math.sqrt(surge_R**2 + (X_L - X_C)**2)
            V_load_rms = (surge_R / surge_Z) * V_source_rms
            V_load_rms += random.gauss(0, 3.0)
        
        # Current: I = V / R
        i_rms = V_load_rms / R_load
        
        # Real power with power factor: P = V * I * cos(φ), cos(φ) = R/Z
        power_factor = R_load / Z
        p_real = V_load_rms * i_rms * power_factor
        
        # Energy: 1 real second = 1 sim hour demo speedup
        step_hours = 1.0
        kwh_generated = (p_real / 1000.0) * step_hours
        
        # Frequency droop from loading
        freq_droop = -0.1 * max(0, (1 - V_load_rms / 230.0)) * 10
        grid_freq = BASE_FREQ + freq_droop + random.gauss(0, 0.02)
        
        # 1. Send Status for Visualization
        status_payload = {
            "voltage": round(V_load_rms, 2),
            "current": round(i_rms, 2),
            "power": round(p_real, 2),
            "frequency": round(grid_freq, 3),
            "timestamp": time.time(),
            "model": "RLC_physics"
        }
        
        # 2. Send Energy for Minting (Production)
        energy_payload = {
            "kwh": kwh_generated,
            "device_id": "rlc_grid_sim",
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        try:
            # Send Status
            requests.post(API_URL, json=status_payload, timeout=0.5)
            
            # Send Production
            requests.post("http://localhost:5001/api/energy/reading", json=energy_payload, timeout=0.5)
            
            print(f"[RLC] {V_load_rms:.1f}V | {i_rms:.2f}A | {p_real:.0f}W | {grid_freq:.2f}Hz | +{kwh_generated:.4f}kWh")
        except Exception as e:
             print(f"Connection Error: {e}")
        
        sim_hour += 1.0  # Each second = 1 simulated hour
        time.sleep(1.0)

if __name__ == "__main__":
    run_bridge()
