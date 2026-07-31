#!/usr/bin/env python3
"""Join raw JSONL pipeline events into per-reading and per-mint records."""

from collections import defaultdict


def group_runs(events):
    runs = defaultdict(list)
    for e in events:
        rid = e.get("run_id")
        if rid:
            runs[rid].append(e)
    for rid in runs:
        runs[rid].sort(key=lambda e: e["timestamp_ms"])
    return runs


def pipeline_records(run_events):
    """Per-reading stage latencies within one run.

    Returns (readings, mints):
      readings: sig_id -> dict of stage timings (ms)
      mints:    list of {called_ts, confirmed_ts, gas, kwh, sig_ids, difficulty}
    """
    signed, submitted, received, verified, consensus = {}, {}, {}, defaultdict(list), {}
    mints = []
    pending_mint = None

    for e in run_events:
        st = e["stage"]
        ts = e["timestamp_ms"]
        if st == "packet_signed":
            signed[e["sig_id"]] = e
        elif st == "packet_submitted":
            submitted[e["sig_id"]] = e
        elif st == "oracle_received":
            sid = e["sig_id"]
            if sid not in received or ts < received[sid]:
                received[sid] = ts
        elif st == "oracle_verified":
            verified[e["sig_id"]].append(e)
        elif st == "consensus_reached":
            consensus[e["sig_id"]] = e
        elif st == "mint_called":
            pending_mint = {"called_ts": ts, "kwh": e["batch_kwh"],
                            "sig_ids": e.get("batch_sig_ids", []),
                            "difficulty": e["difficulty"],
                            "n_readings": e["batch_readings"]}
        elif st == "mint_tx_confirmed" and pending_mint is not None:
            pending_mint.update(confirmed_ts=ts, gas=e["gas_used"],
                                tx_hash=e.get("tx_hash"),
                                confirm_ms=e.get("confirm_duration_ms"))
            mints.append(pending_mint)
            pending_mint = None

    mint_of = {}
    for m in mints:
        for sid in m["sig_ids"]:
            mint_of[sid] = m

    readings = {}
    for sid, sub in submitted.items():
        rec = {"submitted_ts": sub["timestamp_ms"]}
        if sid in signed:
            rec["sign_ms"] = signed[sid].get("sign_duration_ms")
            rec["signed_ts"] = signed[sid]["timestamp_ms"]
        if sid in received:
            rec["transport_ms"] = received[sid] - sub["timestamp_ms"]
        if verified[sid]:
            vals = [v["validation_duration_ms"] for v in verified[sid]]
            rec["validate_ms"] = sum(vals) / len(vals)
            rec["valid"] = all(v["valid"] for v in verified[sid])
        if sid in consensus:
            c = consensus[sid]
            rec["consensus_ms"] = c["agreement_latency_ms"]
            rec["consensus_ts"] = c["timestamp_ms"]
            rec["accepted"] = c["accepted"]
        m = mint_of.get(sid)
        if m and "consensus_ts" in rec:
            rec["batch_wait_ms"] = m["called_ts"] - rec["consensus_ts"]
            rec["mint_confirm_ms"] = m.get("confirm_ms")
            if "signed_ts" in rec and "confirmed_ts" in m:
                rec["e2e_ms"] = m["confirmed_ts"] - rec["signed_ts"]
        readings[sid] = rec
    return readings, mints
