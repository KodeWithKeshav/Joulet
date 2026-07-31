#!/usr/bin/env python3
"""
Metrics Logger - lightweight JSONL instrumentation for the Joulet pipeline.

Every component (signer, oracle nodes, consensus engine, blockchain bridge)
appends structured events to the file named by JOULET_METRICS_FILE.
Each line: {"stage": ..., "timestamp_ms": ..., "profile_label": ..., ...}

If JOULET_METRICS_FILE is unset, logging is a no-op so normal demo
operation is completely unaffected.
"""

import json
import os
import time
import hashlib
import threading

_lock = threading.Lock()

METRICS_FILE = os.getenv("JOULET_METRICS_FILE", "")
PROFILE_LABEL = os.getenv("JOULET_PROFILE_LABEL", "")
RUN_ID = os.getenv("JOULET_RUN_ID", "")


def payload_sig_id(payload):
    """Same reading identifier the consensus engine uses (sha256 of sorted JSON)."""
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


def log_event(stage, **fields):
    if not METRICS_FILE:
        return
    event = {
        "stage": stage,
        "timestamp_ms": time.time() * 1000.0,
    }
    if PROFILE_LABEL:
        event["profile_label"] = PROFILE_LABEL
    if RUN_ID:
        event["run_id"] = RUN_ID
    event.update(fields)
    line = json.dumps(event)
    with _lock:
        with open(METRICS_FILE, "a") as f:
            f.write(line + "\n")
