#!/usr/bin/env python3
"""
ZK-verification overhead: mint with and without the ZK physics-proof step,
N = 10 each, using real realistic_sunny.csv readings.

IMPORTANT CAVEAT (also recorded in the log): zk_prover.py in this codebase is
a *mock* Groth16 prover whose proof-generation time is dominated by fixed
time.sleep() calls simulating prover workload; the on-chain
verifyPhysicsProof() is a simplified pure-Solidity check, not a real SNARK
pairing verifier. Gas numbers for the verify tx and the mint tx are real
hardhat receipts; the proof-generation latency reflects the mock.

Usage: run_zk_overhead.py <metrics_file>
"""

import os
import sys
import time

METRICS_FILE = sys.argv[1]
os.environ["JOULET_METRICS_FILE"] = METRICS_FILE
os.environ["JOULET_PROFILE_LABEL"] = "zk_overhead"
os.environ["JOULET_RUN_ID"] = "zk_overhead"

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))

from common import load_csv, rows_in_hours, get_w3, deploy_joulet, hh_key  # noqa: E402
from metrics_logger import log_event  # noqa: E402

key, addr = hh_key(16)
w3 = get_w3()
contract_addr, abi = deploy_joulet(w3, addr)
contract = w3.eth.contract(address=contract_addr, abi=abi)

from solar_oracle import SolarOracle  # noqa: E402
from zk_prover import simulate_zk_snark_generation  # noqa: E402

oracle = SolarOracle(rpc_url="http://127.0.0.1:8545",
                     contract_address=contract_addr, oracle_private_key=key)
PRODUCER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
readings = rows_in_hours(load_csv("realistic_sunny.csv"), 9, 14)

log_event("zk_note", note="zk_prover.py is a sleep-based mock prover; "
                          "verifyPhysicsProof is a simplified on-chain check. "
                          "Gas values are real receipts; proof-gen latency reflects the mock.")

for mode in ("plain", "zk"):
    for n in range(10):
        row = readings[n * 5 % len(readings)]
        kwh = float(row["Power_kW"])
        t_start = time.time()
        proof_gen_ms = None
        verify_call_ms = None
        verify_gas = None

        if mode == "zk":
            payload = {"Device_ID": row["Device_ID"], "Voltage": row["Voltage"],
                       "Current": row["Current"], "Power_kW": row["Power_kW"]}
            t0 = time.time()
            ok, bundle = simulate_zk_snark_generation(payload)
            proof_gen_ms = (time.time() - t0) * 1000.0
            assert ok
            pub = [int(float(x)) for x in bundle["public_inputs"]]
            mock_bytes = b"mock_zk_snark_proof_array_groth16"
            # real view-call latency
            t0 = time.time()
            contract.functions.verifyPhysicsProof(mock_bytes, pub).call()
            verify_call_ms = (time.time() - t0) * 1000.0
            # send the verification as a real tx to obtain a real gas receipt
            fn = contract.functions.verifyPhysicsProof(mock_bytes, pub)
            tx = fn.build_transaction({
                "from": addr, "nonce": w3.eth.get_transaction_count(addr),
                "gas": 300000, "gasPrice": w3.eth.gas_price})
            signed = w3.eth.account.sign_transaction(tx, private_key=key)
            h = w3.eth.send_raw_transaction(signed.raw_transaction)
            rcpt = w3.eth.wait_for_transaction_receipt(h, timeout=60)
            verify_gas = rcpt.gasUsed

        t_mint = time.time()
        oracle.report_energy(PRODUCER, kwh)
        mint_ms = (time.time() - t_mint) * 1000.0

        log_event("zk_trial", mode=mode, n=n, kwh=kwh,
                  proof_gen_ms=proof_gen_ms, verify_call_ms=verify_call_ms,
                  verify_tx_gas=verify_gas, mint_ms=mint_ms,
                  total_ms=(time.time() - t_start) * 1000.0)
        print(f"[zk {mode} {n}] done")

print("[zk overhead done]")
