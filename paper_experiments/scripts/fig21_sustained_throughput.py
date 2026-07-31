#!/usr/bin/env python3
"""fig21: sustained throughput (tx/min) over time for max load"""

import numpy as np
import matplotlib.pyplot as plt
import figstyle as F

F.setup()
events = F.load_events("scale.jsonl")

# Use scale_10 as it is the max device count available in the logs
evs = [e for e in events if e.get("profile_label") == "scale_10"]

print("\n=== fig21 summary stats ===")
if not evs:
    print("NO DATA for scale_10")
else:
    t0 = next(e["timestamp_ms"] for e in evs if e["stage"] == "scale_start")
    mints = [e["timestamp_ms"] for e in evs if e["stage"] == "mint_tx_confirmed"]
    
    # Calculate rolling throughput (tx/min)
    # Using a 15-second sliding window over the 120s trial
    window_s = 15.0
    times = np.arange(0, 120, 1.0)
    throughput = []
    
    for t in times:
        t_ms = t0 + t * 1000.0
        # Count mints in [t_ms - window, t_ms]
        count = sum(1 for m in mints if (t_ms - window_s*1000) <= m <= t_ms)
        # Scale to per-minute
        throughput.append(count * (60.0 / window_s))
        
    fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.5))
    ax.plot(times, throughput, color=F.RED, linewidth=1.5, label="Throughput")
    
    # Add a horizontal line for the mean throughput in the second half
    steady_state = np.mean(throughput[60:])
    ax.axhline(steady_state, color=F.GREY, linestyle="--", linewidth=0.8, alpha=0.8, label=f"Steady State ({steady_state:.1f} tx/min)")
    
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Throughput (tx/min)")
    ax.set_title("Sustained Throughput Under Load (10 Devices)")
    ax.set_xlim(0, 120)
    ax.set_ylim(bottom=0)
    ax.legend(loc="lower right", fontsize=6)
    
    fig.tight_layout()
    F.save(fig, "fig21_sustained_throughput")
    
    print(f"Max throughput: {max(throughput):.1f} tx/min")
    print(f"Steady throughput (last 60s): {steady_state:.1f} tx/min")
