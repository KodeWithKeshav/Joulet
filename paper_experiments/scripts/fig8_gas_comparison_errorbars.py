#!/usr/bin/env python3
"""fig8: on-chain gas cost of Direct Push vs Static Batch (10 kJ fixed
threshold) vs Joulet ARD, identical real input stream (realistic_sunny.csv,
1 reading/s, 120 s x 5 trials each). Gas from real hardhat receipts.

NOTE: 3 of the 8 trials per arm logged fewer than 100 readings (16-80 instead of
~116; dropped packets / timing anomalies) and are excluded by the filter below, which
leaves N=5 clean trials per arm. Energy unit: the accumulator adds Power_kW per reading,
i.e. kJ at 1 reading/s. Trials last 120 s; 'gas per hour' extrapolates x3600/duration.
Degraded trials are excluded to avoid
mixing protocol-cost measurement with infrastructure instability."""

from collections import defaultdict

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F

F.setup()

ARMS = [("gas_direct", "Direct Push", "#88BBDD"),
        ("gas_static", "Static Batch (10 kJ)", "#4292C6"),
        ("gas_ard", "Joulet ARD", F.ORANGE)]

# (79, 16, 38 readings instead of ~116 for Direct Push).

events = F.load_events("gas_comparison.jsonl")

per_arm = {}
excluded_counts = {}
for label, name, _ in ARMS:
    trials = defaultdict(lambda: {"gas": 0, "tx": 0, "kwh": 0.0, "dur": None,
                                  "readings": 0})
    for e in events:
        if e.get("profile_label") != label:
            continue
        rid = e.get("run_id")
        if e["stage"] == "mint_tx_confirmed":
            trials[rid]["gas"] += e["gas_used"]
            trials[rid]["tx"] += 1
            trials[rid]["kwh"] += e.get("kwh", 0)
        elif e["stage"] == "gas_arm_end":
            trials[rid]["dur"] = e["elapsed_s"]
            trials[rid]["readings"] = e.get("readings", 0)
    rows = []
    excluded = 0
    for rid, t in trials.items():
        # Filter: only include clean trials (>= 100 readings)
        if t["readings"] < 100:
            excluded += 1
            continue
        if t["dur"] and t["tx"]:
            rows.append({"gas_per_hour": t["gas"] * 3600.0 / t["dur"],
                         "tx_per_min": t["tx"] * 60.0 / t["dur"],
                         "gas_per_kwh": t["gas"] / t["kwh"] if t["kwh"] else np.nan,
                         "gas_per_tx": t["gas"] / t["tx"],
                         "readings": t["readings"],
                         "dur": t["dur"]})
    per_arm[label] = rows
    excluded_counts[label] = excluded

fig, (ax_a, ax_b) = plt.subplots(1, 2, figsize=(F.DOUBLE_COL, 2.5))
x = np.arange(len(ARMS))

for ax, metric, ylab, title, scale in (
        (ax_a, "gas_per_hour", "Gas per hour ($\\times 10^6$)", "(a) Gas consumption rate", 1e6),
        (ax_b, "gas_per_kwh", "Gas per kJ minted", "(b) Gas per verified kJ", 1)):
    means, stds = [], []
    for label, _, _ in ARMS:
        vals = [r[metric] for r in per_arm[label]]
        means.append(np.mean(vals) / scale if vals else 0)
        stds.append(np.std(vals, ddof=1) / scale if len(vals) > 1 else 0)
    bars = ax.bar(x, means, 0.55, yerr=stds, capsize=3,
                  color=[c for _, _, c in ARMS], edgecolor="white",
                  error_kw=dict(elinewidth=0.9, ecolor=F.INK))
    for xi, m, s in zip(x, means, stds):
        ax.annotate(f"{m:,.2f}" if scale > 1 else f"{m:,.0f}",
                    (xi, m + s), textcoords="offset points", xytext=(0, 3),
                    ha="center", fontsize=6.5, color=F.INK)
    ax.set_xticks(x, [n for _, n, _ in ARMS], fontsize=6.8)
    ax.set_ylabel(ylab)
    ax.set_title(title)

n_clean = len(per_arm["gas_direct"])
fig.suptitle(f"On-chain reporting cost: strategy comparison "
             f"(mean ± SD, N={n_clean} clean trials)",
             y=1.04, fontsize=9)
fig.tight_layout()
F.save(fig, "fig8_gas_comparison_errorbars")

print("\n=== fig8 summary stats ===")
for label, name, _ in ARMS:
    print(f"{name} (excluded {excluded_counts[label]} degraded trials):")
    for r in per_arm[label]:
        print(f"  readings={r['readings']}, dur={r['dur']:.1f}s")
    for metric in ("gas_per_hour", "tx_per_min", "gas_per_kwh", "gas_per_tx"):
        F.stats_line(metric, [r[metric] for r in per_arm[label]])
