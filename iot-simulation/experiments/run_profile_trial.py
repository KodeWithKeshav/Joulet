#!/usr/bin/env python3
"""
Run one generation-profile trial through a full real stack.

Profiles (all data taken verbatim from the repo's mock_data CSVs; only the
timestamp is refreshed to submission time and a unique nonce added, then
re-signed with the device's real ECDSA key - exactly what a live inverter
would transmit):

  A_high     realistic_sunny.csv  08:00-14:00 rows, cycled  (~4 kW steady)
  B_low      realistic_sunny.csv  06:00-08:00 rows, cycled  (~1 kW)
  C_volatile realistic_cloudy.csv 09:00-16:00 rows, cycled  (0.6-4.6 kW swings)
  D_ramp     realistic_sunny.csv  06:00-12:00 rows, one pass (sunrise ramp)

Usage: run_profile_trial.py <profile> <trial_idx> <duration_s> <target_interval_s> <stack_id> <metrics_file>
"""

import os
import random
import sys
import time

PROFILE = sys.argv[1]
TRIAL = int(sys.argv[2])
DURATION = float(sys.argv[3])
TARGET_INTERVAL = float(sys.argv[4])
STACK_ID = int(sys.argv[5])
METRICS_FILE = sys.argv[6]

os.environ["JOULET_METRICS_FILE"] = METRICS_FILE
os.environ["JOULET_PROFILE_LABEL"] = PROFILE
os.environ["JOULET_RUN_ID"] = f"{PROFILE}_t{TRIAL:02d}"

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))

from common import Stack, ReadingSubmitter, load_csv, rows_in_hours  # noqa: E402
from metrics_logger import log_event  # noqa: E402

PROFILES = {
    "A_high":     ("realistic_sunny.csv", 8, 14, True, 1.0),
    "B_low":      ("realistic_sunny.csv", 6, 8, True, 1.0),
    "C_volatile": ("realistic_cloudy.csv", 9, 16, True, 1.0),
    "D_ramp":     ("realistic_sunny.csv", 6, 12, False, None),
}

csv_name, h_lo, h_hi, cycle, pace = PROFILES[PROFILE]
window = rows_in_hours(load_csv(csv_name), h_lo, h_hi)
rng = random.Random(1000 + TRIAL)  # trial seed: pacing jitter + start offset

stack = Stack(STACK_ID, n_oracles=3, quorum=3, target_interval=TARGET_INTERVAL,
              initial_difficulty=5.0, metrics_file=METRICS_FILE,
              profile_label=PROFILE, run_id=os.environ["JOULET_RUN_ID"]).start()
try:
    sub = ReadingSubmitter(stack)
    log_event("trial_start", profile=PROFILE, trial=TRIAL, duration_s=DURATION,
              csv=csv_name, window=[h_lo, h_hi], contract=stack.contract_address)

    t0 = time.time()
    if cycle:
        idx = (TRIAL * 7) % len(window)
        while time.time() - t0 < DURATION:
            row = window[idx % len(window)]
            sub.submit_row(row)
            idx += 1
            time.sleep(max(0.05, pace + rng.uniform(-0.1, 0.1)))
    else:
        step = DURATION / len(window)
        for row in window:
            if time.time() - t0 > DURATION:
                break
            sub.submit_row(row)
            time.sleep(max(0.05, step + rng.uniform(-0.1, 0.1) * step))

    time.sleep(2.0)  # let in-flight votes settle
    log_event("trial_end", profile=PROFILE, trial=TRIAL,
              elapsed_s=time.time() - t0)
finally:
    stack.stop()
print(f"[trial done] {PROFILE} trial {TRIAL}")
