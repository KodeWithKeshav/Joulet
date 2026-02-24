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
    """Fallback if OMPython is missing"""
    import math
    import random
    
    print("Starting Mock Simulation Loop (RMS Voltage Mode)...")
    while True:
        # Simulate RMS Voltage (not instantaneous)
        base_v = 230.0 
        
        # Add normal fluctuation
        noise = random.normalvariate(0, 2) # +/- few volts
        
        # Add a brownout event occasionally (10% chance)
        if random.random() < 0.1:
            print("SIMULATING BROWNOUT...")
            base_v = 200.0 # Drop below 210
            
        v_rms = base_v + noise
        
        # Power P = V*I (assuming resistive load for simplicity impact)
        # Load resistance fluctuates
        r = 50 + 10 * math.sin(time.time()/5)
        i_rms = v_rms / r
        p_real = v_rms * i_rms
        
        # Calculate Energy (kWh)
        # Power (W) * Time (h) / 1000 = kWh
        # We step every 1.0s
        # DEMO SCALING: 1 Real Sec = 1 Sim Hour (x3600 speedup)
        step_hours = 1.0 
        kwh_generated = (p_real / 1000.0) * step_hours
        
        # 1. Send Status for Visualization
        status_payload = {
            "voltage": round(v_rms, 2),
            "current": round(i_rms, 2),
            "power": round(p_real, 2),
            "timestamp": time.time(),
            "is_mock": True
        }
        
        # 2. Send Energy for Minting (Production)
        energy_payload = {
            "kwh": kwh_generated,
            "device_id": "modelica_sim_1",
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        try:
            # Send Status
            requests.post(API_URL, json=status_payload, timeout=0.5)
            
            # Send Production
            # We use the existing endpoint in api_bridge.py
            requests.post("http://localhost:5001/api/energy/reading", json=energy_payload, timeout=0.5)
            
            print(f"[Mock] Sent: {v_rms:.1f}V | {p_real:.1f}W | +{kwh_generated:.6f} kWh")
        except Exception as e:
             print(f"Connection Error: {e}")
             
        time.sleep(1.0) # Update every second

if __name__ == "__main__":
    run_bridge()
