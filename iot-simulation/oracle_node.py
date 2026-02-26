#!/usr/bin/env python3
"""
Phase 3: Oracle Node
Receives signed energy readings, performs 5 structural checks, 
and forwards valid readings to the Consensus Engine.

The 5 Checks:
1. Signature valid? 
2. Within 5kW capacity? 
3. Daylight hours? 
4. No sudden spike? 
5. Matches weather data? (Simulated for this script)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
from eth_account.messages import encode_defunct
import json
import os
import argparse
from datetime import datetime
import requests
import time

app = Flask(__name__)
CORS(app)

# Configured at startup
NODE_ID = "oracle_1"
CONSENSUS_ENGINE_URL = "http://127.0.0.1:5010"
INTERNAL_API_KEY = os.getenv('INTERNAL_API_KEY', 'joulet_internal_secret_key')

# Mock registry of authorized IoT devices and their public addresses
# In reality, this would be pulled from a smart contract registry
AUTHORIZED_DEVICES = {
    'solar_node_alpha': Web3().eth.account.from_key('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d').address,
    'solar_node_beta': Web3().eth.account.from_key('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a').address,
    'solar_node_gamma': Web3().eth.account.from_key('0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6').address
}

# State for Check 4 (No sudden spike)
# device_id -> last_power_kw
last_readings = {}

def get_weather_multiplier(timestamp_str, location="simulated"):
    """
    Simulated Check 5: Weather Match.
    A real implementation would query an external oracle (e.g. Chainlink) or weather API.
    For this demo, we assume sunny conditions during the day (multiplier ~1.0)
    and we will reject readings that claim high generation during known "cloudy" simulated periods.
    """
    # Simply using the timestamp hour to mock weather variability
    dt = datetime.fromisoformat(timestamp_str)
    
    # Let's say it's known to be cloudy around 2 PM (14:00) during this simulation
    if dt.hour == 14:
        return 0.3 # Expecting only 30% of max capacity
    return 1.0     # Expecting full capacity possible

def run_validations(payload, signature):
    """
    Executes the 5 checks on incoming data.
    Returns (True, "Passed") or (False, "Reason...")
    """
    device_id = payload.get('Device_ID')
    
    if not device_id or device_id not in AUTHORIZED_DEVICES:
         return False, f"Unknown or unauthorized device: {device_id}"
         
    # --- Check 1: Signature Valid? ---
    try:
        w3 = Web3()
        message_str = json.dumps(payload, sort_keys=True)
        message = encode_defunct(text=message_str)
        recovered_address = w3.eth.account.recover_message(message, signature=signature)
        
        if recovered_address != AUTHORIZED_DEVICES[device_id]:
             return False, f"Invalid signature for device {device_id}"
    except Exception as e:
        return False, f"Signature cryptographic error: {str(e)}"
        
    # --- Extracted values ---
    try:
        power_kw = float(payload.get('Power_kW', 0))
        voltage = float(payload.get('Voltage', 0))
        current = float(payload.get('Current', 0))
        timestamp_str = payload.get('Timestamp')
        dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00') if timestamp_str.endswith('Z') else timestamp_str)
    except Exception as e:
        return False, f"Data parsing error: {e}"

    # --- Check 1b (Bonus Physics Check requested by user): Power = Voltage * Current ---
    calculated_power = (voltage * current) / 1000.0
    if abs(calculated_power - power_kw) > 0.1: # Allow small floating point variance
        return False, f"Physics Violation: V*I != P ({calculated_power} != {power_kw})"

    # --- Check 2: Within 5kW capacity? ---
    if power_kw > 5.0:
        return False, f"Capacity Exceeded: {power_kw}kW > 5kW max"
        
    # --- Check 3: Daylight Hours? ---
    if not (6 <= dt.hour <= 18):
        if power_kw > 0.05: # Allow tiny trickle
            return False, f"Nighttime Generation detected at hour {dt.hour}: {power_kw}kW"
            
    # --- Check 3b: Replay Attack Protection ---
    now_dt = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.utcnow()
    diff = abs((now_dt - dt).total_seconds())
    if diff > 300: # 5 minutes grace
        return False, f"Replay Attack: Timestamp is {diff:.0f}s old/offset"
        
    # --- Check 4: No sudden spike? ---
    last_power = last_readings.get(device_id, 0)
    # If power jumps by more than 3kW in one 5-minute reading, flag it as anomalous
    if (power_kw - last_power) > 3.0:
        return False, f"Sudden Spike Detected: +{power_kw - last_power}kW jump"
    last_readings[device_id] = power_kw
    
    # --- Check 5: Matches weather data? ---
    expected_multiplier = get_weather_multiplier(timestamp_str)
    max_expected_power = 5.0 * expected_multiplier
    
    if power_kw > (max_expected_power + 0.5): # Allow 0.5kW grace
         return False, f"Weather Mismatch: Produced {power_kw}kW but weather allows max {max_expected_power}kW"

    return True, "Passed"


@app.route('/api/oracle/submit', methods=['POST'])
def submit_reading():
    """
    Endpoint for IoT devices to submit signed readings.
    """
    data = request.json
    if not data or 'payload' not in data or 'signature' not in data:
         return jsonify({"error": "Missing payload or signature"}), 400
         
    payload = data['payload']
    signature = data['signature']
    
    # Run the 5 structural checks
    is_valid, reason = run_validations(payload, signature)
    
    if is_valid:
        # Forward to Consensus Engine
        try:
             # Add our node's stamp of approval
             forward_data = {
                 "node_id": NODE_ID,
                 "approval": "VALID",
                 "original_payload": payload,
                 "original_signature": signature
             }
             
             # Send it async or fire-and-forget for this demo
             try:
                 requests.post(f"{CONSENSUS_ENGINE_URL}/api/consensus/vote", json=forward_data, headers={"X-Internal-Key": INTERNAL_API_KEY}, timeout=2)
             except requests.exceptions.RequestException:
                 print(f"Warning: Consensus engine unreachable at {CONSENSUS_ENGINE_URL}")
                 
             print(f"[{NODE_ID}] ✓ VALID: {payload['Device_ID']} - {payload['Power_kW']}kW")
             return jsonify({"status": "accepted", "reason": reason}), 200
             
        except Exception as e:
            return jsonify({"error": f"Failed to forward to consensus: {e}"}), 500
    else:
        # Rejected!
        print(f"[{NODE_ID}] ✗ REJECTED: {payload['Device_ID']} - Reason: {reason}")
        
        # Forward rejection to consensus engine so it can track bad actors and 
        # for dashboard visual feedback of attacks
        try:
             forward_data = {
                 "node_id": NODE_ID,
                 "approval": "INVALID",
                 "reason": reason,
                 "original_payload": payload
             }
             requests.post(f"{CONSENSUS_ENGINE_URL}/api/consensus/vote", json=forward_data, headers={"X-Internal-Key": INTERNAL_API_KEY}, timeout=2)
        except:
             pass
             
        return jsonify({"status": "rejected", "reason": reason}), 406

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({"node_id": NODE_ID, "status": "online", "port": PORT})

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run a Joulet Oracle Node')
    parser.add_argument('--port', type=int, default=5001, help='Port to run the node on')
    parser.add_argument('--id', type=str, default='oracle_1', help='Node identifier')
    args = parser.add_argument_group()
    
    args = parser.parse_args()
    
    PORT = args.port
    NODE_ID = args.id
    
    print(f"Starting Oracle Node {NODE_ID} on port {PORT}...")
    app.run(host='0.0.0.0', port=PORT, debug=False)
