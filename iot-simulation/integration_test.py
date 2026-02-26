#!/usr/bin/env python3
"""
Integration Tester: Pipes realistic data from CSV into the Oracle Network
to watch the Reputation-Weighted Consensus engine work.
"""

import csv
import json
import time
import requests
import argparse
from signer import sign_data, PRIVATE_KEYS

def run_simulation(csv_file, speed=1.0):
    print(f"Running simulation using {csv_file} at {speed}x speed.")
    
    with open(csv_file, mode='r') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            device_id = row['Device_ID']
            private_key = PRIVATE_KEYS.get(device_id)
            
            if not private_key:
                continue
            
            payload = dict(row)
            signature = sign_data(private_key, payload)
            
            # Send to Oracle 1 for demo purposes
            # In true distributed architecture, the device broadcasts to all Oracles
            try:
                print(f"\n[IoT Transmitter] Sending reading for {device_id} ({payload['Power_kW']} kW)")
                res = requests.post(
                     "http://127.0.0.1:5001/api/oracle/submit",
                     json={"payload": payload, "signature": signature},
                     timeout=2
                )
                print(f"[Oracle Response] {res.status_code} - {res.text.strip()}")
            except Exception as e:
                print(f"Connection error: {e}")
                
            time.sleep(speed)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--scenario', type=str, default='sunny', choices=['sunny', 'cloudy', 'fraud'])
    parser.add_argument('--speed', type=float, default=1.0)
    args = parser.parse_args()
    
    file_map = {
         'sunny': 'mock_data/realistic_sunny.csv',
         'cloudy': 'mock_data/realistic_cloudy.csv',
         'fraud': 'mock_data/realistic_fraud.csv'
    }
    
    run_simulation(file_map[args.scenario], args.speed)
