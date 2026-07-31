#!/usr/bin/env python3
"""Extract publication-ready numeric data from the same JSONL logs
used by the 6 approved figure scripts.  Outputs JSON to stdout."""

import json, sys, os, numpy as np
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "scripts"))
import figstyle as F
from pipeline import group_runs, pipeline_records

out = {}

# ===================================================================
# FIG 5 — LATENCY BREAKDOWN
# ===================================================================
STAGES_MS = [
    ("sign_ms", "ECDSA sign"),
    ("transport_ms", "Transport"),
    ("validate_ms", "Oracle validate"),
    ("consensus_ms", "Consensus"),
    ("mint_confirm_ms", "Mint tx confirm"),
]
WAIT = ("batch_wait_ms", "ARD batch accumulation")

fig5 = {}
for prof in F.PROFILE_ORDER:
    events = F.load_events(f"profiles_{prof}.jsonl")
    stage_vals = {k: [] for k, _ in STAGES_MS}
    stage_vals[WAIT[0]] = []
    for rid, evs in group_runs(events).items():
        readings, _ = pipeline_records(evs)
        for rec in readings.values():
            if not rec.get("accepted"):
                continue
            for k, _ in STAGES_MS:
                if rec.get(k) is not None:
                    stage_vals[k].append(rec[k])
            if rec.get(WAIT[0]) is not None:
                stage_vals[WAIT[0]].append(rec[WAIT[0]])
    row = {}
    for k, name in STAGES_MS:
        v = np.array(stage_vals[k])
        row[name] = {"mean": float(v.mean()), "std": float(v.std(ddof=1)) if len(v) > 1 else 0.0, "n": len(v)}
    v = np.array(stage_vals[WAIT[0]])
    row["ARD batch accumulation"] = {"mean": float(v.mean()), "std": float(v.std(ddof=1)) if len(v) > 1 else 0.0, "n": len(v)}
    row["Processing subtotal (ms)"] = sum(row[name]["mean"] for _, name in STAGES_MS)
    row["Total inclusion (s)"] = (row["Processing subtotal (ms)"] + row["ARD batch accumulation"]["mean"]) / 1000.0
    fig5[prof] = row
cross = {}
for _, name in STAGES_MS:
    cross[name] = {"mean": float(np.mean([fig5[p][name]["mean"] for p in F.PROFILE_ORDER]))}
cross["ARD batch accumulation"] = {"mean": float(np.mean([fig5[p]["ARD batch accumulation"]["mean"] for p in F.PROFILE_ORDER]))}
cross["Processing subtotal (ms)"] = sum(cross[name]["mean"] for _, name in STAGES_MS)
cross["Total inclusion (s)"] = (cross["Processing subtotal (ms)"] + cross["ARD batch accumulation"]["mean"]) / 1000.0
fig5["cross_profile_mean"] = cross
out["fig5"] = fig5

# ===================================================================
# FIG 6 — LATENCY CDF
# ===================================================================
fig6 = {}
all_e2e = []
for prof in F.PROFILE_ORDER:
    events = F.load_events(f"profiles_{prof}.jsonl")
    vals = []
    for rid, evs in group_runs(events).items():
        readings, _ = pipeline_records(evs)
        vals += [r["e2e_ms"] / 1000.0 for r in readings.values()
                 if r.get("e2e_ms") is not None and r.get("accepted")]
    v = np.sort(np.array(vals))
    fig6[prof] = {
        "p50": float(np.percentile(v, 50)),
        "p95": float(np.percentile(v, 95)),
        "p99": float(np.percentile(v, 99)),
        "min": float(v.min()),
        "max": float(v.max()),
        "n": len(v),
    }
    all_e2e.extend(vals)
pooled = np.sort(np.array(all_e2e))
fig6["pooled"] = {
    "p50": float(np.percentile(pooled, 50)),
    "p95": float(np.percentile(pooled, 95)),
    "p99": float(np.percentile(pooled, 99)),
    "min": float(pooled.min()),
    "max": float(pooled.max()),
    "n": len(pooled),
}
out["fig6"] = fig6

# ===================================================================
# FIG 8 — GAS COMPARISON
# ===================================================================
fig8_events = F.load_events("gas_comparison.jsonl")
ARMS = [("gas_direct", "Direct Push"), ("gas_static", "Static Batch (10 kWh)"), ("gas_ard", "Joulet ARD")]
trials_by_arm = defaultdict(lambda: defaultdict(lambda: {"readings": 0, "gas": 0, "dur": 0, "tx": 0, "kwh": 0}))
for e in fig8_events:
    arm = e.get("profile_label", "")
    rid = e.get("run_id", "")
    if not arm or not rid:
        continue
    t = trials_by_arm[arm][rid]
    if e["stage"] == "packet_submitted":
        t["readings"] += 1
    elif e["stage"] == "mint_tx_confirmed":
        t["gas"] += e["gas_used"]
        t["tx"] += 1
        t["kwh"] += e.get("kwh", 0)
    elif e["stage"] in ("gas_arm_start", "scale_start"):
        t["start"] = e["timestamp_ms"]
    elif e["stage"] in ("gas_arm_end", "scale_end"):
        if "start" in t:
            t["dur"] = (e["timestamp_ms"] - t["start"]) / 1000.0

