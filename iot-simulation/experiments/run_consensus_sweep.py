#!/usr/bin/env python3
"""
Consensus agreement-latency sweep: run the real consensus engine with
n = 1, 3, 5, 7 oracle nodes (quorum = n) and measure per-reading agreement
latency (first vote arrival -> consensus decision) from consensus_reached
events. Input: realistic_sunny.csv 08:00-14:00 rows at 1 reading/s, 90 s per level.

Usage: run_consensus_sweep.py <metrics_file>
"""

import os
import sys
import time

METRICS_FILE = sys.argv[1]
os.environ["JOULET_METRICS_FILE"] = METRICS_FILE
os.environ["JOULET_PROFILE_LABEL"] = "consensus_sweep"
os.environ["JOULET_RUN_ID"] = "consensus_sweep"

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))

from common import Stack, ReadingSubmitter, load_csv, rows_in_hours  # noqa: E402
from metrics_logger import log_event  # noqa: E402

window = rows_in_hours(load_csv("realistic_sunny.csv"), 8, 14)

for n in (1, 3, 5, 7):
    os.environ["JOULET_RUN_ID"] = f"consensus_n{n}"
    stack = Stack(9, n_oracles=n, quorum=n, target_interval=15.0,
                  metrics_file=METRICS_FILE, profile_label=f"consensus_n{n}",
                  run_id=f"consensus_n{n}").start()
    try:
        sub = ReadingSubmitter(stack)
        log_event("consensus_sweep_start", n_nodes=n)
        t0 = time.time()
        idx = 0
        while time.time() - t0 < 90:
            sub.submit_row(window[idx % len(window)])
            idx += 1
            time.sleep(1.0)
        time.sleep(2.0)
        log_event("consensus_sweep_end", n_nodes=n)
    finally:
        stack.stop()
    print(f"[consensus sweep n={n} done]")
