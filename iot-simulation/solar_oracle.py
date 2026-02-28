#!/usr/bin/env python3
"""
Solar Oracle - IoT Energy Meter Simulator
Simulates a smart meter that reads real-time solar energy production
and reports it to the Joulet blockchain
"""

import time
import random
import json
from datetime import datetime
from web3 import Web3
from eth_account import Account
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SolarOracle:
    def __init__(self, rpc_url, contract_address, oracle_private_key):
        """
        Initialize the Solar Oracle
        
        Args:
            rpc_url: Blockchain RPC endpoint (e.g., Sepolia testnet)
            contract_address: Deployed JouletToken contract address
            oracle_private_key: Private key for the oracle (energy meter) account
        """
        # Connect to blockchain
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        if not self.w3.is_connected():
            raise Exception("Failed to connect to blockchain")
        
        print(f"✓ Connected to blockchain at {rpc_url}")
        
        # Oracle account setup
        self.oracle_account = Account.from_key(oracle_private_key)
        self.oracle_address = self.oracle_account.address
        print(f"✓ Oracle address: {self.oracle_address}")
        
        # Contract setup
        self.contract_address = Web3.to_checksum_address(contract_address)
        
        # Load contract ABI (simplified for this example)
        self.contract_abi = [
            {
                "inputs": [
                    {"internalType": "address", "name": "producerWallet", "type": "address"},
                    {"internalType": "uint256", "name": "kWhAmount", "type": "uint256"},
                    {"internalType": "bytes32", "name": "merkleRoot", "type": "bytes32"}
                ],
                "name": "reportEnergyProduction",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "producer", "type": "address"}
                ],
                "name": "demoReset",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "internalType": "uint256", "name": "batchId", "type": "uint256"},
                    {"indexed": True, "internalType": "address", "name": "producerWallet", "type": "address"},
                    {"indexed": False, "internalType": "uint256", "name": "kWhProduced", "type": "uint256"},
                    {"indexed": False, "internalType": "uint256", "name": "tokensMinted", "type": "uint256"},
                    {"indexed": False, "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32"}
                ],
                "name": "EnergyReported",
                "type": "event"
            }
        ]
        
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
        
        print(f"✓ Contract loaded at {self.contract_address}")
    
    def simulate_solar_production(self):
        """
        Simulate realistic solar energy production
        Returns energy in kWh
        """
        # Get current hour for realistic solar curve
        current_hour = datetime.now().hour
        
        # Solar production curve (0 at night, peak at midday)
        if 6 <= current_hour <= 18:
            # Daytime - use sine curve for realistic solar output
            hour_normalized = (current_hour - 6) / 12  # 0 to 1
            solar_factor = abs(2 * hour_normalized - 1)  # Peak at 0.5 (noon)
            base_production = 15 * (1 - solar_factor)  # 0-15 kWh range
            
            # Add weather variability (clouds, etc.)
            weather_factor = random.uniform(0.6, 1.0)
            production = base_production * weather_factor
            
            # Add small random fluctuations
            production += random.uniform(-1, 1)
            
            return max(0, production)
        else:
            # Nighttime - no solar production
            return 0
    
    def demo_reset(self, producer_address):
        """Burns producer JLT and resets on-chain energy state for demo purposes."""
        try:
            producer = Web3.to_checksum_address(producer_address)
            tx = self.contract.functions.demoReset(producer).build_transaction({
                'from': self.oracle_address,
                'nonce': self.w3.eth.get_transaction_count(self.oracle_address),
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
            })
            signed = self.w3.eth.account.sign_transaction(tx, self.oracle_account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            print(f"[DEMO-RESET] On-chain reset done. tx={tx_hash.hex()} status={receipt.status}")
            return receipt.status == 1
        except Exception as e:
            print(f"[DEMO-RESET] Error: {e}")
            return False

    def report_energy(self, producer_address, kwh_amount, merkle_root=None):
        """
        Report energy production to the blockchain
        
        Args:
            producer_address: Address of the solar farm producer
            kwh_amount: Amount of energy produced in kWh
            merkle_root: Hex string of the Merkle root. Defaults to zero hash if not provided.
        """
        try:
            # Convert kWh to integer (avoiding floating point)
            kwh_int = int(kwh_amount * 10)  # Store as 10x for precision
            
            if not merkle_root:
                 # Default an empty 32-byte hex if none provided (e.g. for pure simulation mode bypassing consensus engine)
                 merkle_root = "0x" + "0"*64
            elif isinstance(merkle_root, str) and not merkle_root.startswith('0x'):
                 merkle_root = "0x" + merkle_root
            
            # Convert string hex to bytes
            root_bytes = Web3.to_bytes(hexstr=merkle_root)
            
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.oracle_address)
            
            transaction = self.contract.functions.reportEnergyProduction(
                Web3.to_checksum_address(producer_address),
                kwh_int,
                root_bytes
            ).build_transaction({
                'from': self.oracle_address,
                'nonce': nonce,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(
                transaction,
                private_key=self.oracle_account.key
            )

            # ── TERMINAL PROOF: ECDSA Signature ─────────────────────────────
            raw_tx  = getattr(signed_txn, 'raw_transaction', getattr(signed_txn, 'rawTransaction', None))
            tx_hash_pre = Web3.keccak(raw_tx)
            print()
            print("┌────────────────────────[♥ ORACLE SIGNING]────────────────────────")
            print(f"│ ⚡ Energy Report     : {kwh_amount:.4f} kWh  (on-chain int: {kwh_int})")
            print(f"│ 🌳 Producer Wallet   : {producer_address}")
            print(f"│ 🔏 Merkle Root        : {merkle_root}")
            print(f"│ 🔢 Nonce              : {nonce}")
            print(f"│ ⛽ Gas Price          : {self.w3.eth.gas_price} wei")
            print(f"│ 🔐 ECDSA signer       : {self.oracle_address}")
            print(f"│ 📝 Tx raw hash (kek)  : 0x{tx_hash_pre.hex()}")
            if hasattr(signed_txn, 'v'):
                print(f"│ 📍 Signature (v,r,s)  : v={getattr(signed_txn,'v','-')}  r=0x{getattr(signed_txn,'r',0):064x}  s=0x{getattr(signed_txn,'s',0):064x}")
            print("└─────────────────────────────────────────────────────────────")
            print()
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
            
            print(f"✅ Tx broadcast      : {tx_hash.hex()}")
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] == 1:
                print(f"✅ CONFIRMED block #{receipt['blockNumber']:,}  gasUsed={receipt['gasUsed']:,}  🌱 JLT minted!")
                print()
                return True
            else:
                print(f"❌ Transaction REVERTED")
                return False
                
        except Exception as e:
            print(f"✗ Error reporting energy: {str(e)}")
            return False
    
    def run_continuous_monitoring(self, producer_address, interval_seconds=30):
        """
        Run continuous monitoring and reporting
        
        Args:
            producer_address: Address to credit tokens to
            interval_seconds: How often to read and report (default 30 seconds)
        """
        print("\n" + "="*60)
        print("SOLAR ORACLE - CONTINUOUS MONITORING MODE")
        print("="*60)
        print(f"Producer Address: {producer_address}")
        print(f"Reporting Interval: {interval_seconds} seconds")
        print(f"Press Ctrl+C to stop\n")
        
        accumulated_energy = 0
        reading_count = 0
        
        try:
            while True:
                reading_count += 1
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Simulate reading from smart meter
                current_production = self.simulate_solar_production()
                accumulated_energy += current_production
                
                print(f"\n[{timestamp}] Reading #{reading_count}")
                print(f"  Current Output: {current_production:.2f} kWh")
                print(f"  Accumulated: {accumulated_energy:.2f} kWh")
                
                # Report to blockchain every 10 kWh (or as configured)
                REPORTING_THRESHOLD = 10
                if accumulated_energy >= REPORTING_THRESHOLD:
                    print(f"\n  ⚡ THRESHOLD REACHED - Reporting to blockchain...")
                    success = self.report_energy(producer_address, accumulated_energy)
                    
                    if success:
                        accumulated_energy = 0  # Reset accumulator
                        print(f"  ✓ Energy reported and tokens minted")
                    else:
                        print(f"  ✗ Failed to report - will retry next cycle")
                
                # Wait for next reading
                time.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            print("\n\n⚠ Monitoring stopped by user")
            print(f"Final accumulated energy: {accumulated_energy:.2f} kWh (not reported)")
    
    def test_connection(self):
        """Test oracle connection and permissions"""
        print("\n" + "="*60)
        print("TESTING ORACLE CONNECTION")
        print("="*60)
        
        # Check balance
        balance = self.w3.eth.get_balance(self.oracle_address)
        balance_eth = self.w3.from_wei(balance, 'ether')
        print(f"Oracle Balance: {balance_eth:.4f} ETH")
        
        if balance == 0:
            print("⚠ WARNING: Oracle has 0 balance. Need ETH for gas fees!")
            return False
        
        print("✓ Oracle ready to submit transactions")
        return True


def main():
    """Main entry point"""
    print("\n" + "="*60)
    print("JOULET SOLAR ORACLE SIMULATOR")
    print("="*60 + "\n")
    
    # Configuration (use environment variables in production)
    RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")  # Local Hardhat
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
    ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
    PRODUCER_ADDRESS = os.getenv("PRODUCER_ADDRESS", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    
    try:
        # Initialize oracle
        oracle = SolarOracle(
            rpc_url=RPC_URL,
            contract_address=CONTRACT_ADDRESS,
            oracle_private_key=ORACLE_PRIVATE_KEY
        )
        
        # Test connection
        if not oracle.test_connection():
            print("\n⚠ Setup incomplete. Please fund the oracle address.")
            return
        
        # Run monitoring
        oracle.run_continuous_monitoring(
            producer_address=PRODUCER_ADDRESS,
            interval_seconds=10  # Check every 10 seconds for demo
        )
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()