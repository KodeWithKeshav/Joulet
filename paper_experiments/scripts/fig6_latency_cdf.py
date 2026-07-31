#!/usr/bin/env python3
"""fig6: CDF of end-to-end latency (packet signed -> mint tx confirmed on
chain) per generation profile, with p50/p95/p99 annotations."""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F
from pipeline import group_runs, pipeline_records

F.setup()

e2e = {}
for prof in F.PROFILE_ORDER:
    events = F.load_events(f"profiles_{prof}.jsonl")
    vals = []
    for rid, evs in group_runs(events).items():
        readings, _ = pipeline_records(evs)
        vals += [r["e2e_ms"] / 1000.0 for r in readings.values()
                 if r.get("e2e_ms") is not None and r.get("accepted")]
    e2e[prof] = np.sort(np.array(vals))

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.6))
for prof in F.PROFILE_ORDER:
    v = e2e[prof]
    if len(v) == 0:
        continue
    y = np.arange(1, len(v) + 1) / len(v)
    c = F.PROFILE_COLORS[prof]
    ax.plot(v, y, color=c, label=F.PROFILE_NAMES[prof])

pooled = np.sort(np.concatenate([e2e[p] for p in F.PROFILE_ORDER if len(e2e[p])]))
for q, ls in ((50, ":"), (95, "--"), (99, "-.")):
    val = np.percentile(pooled, q)
    ax.axvline(val, color=F.GREY, linestyle=ls, linewidth=0.8)
    ax.annotate(f"p{q}={val:.1f}s", (val, 0.4), rotation=90, fontsize=6,
                color=F.MUTED, textcoords="offset points", xytext=(2, 0),
                va="center")

ax.set_xlabel("Per-reading inclusion latency (s)")
ax.set_ylabel("CDF")
ax.set_ylim(0, 1.02)
ax.set_xlim(left=0)
ax.legend(loc="lower right", fontsize=6.5)
ax.set_title("End-to-end latency CDF by profile")
fig.tight_layout()
F.save(fig, "fig6_latency_cdf")

print("\n=== fig6 summary stats (s) ===")
for prof in F.PROFILE_ORDER:
    F.stats_line(prof, e2e[prof])
F.stats_line("POOLED", pooled)
