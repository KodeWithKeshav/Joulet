#!/usr/bin/env python3
"""
Phase 4: Consensus Engine + Adaptive Difficulty
- Receives votes from the 3 Oracle Nodes.
- Aggregates votes based on Reputation-Weighted Consensus.
- Generates a Merkle Tree for batches of valid readings.
- Dynamically adjusts reporting difficulty to control transaction rate.
- Interacts with the Joulet Smart Contract.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
from eth_account.messages import encode_defunct
import json
import os
import threading
from datetime import datetime
import time
import hashlib
from collections import deque
from dotenv import load_dotenv

# We can reuse the SolarOracle bridge for contract abstraction or just use web3 directly
from solar_oracle import SolarOracle

load_dotenv()

app = Flask(__name__)
CORS(app)

# ============================================================================
# CONFIGURATION
# ============================================================================

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
PRODUCER_ADDRESS = os.getenv("PRODUCER_ADDRESS", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

PORT = 5010
INTERNAL_API_KEY = os.getenv('INTERNAL_API_KEY', 'joulet_internal_secret_key')

# Dynamic difficulty parameters
DIFF_TARGET_INTERVAL = 15.0 # seconds desired between contract submissions
difficulty_threshold = 5.0  # start at 5 kWh
difficulty_history = []
last_submission_time = time.time()

# Oracle Reputation Metrics
# Start at 1.0. Correct block vote = +0.01. Incorrect vote (against majority) = -0.05
# Dict builds dynamically as authorized nodes connect.
oracle_reputation = {}

# Buffer for incoming votes keyed by data payload signature (unique hash of the reading)
# format: { "signature1": { "valid_votes": {"oracle_1": weight}, "invalid_votes": {...}, "payload": {...} } }
pending_votes = {}
pending_lock = threading.Lock()

# Currently accumulated valid valid energy waiting to meet the difficulty threshold
batch_accumulated_kwh = 0.0
batch_readings = []
total_energy_reported = 0.0  # Track total energy reported to blockchain
total_batch_count = 0        # Track number of successful batch submissions

oracle = None

# ============================================================================
# MERKLE TREE UTILITIES
# ============================================================================

def hash_leaf(data_dict):
    """Hash a single reading for the merkle tree"""
    # Deterministic JSON
    data_str = json.dumps(data_dict, sort_keys=True)
    return hashlib.sha256(data_str.encode()).hexdigest()

def compute_merkle_root(leaves):
    """Compute the Merkle Root of a list of leaves"""
    if not leaves:
        return "0x"+"0"*64
        
    current_level = sorted(leaves) # sort for determinism
    
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i+1] if i+1 < len(current_level) else left
            combined = left + right
            next_level.append(hashlib.sha256(combined.encode()).hexdigest())
        current_level = next_level
        
    return "0x" + current_level[0]

# ============================================================================
# ORACLE & BLOCKCHAIN LOGIC
# ============================================================================

def initialize_oracle():
    global oracle
    try:
        oracle = SolarOracle(rpc_url=RPC_URL, contract_address=CONTRACT_ADDRESS, oracle_private_key=ORACLE_PRIVATE_KEY)
        print("✓ Consensus connected to Blockchain")
        return True
    except Exception as e:
        print(f"✗ Failed blockchain connection: {e}")
        return False

def adjust_difficulty():
    """Adaptive Difficulty Engine Core"""
    global difficulty_threshold, last_submission_time, difficulty_history
    
    now = time.time()
    time_delta = now - last_submission_time
    
    old_diff = difficulty_threshold
    
    if time_delta < DIFF_TARGET_INTERVAL:
         # Submitting batches too fast -> raise the threshold
         difficulty_threshold = min(100.0, difficulty_threshold * 1.2)
         print(f"[DDA] 🔥 Fast submissions ({time_delta:.1f}s). Threshold UP: {old_diff:.2f} -> {difficulty_threshold:.2f} kWh")
    elif time_delta > DIFF_TARGET_INTERVAL * 2:
         # Too slow -> lower it
         difficulty_threshold = max(0.5, difficulty_threshold * 0.8)
         print(f"[DDA] 🐢 Slow submissions ({time_delta:.1f}s). Threshold DOWN: {old_diff:.2f} -> {difficulty_threshold:.2f} kWh")
         
    difficulty_history.append(difficulty_threshold)
    if len(difficulty_history) > 50:
        difficulty_history.pop(0)

def submit_batch_to_blockchain():
    """Builds the Merkle tree and sends the transaction"""
    global batch_accumulated_kwh, batch_readings, last_submission_time
    global total_energy_reported, total_batch_count
    
    if batch_accumulated_kwh <= 0 or not oracle:
         return
         
    print(f"\n[CONSENSUS] Threshold met ({batch_accumulated_kwh:.2f} >= {difficulty_threshold:.2f}). Processing Batch...")
    
    # Generate Merkle Leaves
    leaves = [hash_leaf(r['payload']) for r in batch_readings]
    root = compute_merkle_root(leaves)
    
    print(f"[CONSENSUS] -> Batch Readings: {len(batch_readings)}")
    print(f"[CONSENSUS] -> Merkle Root: {root}")
    
    try:
        success = oracle.report_energy(PRODUCER_ADDRESS, batch_accumulated_kwh, merkle_root=root)
        if success:
             print(f"[CONSENSUS] ✓ SUCCESS: {batch_accumulated_kwh:.2f} kWh recorded on chain.")
             # Track real totals for the status API
             total_energy_reported += batch_accumulated_kwh
             total_batch_count += 1
             # Reset batch
             batch_accumulated_kwh = 0.0
             batch_readings = []
             adjust_difficulty()
             last_submission_time = time.time()
        else:
             print("[CONSENSUS] ✗ Transaction failed.")
    except Exception as e:
         print(f"[CONSENSUS] ✗ Error submitting to blockchain: {e}")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/consensus/vote', methods=['POST'])
def receive_vote():
    """
    Receives validation votes from the 3 Oracle Nodes.
    """
    data = request.json
    node_id = data.get('node_id')
    approval = data.get('approval') # "VALID" or "INVALID"
    payload = data.get('original_payload')
    
    if request.headers.get("X-Internal-Key") != INTERNAL_API_KEY:
        return jsonify({"error": "Unauthorized"}), 401

    if not node_id or not payload:
        return jsonify({"error": "Bad requests"}), 400
        
    # We use a primitive string hash as a quick message ID for tracking identical events
    # from the 3 different nodes.
    sig_id = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    
    with pending_lock:
        if sig_id not in pending_votes:
            pending_votes[sig_id] = {
                "VALID": {}, 
                "INVALID": {}, 
                "payload": payload,
                "processed": False
            }
            
        vote_dict = pending_votes[sig_id]
        
        if vote_dict["processed"]:
             return jsonify({"status": "Already processed"}), 200
             
        # Record the vote weight based on node reputation
        if node_id not in oracle_reputation:
            oracle_reputation[node_id] = 1.0
        weight = max(0.01, oracle_reputation.get(node_id, 1.0))
        vote_dict[approval][node_id] = weight
        
        # Check if we have gathered votes from at least 3 nodes (or wait standard timeout)
        total_votes_received = len(vote_dict["VALID"]) + len(vote_dict["INVALID"])
        
        if total_votes_received >= 3:
             # Consensus Time!
             vote_dict["processed"] = True
             
             valid_weight = sum(vote_dict["VALID"].values())
             invalid_weight = sum(vote_dict["INVALID"].values())
             total_weight = valid_weight + invalid_weight
             
             is_accepted = False
             
             if total_weight > 0 and (valid_weight / total_weight) >= 0.66:
                  # Consensus Reached: Accept Reading
                  is_accepted = True
                  
                  power = float(payload.get('Power_kW', 0))
                  global batch_accumulated_kwh
                  batch_accumulated_kwh += power
                  batch_readings.append({"payload": payload, "sig_id": sig_id})
                  
                  print(f"⚖️ Consensus REACHED: VALID ({valid_weight:.2f} vs {invalid_weight:.2f}) -> {power}kW added.")
                  
                  # Distribute Reputation Rewards
                  for nid in vote_dict["VALID"]:
                       oracle_reputation[nid] = min(1.0, oracle_reputation[nid] + 0.02)
                  for nid in vote_dict["INVALID"]:
                       oracle_reputation[nid] = max(0.1, oracle_reputation[nid] - 0.1) # Harsh penalty for disagreeing with majority
             else:
                  # Consensus Reached: Reject Reading
                  print(f"🚨 Consensus REACHED: REJECTED ({valid_weight:.2f} vs {invalid_weight:.2f})")
                  
                  # Reward nodes that rejected bad data
                  for nid in vote_dict["INVALID"]:
                       oracle_reputation[nid] = min(1.0, oracle_reputation[nid] + 0.05)
                  for nid in vote_dict["VALID"]:
                       oracle_reputation[nid] = max(0.1, oracle_reputation[nid] - 0.15)
                       
             # Try to submit to blockchain if threshold crossed
             if batch_accumulated_kwh >= difficulty_threshold:
                  submit_batch_to_blockchain()
                  
                  
    return jsonify({"status": "vote locked"}), 200


@app.route('/api/consensus/status', methods=['GET'])
def get_status():
    """Returns engine metrics for Dashboard UI updates"""
    
    metrics = {
        "current_production": batch_accumulated_kwh,
        "accumulated_energy": batch_accumulated_kwh,
        "total_reported": total_energy_reported,
        "reporting_threshold": difficulty_threshold,
        "reports_count": total_batch_count
    }
    
    return jsonify({
        "status": "ok",
        "oracle": {
             "connected": oracle is not None,
             "address": CONTRACT_ADDRESS,
             "reputations": oracle_reputation
        },
        "metrics": metrics,
        "difficulty_history": difficulty_history,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    print("\n" + "="*60)
    print("JOULET CONSENSUS & DIFFICULTY ENGINE")
    print("="*60 + "\n")
    
    if initialize_oracle():
        app.run(host='0.0.0.0', port=PORT, debug=False)
    else:
        print("✗ Failed to load blockchain bridge.")
