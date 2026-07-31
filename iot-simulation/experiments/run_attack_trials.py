#!/usr/bin/env python3
"""
Fraud-injection experiments, replicating the documented AttackPanel flow
(real HTTP submissions of realistic_fraud.csv rows to live oracle nodes).

Mode "trials": 10 independent attack trials. Each trial runs a fresh stack
of 4 oracle nodes (oracle_4 Byzantine/contrarian) with quorum 4, streams a
few honest solar_node_alpha readings, then injects a burst of fraudulent
solar_node_gamma rows straight from realistic_fraud.csv:
  - physics violations  (V*I != P)
  - capacity violations (>5 kW from a 5 kW array)
  - nighttime generation (original 00-04h timestamp hour preserved via tz offset)
  - one forged-signature packet (alpha payload signed with gamma's key)
Logged per injection: attack_injected event; the consensus_reached events
carry reputation_before/after = the stake-weight slash.

Mode "long": one continuous 240 s run, honest alpha stream + periodic gamma
fraud, for reputation-trajectory plots (fig12).

Usage: run_attack_trials.py <mode> <metrics_file>
"""

import os
import sys
import time

MODE = sys.argv[1]
METRICS_FILE = sys.argv[2]

os.environ["JOULET_METRICS_FILE"] = METRICS_FILE
os.environ["JOULET_PROFILE_LABEL"] = f"attack_{MODE}"
os.environ["JOULET_RUN_ID"] = f"attack_{MODE}"

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))

from common import Stack, ReadingSubmitter, load_csv, rows_in_hours  # noqa: E402
from metrics_logger import log_event, payload_sig_id  # noqa: E402

fraud_rows = load_csv("realistic_fraud.csv")
sunny_rows = rows_in_hours(load_csv("realistic_sunny.csv"), 8, 14)


def classify(row):
    p = float(row["Power_kW"])
    v = float(row["Voltage"])
    i = float(row["Current"])
    h = int(row["Timestamp"][11:13])
    if (h < 6 or h > 18) and p > 0.05:
        return "nighttime_generation"
    if p > 5.0:
        return "capacity_violation"
    if abs(v * i / 1000.0 - p) > 0.1:
        return "physics_violation"
    return None


attacks = [(r, c) for r in fraud_rows if (c := classify(r))]
night = [a for a in attacks if a[1] == "nighttime_generation"]
capacity = [a for a in attacks if a[1] == "capacity_violation"]
physics = [a for a in attacks if a[1] == "physics_violation"]
print(f"fraud rows available: night={len(night)} capacity={len(capacity)} physics={len(physics)}")


def inject(sub, row, attack_type, trial):
    keep = attack_type == "nighttime_generation"
    log_event("attack_injected", trial=trial, attack_type=attack_type,
              device_id=row["Device_ID"], power_kw=float(row["Power_kW"]))
    sig_id, results = sub.submit_row(row, keep_hour=keep)
    log_event("attack_responses", trial=trial, sig_id=sig_id,
              attack_type=attack_type, oracle_status=results)
    return sig_id


if MODE == "trials":
    for trial in range(10):
        os.environ["JOULET_RUN_ID"] = f"attack_t{trial:02d}"
        stack = Stack(9, n_oracles=4, quorum=4, target_interval=15.0,
                      metrics_file=METRICS_FILE, profile_label="attack_trials",
                      run_id=f"attack_t{trial:02d}",
                      malicious_ids={"oracle_4"}).start()
        try:
            sub = ReadingSubmitter(stack)
            log_event("attack_trial_start", trial=trial)
            # honest baseline traffic (3 readings)
            for k in range(3):
                sub.submit_row(sunny_rows[(trial * 3 + k) % len(sunny_rows)])
                time.sleep(1.0)
            # fraud burst: one of each attack class, rotated per trial
            inject(sub, night[trial % len(night)][0], "nighttime_generation", trial)
            time.sleep(1.0)
            inject(sub, capacity[trial % len(capacity)][0], "capacity_violation", trial)
            time.sleep(1.0)
            inject(sub, physics[trial % len(physics)][0], "physics_violation", trial)
            time.sleep(1.0)
            # forged signature: alpha payload signed with gamma's key
            forged_row = dict(sunny_rows[(trial * 5) % len(sunny_rows)])
            log_event("attack_injected", trial=trial, attack_type="signature_forgery",
                      device_id=forged_row["Device_ID"])
            sub.submit_forged(forged_row, wrong_key_device="solar_node_gamma")
            time.sleep(1.0)
            # trailing honest traffic
            for k in range(2):
                sub.submit_row(sunny_rows[(trial * 3 + 40 + k) % len(sunny_rows)])
                time.sleep(1.0)
            time.sleep(2.0)
            log_event("attack_trial_end", trial=trial)
        finally:
            stack.stop()
        print(f"[attack trial {trial} done]")

elif MODE == "long":
    stack = Stack(9, n_oracles=4, quorum=4, target_interval=15.0,
                  metrics_file=METRICS_FILE, profile_label="attack_long",
                  run_id="attack_long", malicious_ids={"oracle_4"}).start()
    try:
        sub = ReadingSubmitter(stack)
        log_event("attack_long_start")
        t0 = time.time()
        idx = 0
        fraud_idx = 0
        while time.time() - t0 < 240:
            sub.submit_row(sunny_rows[idx % len(sunny_rows)])
            idx += 1
            # every 4th honest reading, inject one fraud row
            if idx % 4 == 0:
                row, ctype = attacks[fraud_idx % len(attacks)]
                inject(sub, row, ctype, -1)
                fraud_idx += 1
            time.sleep(1.5)
        time.sleep(2.0)
        log_event("attack_long_end", elapsed_s=time.time() - t0)
    finally:
        stack.stop()
    print("[attack long run done]")
