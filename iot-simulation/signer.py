#!/usr/bin/env python3
"""
Phase 2: ECDSA Signer Utility
Takes CSV data rows, hashes them, and signs them using a private key
representing a registered IoT device. Outputs the payload and signature.
"""

from web3 import Web3
from eth_account.messages import encode_defunct
import json
import csv
import os

# Deterministic mock private keys for testing
PRIVATE_KEYS = {
    'solar_node_alpha': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    'solar_node_beta': '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    'solar_node_gamma': '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
}

def sign_data(private_key_hex, data_dict):
    """
    Signs a dictionary of data using ECDSA.
    Returns the signature hex string.
    """
    # Sort keys for deterministic JSON serialization
    message_str = json.dumps(data_dict, sort_keys=True)
    message = encode_defunct(text=message_str)
    
    signed_message = Web3().eth.account.sign_message(message, private_key=private_key_hex)
    return signed_message.signature.hex()

def process_csv(csv_path):
    """
    Reads a CSV file, signs each row, and yields the signed payloads.
    """
    print(f"\nProcessing {csv_path}...")
    
    if not os.path.exists(csv_path):
         print(f"Error: {csv_path} not found.")
         return []
         
    signed_payloads = []
    
    with open(csv_path, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            device_id = row['Device_ID']
            private_key = PRIVATE_KEYS.get(device_id)
            
            if not private_key:
                print(f"Warning: No private key found for {device_id}. Skipping.")
                continue
            
            # Create payload dictionary
            payload = dict(row)
            
            # Sign it
            signature = sign_data(private_key, payload)
            
            signed_payload = {
                 "payload": payload,
                 "signature": signature
            }
            signed_payloads.append(signed_payload)
            
    print(f"Signed {len(signed_payloads)} readings.")
    return signed_payloads

if __name__ == "__main__":
    print("Testing ECDSA Signer...")
    
    # Process a small sample to verify
    payloads = process_csv('mock_data/sunny_day.csv')
    
    if payloads:
        # Print first element as example
        print("\nExample Signed Payload:")
        print(json.dumps(payloads[0], indent=2))
        
        # Verify it
        w3 = Web3()
        message_str = json.dumps(payloads[0]['payload'], sort_keys=True)
        message = encode_defunct(text=message_str)
        recovered_address = w3.eth.account.recover_message(message, signature=payloads[0]['signature'])
        
        expected_address = w3.eth.account.from_key(PRIVATE_KEYS['solar_node_alpha']).address
        
        if recovered_address == expected_address:
            print(f"\n✓ Phase 2: Signature verified! Recovered Address: {recovered_address}")
        else:
             print("\n✗ Verification Failed.")
    else:
        print("No payloads generated. Did you run generate_mock_data.py first?")
