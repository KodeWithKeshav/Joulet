#!/usr/bin/env python3
"""
Device-count scalability level: N concurrent simulated inverters, each with
its own registered ECDSA identity (devices.json), all streaming real
realistic_sunny.csv rows (08:00-14:00 window) at one reading per 2 s
through a fresh 3-oracle stack.

Usage: run_scale_level.py <n_devices> <duration_s> <stack_id> <metrics_file>
"""

import os
import sys
import threading
import time

N_DEVICES = int(sys.argv[1])
DURATION = float(sys.argv[2])
STACK_ID = int(sys.argv[3])
METRICS_FILE = sys.argv[4]

os.environ["JOULET_METRICS_FILE"] = METRICS_FILE
os.environ["JOULET_PROFILE_LABEL"] = f"scale_{N_DEVICES:02d}"
os.environ["JOULET_RUN_ID"] = f"scale_{N_DEVICES:02d}"

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))

from common import Stack, ReadingSubmitter, load_csv, rows_in_hours  # noqa: E402
from metrics_logger import log_event  # noqa: E402

window = rows_in_hours(load_csv("realistic_sunny.csv"), 8, 14)
PACE = 2.0  # seconds between readings per device

stack = Stack(STACK_ID, n_oracles=3, quorum=3, target_interval=15.0,
              initial_difficulty=5.0, metrics_file=METRICS_FILE,
              profile_label=f"scale_{N_DEVICES:02d}",
              run_id=f"scale_{N_DEVICES:02d}").start()
try:
    sub = ReadingSubmitter(stack)
    log_event("scale_start", n_devices=N_DEVICES, duration_s=DURATION,
              pace_s=PACE, contract=stack.contract_address)
    t0 = time.time()

    def device_loop(dev_idx):
        device_id = f"sim_inverter_{dev_idx+1:02d}"
        idx = 0  # every device starts at window head (<3 kW) to satisfy the spike check
        while time.time() - t0 < DURATION:
            sub.submit_row(window[idx % len(window)], device_id=device_id)
            idx += 1
            time.sleep(PACE)

    threads = [threading.Thread(target=device_loop, args=(i,)) for i in range(N_DEVICES)]
    for th in threads:
        th.start()
        time.sleep(PACE / max(1, N_DEVICES))  # stagger arrivals within one pace period
    for th in threads:
        th.join()

    time.sleep(2.0)
    log_event("scale_end", n_devices=N_DEVICES, elapsed_s=time.time() - t0)
finally:
    stack.stop()
print(f"[scale done] {N_DEVICES} devices")
