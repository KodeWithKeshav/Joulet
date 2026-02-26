#!/usr/bin/env python3
"""
Phase 6: ZK Physics Proof (CLI Mock)
Simulates generating a Zero-Knowledge Proof that energy readings
obey the rules of physics (Power = Voltage * Current) without
revealing the raw data itself.
"""

import hashlib
import time
import json
import argparse
from web3 import Web3
import os
from dotenv import load_dotenv

load_dotenv()

# We can reuse the SolarOracle bridge for contract abstraction or just use web3 directly
from solar_oracle import SolarOracle

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")

def simulate_zk_snark_generation(data_payload):
    """
    Mock the computational weight of generating a ZK-SNARK.
    """
    print("\n[ZK-Prover] Initializing Groth16 Prover Constraint System...")
    time.sleep(1)
    print(f"[ZK-Prover] Generating witness for Device: {data_payload.get('Device_ID')}")
    print(f"[ZK-Prover] Private Inputs loaded (Voltage={data_payload.get('Voltage')}, Current={data_payload.get('Current')})")
    
    # Physics Check inside the "circuit"
    v = float(data_payload.get('Voltage', 0))
    i = float(data_payload.get('Current', 0))
    p = float(data_payload.get('Power_kW', 0))
    
    calc_p = (v * i) / 1000.0
    is_valid = abs(calc_p - p) < 0.1
    
    print("[ZK-Prover] Compiling arithmetic circuit: (v * i) / 1000 == p")
    time.sleep(1.5)
    
    if not is_valid:
         print("❌ [ZK-Prover] Error: Witness does not satisfy circuit constraints (Physics Violation).")
         return False, None
         
    print("[ZK-Prover] Constraints satisfied. Generating Proof Π...")
    time.sleep(1)
    
    # Generate a fake structured proof
    proof = {
         "pi_a": ["0x21bb...", "0x89ee..."],
         "pi_b": [["0x44dd...", "0x98bb..."], ["0x11aa...", "0x00cc..."]],
         "pi_c": ["0x99aa...", "0x22ee..."],
         "protocol": "groth16",
         "curve": "bn128"
    }
    
    public_inputs = [str(p)] # The only thing revealed is the total power
    
    print("✅ [ZK-Prover] Proof Generation Complete.")
    return True, {"proof": proof, "public_inputs": public_inputs}

def verify_on_chain(oracle, proof_data):
    """
    Calls the view function verifyPhysicsProof on our deployed contract.
    """
    print("\n[Blockchain Verifier] Submitting proof array to JouletToken.sol...")
    time.sleep(0.5)
    
    # Convert mock proof to bytes
    mock_bytes = b"mock_zk_snark_proof_array_groth16"
    
    # Format public inputs for solidity
    pub_inputs = [int(float(proof_data["public_inputs"][0]) * 10)]
    
    try:
         # Explicit call to the contract view function
         is_valid = oracle.contract.functions.verifyPhysicsProof(
              mock_bytes, 
              pub_inputs
         ).call()
         
         print("==================================================")
         if is_valid:
             print(" 🔐 ON-CHAIN VERIFICATION RESULT: TRUE")
             print("    Zero-Knowledge Physics Proof Accepted.")
         else:
             print(" ❌ ON-CHAIN VERIFICATION RESULT: FALSE")
             print("    Zero-Knowledge Physics Proof Rejected.")
         print("==================================================")
         
    except Exception as e:
         print(f"Contract Call Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Simulate ZK-SNARK Physics Proof')
    parser.add_argument('--amount', type=float, default=3.5, help='Target Power in kW')
    parser.add_argument('--fraud', action='store_true', help='Simulate forged mathematics')
    
    args = parser.parse_args()
    
    test_reading = {
        "Device_ID": "solar_node_alpha",
        "Voltage": 230.5,
        "Current": 15.18, # 230.5 * 15.18 / 1000 = ~3.5 kW
        "Power_kW": args.amount
    }
    
    if args.fraud:
         test_reading["Power_kW"] = args.amount * 2.0 # Force a mismatch
         print("\n>>> INJECTING FRAUDULENT MATHEMATICS <<<")
         
    print(json.dumps(test_reading, indent=2))
    
    success, proof_bundle = simulate_zk_snark_generation(test_reading)
    
    if success:
         oracle = SolarOracle(rpc_url=RPC_URL, contract_address=CONTRACT_ADDRESS, oracle_private_key=ORACLE_PRIVATE_KEY)
         verify_on_chain(oracle, proof_bundle)
