#!/usr/bin/env python3
"""fig15: consensus agreement latency (first vote arrival -> decision) vs
number of oracle nodes (quorum = n), 90 s of real traffic per level."""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F

F.setup()

NS = [1, 3, 5, 7]
BLUES = {1: "#C6DBEF", 3: "#9ECAE1", 5: "#4292C6", 7: "#08519C"}

events = F.load_events("consensus_sweep.jsonl")

data = {}
for n in NS:
    lat = [e["agreement_latency_ms"] for e in events
           if e.get("profile_label") == f"consensus_n{n}"
           and e["stage"] == "consensus_reached"]
    data[n] = np.array(lat)

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.6))
present = [n for n in NS if len(data[n])]
bp = ax.boxplot([data[n] for n in present],
                tick_labels=[str(n) for n in present], patch_artist=True,
                widths=0.5, medianprops=dict(color=F.INK, linewidth=1.2),
                flierprops=dict(marker="o", markersize=2.5,
                                markerfacecolor="none",
                                markeredgecolor=F.MUTED, markeredgewidth=0.5))
for patch, n in zip(bp["boxes"], present):
    patch.set_facecolor(BLUES[n])
    patch.set_edgecolor("#08519C")
    patch.set_alpha(0.8)
means = [data[n].mean() for n in present]
ax.plot(range(1, len(present) + 1), means, color=F.RED, marker="x",
        markersize=6, markeredgewidth=1.2, linewidth=0.9, label="Mean")
for i, (n, m) in enumerate(zip(present, means)):
    ax.annotate(f"{m:.0f} ms", (i + 1, m), textcoords="offset points",
                xytext=(6, 2), fontsize=6.5, color=F.RED)

ax.set_xlabel("Number of oracle nodes (quorum = n)")
ax.set_ylabel("Agreement latency (ms)")
ax.set_title("Consensus agreement latency vs. oracle count")
ax.legend(fontsize=6.5)
fig.tight_layout()
F.save(fig, "fig15_consensus_latency")

print("\n=== fig15 summary stats (ms) ===")
for n in present:
    F.stats_line(f"n={n}", data[n])