fig8 = {}
for arm_key, arm_name in ARMS:
    gas_per_hour_vals = []
    gas_per_kwh_vals = []
    for rid, t in trials_by_arm[arm_key].items():
        if t["readings"] < 100:
            continue
        if t["dur"] and t["tx"]:
            gas_per_hour_vals.append(t["gas"] * 3600.0 / t["dur"])
            if t["kwh"] > 0:
                gas_per_kwh_vals.append(t["gas"] / t["kwh"])
    fig8[arm_name] = {
        "gas_per_hour_mean": float(np.mean(gas_per_hour_vals)) if gas_per_hour_vals else 0,
        "gas_per_hour_std": float(np.std(gas_per_hour_vals, ddof=1)) if len(gas_per_hour_vals) > 1 else 0,
        "gas_per_kwh_mean": float(np.mean(gas_per_kwh_vals)) if gas_per_kwh_vals else 0,
        "gas_per_kwh_std": float(np.std(gas_per_kwh_vals, ddof=1)) if len(gas_per_kwh_vals) > 1 else 0,
        "n": len(gas_per_hour_vals),
    }
dp = fig8["Direct Push"]["gas_per_hour_mean"]
for name in fig8:
    fig8[name]["pct_reduction"] = (1 - fig8[name]["gas_per_hour_mean"] / dp) * 100 if dp else 0
out["fig8"] = fig8

# ===================================================================
# FIG 13 — SCALABILITY THROUGHPUT
# ===================================================================
LEVELS = [1, 5, 10, 20]
scale_events = F.load_events("scale.jsonl")
fig13 = {}
for n in LEVELS:
    label = f"scale_{n:02d}"
    evs = [e for e in scale_events if e.get("profile_label") == label]
    if not evs:
        fig13[str(n)] = None
        continue
    t_start = next(e["timestamp_ms"] for e in evs if e["stage"] == "scale_start")
    t_end = next(e["timestamp_ms"] for e in evs if e["stage"] == "scale_end")
    dur_min = (t_end - t_start) / 60000.0
    accepted = [e for e in evs if e["stage"] == "consensus_reached" and e["accepted"]]
    submitted = [e for e in evs if e["stage"] == "packet_submitted"]
    mints = [e for e in evs if e["stage"] == "mint_tx_confirmed"]
    gas = sum(e["gas_used"] for e in mints)
    gas_per_hour = gas * 60.0 / dur_min
    fig13[str(n)] = {
        "verified_per_min": float(len(accepted) / dur_min),
        "offered_per_min": float(len(submitted) / dur_min),
        "tx_per_min": float(len(mints) / dur_min),
        "gas_per_hour": float(gas_per_hour),
        "gas_per_hour_per_device": float(gas_per_hour / n),
    }
out["fig13"] = fig13

# ===================================================================
# FIG 15 — CONSENSUS LATENCY
# ===================================================================
NS = [1, 3, 5, 7]
cons_events = F.load_events("consensus_sweep.jsonl")
fig15 = {}
for n in NS:
    lat = np.array([e["agreement_latency_ms"] for e in cons_events
                     if e.get("profile_label") == f"consensus_n{n}"
                     and e["stage"] == "consensus_reached"])
    if len(lat) == 0:
        fig15[str(n)] = None
        continue
    q1, q3 = np.percentile(lat, 25), np.percentile(lat, 75)
    iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    outliers = int(np.sum((lat < lo) | (lat > hi)))
    fig15[str(n)] = {
        "mean": float(lat.mean()),
        "median": float(np.median(lat)),
        "std": float(lat.std(ddof=1)) if len(lat) > 1 else 0.0,
        "min": float(lat.min()),
        "max": float(lat.max()),
        "n": len(lat),
        "outliers": outliers,
    }
if fig15.get("1") and fig15.get("7"):
    r1 = fig15["1"]["mean"]
    r7 = fig15["7"]["mean"]
    out["fig15_scaling"] = {"mean_1": r1, "mean_7": r7, "ratio": r7 / r1 if r1 else 0}
out["fig15"] = fig15

# ===================================================================
# FIG 21 — SUSTAINED THROUGHPUT
# ===================================================================
evs21 = [e for e in scale_events if e.get("profile_label") == "scale_10"]
fig21 = {}
if evs21:
    t0 = next(e["timestamp_ms"] for e in evs21 if e["stage"] == "scale_start")
    mints = sorted([e["timestamp_ms"] for e in evs21 if e["stage"] == "mint_tx_confirmed"])
    window_s = 15.0
    times = np.arange(0, 120, 1.0)
    throughput = []
    for t in times:
        t_ms = t0 + t * 1000.0
        count = sum(1 for m in mints if (t_ms - window_s * 1000) <= m <= t_ms)
        throughput.append(count * (60.0 / window_s))
    throughput = np.array(throughput)

    windows = [
        ("0--20s ramp-up", 0, 20),
        ("20--40s settling", 20, 40),
        ("40--80s steady-state", 40, 80),
        ("80--120s late-phase", 80, 120),
    ]
    steady_mean = float(throughput[40:120].mean())
    for wname, ws, we in windows:
        chunk = throughput[ws:we]
        fig21[wname] = {
            "mean": float(chunk.mean()),
            "min": float(chunk.min()),
            "max": float(chunk.max()),
            "dev_pct": float(abs(chunk.mean() - steady_mean) / steady_mean * 100) if steady_mean else 0,
        }
    fig21["steady_state_40_120_mean"] = steady_mean
    fig21["annotated_steady_state"] = float(np.mean(throughput[60:]))
out["fig21"] = fig21

print(json.dumps(out, indent=2))
