#!/usr/bin/env python3
"""fig20: oracle uptime / eligibility (fraction of time stake > 0.1)"""

import numpy as np
import matplotlib.pyplot as plt
import figstyle as F

F.setup()
events = F.load_events("attacks_trials.jsonl")

# We will calculate this across the entire attacks_trials sequence
t0 = events[0]["timestamp_ms"]
t_end = events[-1]["timestamp_ms"]
total_dur = t_end - t0

nodes = ["oracle_1", "oracle_2", "oracle_3", "oracle_4"]
uptime_dur = {n: 0.0 for n in nodes}
last_ts = {n: t0 for n in nodes}
current_rep = {n: 1.0 for n in nodes}

for e in events:
    if e["stage"] == "consensus_reached":
        ts = e["timestamp_ms"]
        for n in nodes:
            # If the node was eligible (rep > 0.1) during the interval since last update
            if current_rep[n] > 0.101: # Use 0.101 to account for floating point at 0.1
                uptime_dur[n] += (ts - last_ts[n])
            last_ts[n] = ts
            
            if "reputation_after" in e and n in e["reputation_after"]:
                current_rep[n] = e["reputation_after"][n]

# Add final segment
for n in nodes:
    if current_rep[n] > 0.101:
        uptime_dur[n] += (t_end - last_ts[n])

uptime_pct = {n: (uptime_dur[n] / total_dur) * 100 for n in nodes}

print("\n=== fig20 summary stats ===")
for n in nodes:
    print(f"{n} uptime: {uptime_pct[n]:.2f}%")

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.5))
colors = [F.BLUE, F.BLUE, F.BLUE, F.RED]

ax.bar(nodes, [uptime_pct[n] for n in nodes], color=colors, edgecolor="white", width=0.5)

for i, n in enumerate(nodes):
    ax.annotate(f"{uptime_pct[n]:.1f}%", (i, uptime_pct[n]), textcoords="offset points", xytext=(0, 4), ha="center", fontsize=7)

ax.set_ylabel("Uptime / Eligibility (%)")
ax.set_title("Oracle Node Eligibility (Aggregate Across 10 Trials)")
ax.set_ylim(0, 115)
fig.tight_layout()
F.save(fig, "fig20_uptime_by_node")
