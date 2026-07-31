#!/usr/bin/env python3
"""
Gas-cost comparison, one arm x one trial per invocation. All arms consume the
identical real input stream (realistic_sunny.csv 08:00-14:00 rows, 1 reading/s,
120 s) and submit real transactions to a fresh JouletToken on hardhat:

  direct  - Direct Push: one reportEnergyProduction tx per reading
            (the legacy solar_oracle.py per-reading path)
  static  - Static Batch: accumulate to the fixed 10 kWh threshold
            (api_bridge.py's default reporting_threshold, no adaptation)
  ard     - Joulet ARD: the full oracle/consensus stack with adaptive
            difficulty (Ttarget = 15 s)

Gas comes from real tx receipts (mint_tx_confirmed events).

Usage: run_gas_arm.py <arm> <trial> <metrics_file>
"""

import os
import sys
import time

ARM = sys.argv[1]
TRIAL = int(sys.argv[2])
METRICS_FILE = sys.argv[3]

os.environ["JOULET_METRICS_FILE"] = METRICS_FILE
os.environ["JOULET_PROFILE_LABEL"] = f"gas_{ARM}"
os.environ["JOULET_RUN_ID"] = f"gas_{ARM}_t{TRIAL}"

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))

from common import Stack, ReadingSubmitter, load_csv, rows_in_hours, get_w3, deploy_joulet, hh_key  # noqa: E402
from metrics_logger import log_event  # noqa: E402

DURATION = 120.0
PACE = 1.0
window = rows_in_hours(load_csv("realistic_sunny.csv"), 8, 14)
PRODUCER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

log_event("gas_arm_start", arm=ARM, trial=TRIAL, duration_s=DURATION, pace_s=PACE)

if ARM in ("direct", "static"):
    # driver account acts as the authorized reporter on its own contract
    # one dedicated account per arm (trials are sequential within an arm),
    # clear of the parallel ARD stacks (11-14) and ZK (16)
    key, addr = hh_key(17 if ARM == "direct" else 18)
    w3 = get_w3()
    contract_addr, _ = deploy_joulet(w3, addr)
    from solar_oracle import SolarOracle
    oracle = SolarOracle(rpc_url="http://127.0.0.1:8545",
                         contract_address=contract_addr,
                         oracle_private_key=key)
    t0 = time.time()
    idx = 0
    acc = 0.0
    while time.time() - t0 < DURATION:
        kwh = float(window[idx % len(window)]["Power_kW"])
        idx += 1
        if ARM == "direct":
            if kwh > 0:
                oracle.report_energy(PRODUCER, kwh)
        else:
            acc += kwh
            if acc >= 10.0:  # api_bridge.py default reporting_threshold
                oracle.report_energy(PRODUCER, acc)
                acc = 0.0
        time.sleep(PACE)
    log_event("gas_arm_end", arm=ARM, trial=TRIAL, readings=idx,
              elapsed_s=time.time() - t0)

elif ARM == "ard":
    stack = Stack(10 + TRIAL % 4, n_oracles=3, quorum=3, target_interval=15.0,
                  initial_difficulty=5.0, metrics_file=METRICS_FILE,
                  profile_label="gas_ard", run_id=f"gas_ard_t{TRIAL}").start()
    try:
        sub = ReadingSubmitter(stack)
        t0 = time.time()
        idx = 0
        while time.time() - t0 < DURATION:
            sub.submit_row(window[idx % len(window)])
            idx += 1
            time.sleep(PACE)
        time.sleep(2.0)
        log_event("gas_arm_end", arm=ARM, trial=TRIAL, readings=idx,
                  elapsed_s=time.time() - t0)
    finally:
        stack.stop()

print(f"[gas arm done] {ARM} trial {TRIAL}")
