#!/usr/bin/env python3
"""
Whole-run vs steady-state analysis of the multi-device scale campaign
(data/scale.jsonl: 1, 5, 10, 20 concurrent simulated inverters, 120 s each,
3 oracles, nominal reading pace 2 s per device).

    python scale_steady_state.py

Why this exists: a run starts from an empty accumulator, so the first seconds
contain a startup burst of mints (initial difficulty D0 is far below the
equilibrium batch size). Averaging over the whole 120 s therefore overstates
the sustained mint rate. This script reports both, plus the realized
per-device reading rate (closed-loop pacing: each device waits for its own
request to finish, so the realized rate is slightly below the nominal 30/min).

Definitions
  t = 0                  timestamp of the scale_start event of the run
  whole-run              all events, divided by the elapsed_s logged at scale_end
                         (this includes the ~2 s drain after the last reading)
  steady state           mints with 40 s <= t < 120 s, divided by 80 s
  verified               consensus_reached events with accepted = true
  gas per mint           gas_used of mint_tx_confirmed
"""
import json
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "scale.jsonl")
OUT = os.path.join(HERE, "results")
STEADY_LO, STEADY_HI = 40.0, 120.0


def load():
    runs = defaultdict(lambda: {"mints": [], "verified": 0, "received": 0, "signed": 0,
                                "approvals": 0, "forwarded": 0, "verified_events": 0,
                                "per_device": defaultdict(int)})
    meta = {}
    for line in open(DATA, encoding="utf-8"):
        d = json.loads(line)
        rid = d.get("run_id")
        st = d.get("stage")
        r = runs[rid]
        if st == "scale_start":
            meta[rid] = {"t0": d["timestamp_ms"], "n": d["n_devices"], "dur": d["duration_s"], "pace": d["pace_s"]}
        elif st == "scale_end":
            meta[rid]["elapsed"] = d["elapsed_s"]
        elif st == "mint_tx_confirmed":
            r["mints"].append((d["timestamp_ms"], d["gas_used"], d["kwh"]))
        elif st == "consensus_reached":
            if d.get("accepted", True):
                r["verified"] += 1
        elif st == "packet_signed":
            r["signed"] += 1
            r["per_device"][d["device_id"]] += 1
        elif st == "oracle_verified":
            r["verified_events"] += 1
    return runs, meta


def main():
    runs, meta = load()
    rows = []
    for rid in sorted(meta, key=lambda k: meta[k]["n"]):
        m, r = meta[rid], runs[rid]
        t = sorted((ts - m["t0"]) / 1000.0 for ts, _, _ in r["mints"])
        gas = [g for _, g, _ in sorted(r["mints"])]
        el = m["elapsed"]
        n_mint = len(t)
        steady = [x for x in t if STEADY_LO <= x < STEADY_HI]
        # 20 s windows to show the startup burst
        win = {f"{a}-{a+20}s": sum(1 for x in t if a <= x < a + 20) * 3.0 for a in range(0, 120, 20)}
        span_cov = max(t) if t else 0.0
        rows.append({
            "run_id": rid, "devices": m["n"], "elapsed_s": round(el, 2),
            "signed_packets": r["signed"], "oracle_receipts": r["verified_events"],
            "verified_by_quorum": r["verified"],
            "readings_per_min_total": round(r["verified"] / (el / 60.0), 1),
            "readings_per_min_per_device": round(r["verified"] / (el / 60.0) / m["n"], 1),
            "nominal_readings_per_min_per_device": 60.0 / m["pace"],
            "mints": n_mint,
            "mints_per_min_whole_run": round(n_mint / (el / 60.0), 2),
            "mints_per_min_steady_40_120s": round(len(steady) / ((STEADY_HI - STEADY_LO) / 60.0), 2),
            "mints_per_min_by_20s_window": win,
            "mean_gas_per_mint": round(sum(gas) / len(gas)) if gas else None,
            "gas_per_hour_whole_run_extrapolated": round(sum(gas) * 3600.0 / el),
            "gas_per_hour_steady_extrapolated": round(sum(g for (ts, g, _), x in
                                                           zip(sorted(r["mints"]), t)
                                                           if STEADY_LO <= x < STEADY_HI) * 3600.0 /
                                                       (STEADY_HI - STEADY_LO)),
            "last_mint_at_s": round(span_cov, 1),
        })
        rows[-1]["gas_per_hour_steady_per_device"] = round(rows[-1]["gas_per_hour_steady_extrapolated"] / m["n"])
        rows[-1]["gas_per_hour_whole_per_device"] = round(rows[-1]["gas_per_hour_whole_run_extrapolated"] / m["n"])

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "scale_steady_state.json"), "w") as f:
        json.dump(rows, f, indent=2)
    hdr = ("| devices | read/min total (per device) | mints/min whole | mints/min steady | "
           "gas/h whole | gas/h steady | gas/h steady per device |")
    print(hdr)
    print("|---|---|---|---|---|---|---|")
    for x in rows:
        print(f"| {x['devices']} | {x['readings_per_min_total']} ({x['readings_per_min_per_device']}) | "
              f"{x['mints_per_min_whole_run']} | {x['mints_per_min_steady_40_120s']} | "
              f"{x['gas_per_hour_whole_run_extrapolated']:,} | {x['gas_per_hour_steady_extrapolated']:,} | "
              f"{x['gas_per_hour_steady_per_device']:,} |")
    print()
    for x in rows:
        print(x["devices"], "devices: oracle receipts", x["oracle_receipts"], "= 3 x", x["signed_packets"],
              "| quorum-verified", x["verified_by_quorum"], "| mints by 20 s window (per min):",
              x["mints_per_min_by_20s_window"])


if __name__ == "__main__":
    sys.exit(main())
