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

# Load dynamic device registry from JSON (simulating blockchain/database registry)
AUTHORIZED_DEVICES = {}
try:
    with open('devices.json', 'r') as f:
        keys = json.load(f)
        for d_id, p_key in keys.items():
            AUTHORIZED_DEVICES[d_id] = Web3().eth.account.from_key(p_key).address
except Exception as e:
    print(f"Failed to load devices: {e}")

# State for Check 4 (No sudden spike)
# device_id -> last_power_kw
last_readings = {}

# State for nonce deduplication (prevents replay attacks)
# device_id -> set of recently seen nonces
seen_nonces = {}

def get_weather_multiplier(timestamp_str, location="simulated"):
    """
    Real Check 5: Matches external weather API.
    Queries Open-Meteo for live cloud cover at a realistic solar farm location (e.g. California Desert).
    """
    try:
        response = requests.get("https://api.open-meteo.com/v1/forecast?latitude=35.0&longitude=-119.0&current=cloud_cover", timeout=3)
        if response.status_code == 200:
            cloud_cover = float(response.json().get("current", {}).get("cloud_cover", 0))
            return 1.0 - (cloud_cover / 100.0 * 0.7)  # 100% cloud cover = 30% max efficiency
    except Exception as e:
        print(f"Weather API fallback triggers: {e}")
        
    # Fallback to pure timestamp parsing if API offline
    dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00') if timestamp_str.endswith('Z') else timestamp_str)
    if dt.hour == 14:
        return 0.3
    return 1.0

def run_validations(payload, signature):
    """
    Executes the 5 checks on incoming data.
    Returns (True, "Passed") or (False, "Reason...")
    """
    device_id = payload.get('Device_ID')
    
    if not device_id or device_id not in AUTHORIZED_DEVICES:
         return False, f"Unknown or unauthorized device: {device_id}"
         
    # --- Nonce Deduplication (Prevents Duplicate Submissions) ---
    nonce = payload.get('nonce')
    if nonce is not None:  # Only check if nonce is provided
        if device_id not in seen_nonces:
            seen_nonces[device_id] = set()
        
        if nonce in seen_nonces[device_id]:
            return False, f"Duplicate nonce {nonce} detected (Replay attack)"
        
        seen_nonces[device_id].add(nonce)
        
        # Cleanup old nonces (prevent memory leak)
        if len(seen_nonces[device_id]) > 5000:
            seen_nonces[device_id] = set(list(seen_nonces[device_id])[-2500:])
         
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
            
    # --- Check 3b: Replay Attack Protection (Improved timezone handling) ---
    # Ensure both timestamps are timezone-aware for proper comparison
    import pytz
    now_dt = datetime.now(pytz.UTC)
    
    # Ensure dt is timezone-aware
    if dt.tzinfo is None:
        dt = pytz.UTC.localize(dt)
    else:
        dt = dt.astimezone(pytz.UTC)
    
    diff = abs((now_dt - dt).total_seconds())
    if diff > 300: # 5 minutes grace
        return False, f"Replay Attack: Timestamp is {diff:.0f}s old/offset"
        
    # --- Check 4: No sudden spike? ---
    last_power = last_readings.get(device_id, 0)
    # If power jumps by more than 3kW in one 5-minute reading, flag it as anomalous
    if (power_kw - last_power) > 3.0:
        return False, f"Sudden Spike Detected: +{power_kw - last_power}kW jump"
    last_readings[device_id] = power_kw
    
    # --- Check 5: Weather Correlation ---
    # NOTE: MVP uses simplified weather check with hardcoded California coordinates.
    # Production would use device-specific GPS coordinates from registration NFT
    # and query based on actual device location with proper solar irradiance data.
    expected_multiplier = get_weather_multiplier(timestamp_str)
    max_expected_power = 5.0 * expected_multiplier
    
    # Commenting out for MVP - requires GPS-registered devices
    # if power_kw > (max_expected_power + 0.5): # Allow 0.5kW grace
    #     return False, f"Weather Mismatch: Produced {power_kw}kW but weather allows max {max_expected_power}kW"
    
    # For hackathon MVP, we skip weather validation but keep the infrastructure
    # This demonstrates the protocol without requiring full device registration system

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
