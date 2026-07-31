#!/usr/bin/env python3
"""
Ttarget sensitivity run: one consensus engine configured with
DIFF_TARGET_INTERVAL = <target>, fed a constant real input stream
(realistic_sunny.csv 08:00-14:00 rows, one reading / 6 s ≈ 0.65 kWh/s).
The window starts below 3 kW so the oracle spike check passes from cold start.

Usage: run_ttarget.py <target_s> <duration_s> <stack_id> <metrics_file>
"""

import os
import random
import sys
import time

TARGET = float(sys.argv[1])
DURATION = float(sys.argv[2])
STACK_ID = int(sys.argv[3])
METRICS_FILE = sys.argv[4]

os.environ["JOULET_METRICS_FILE"] = METRICS_FILE
os.environ["JOULET_PROFILE_LABEL"] = f"ttarget_{int(TARGET)}"
os.environ["JOULET_RUN_ID"] = f"ttarget_{int(TARGET)}"

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))

from common import Stack, ReadingSubmitter, load_csv, rows_in_hours  # noqa: E402
from metrics_logger import log_event  # noqa: E402

window = rows_in_hours(load_csv("realistic_sunny.csv"), 8, 14)
PACE = 6.0
rng = random.Random(int(TARGET))

stack = Stack(STACK_ID, n_oracles=3, quorum=3, target_interval=TARGET,
              initial_difficulty=5.0, metrics_file=METRICS_FILE,
              profile_label=f"ttarget_{int(TARGET)}",
              run_id=f"ttarget_{int(TARGET)}").start()
try:
    sub = ReadingSubmitter(stack)
    log_event("ttarget_start", target_s=TARGET, duration_s=DURATION,
              pace_s=PACE, contract=stack.contract_address)
    t0 = time.time()
    idx = 0
    while time.time() - t0 < DURATION:
        sub.submit_row(window[idx % len(window)])
        idx += 1
        time.sleep(max(0.05, PACE + rng.uniform(-0.3, 0.3)))
    time.sleep(2.0)
    log_event("ttarget_end", target_s=TARGET, elapsed_s=time.time() - t0)
finally:
    stack.stop()
print(f"[ttarget done] {TARGET}s")
