#!/usr/bin/env python3
"""fig19: ARD tracking error boxplot (MAE/RMSE)"""

import numpy as np
import matplotlib.pyplot as plt
from collections import defaultdict
import figstyle as F

F.setup()

TARGET = 15.0
data = []

print("\n=== fig19 summary stats ===")
for prof in F.PROFILE_ORDER:
    events = F.load_events(f"profiles_{prof}.jsonl")
    by_run = defaultdict(list)
    for e in events:
        if e["stage"] == "mint_tx_confirmed":
            by_run[e["run_id"]].append(e["timestamp_ms"])
    
    errors = []
    for rid, ts in by_run.items():
        ts = sorted(ts)
        intervals = [(ts[i+1]-ts[i])/1000.0 for i in range(len(ts)-1)]
        errors.extend([i - TARGET for i in intervals])
    
    if errors:
        errors = np.array(errors)
        mae = np.mean(np.abs(errors))
        rmse = np.sqrt(np.mean(errors**2))
        print(f"{prof}: MAE={mae:.2f}s, RMSE={rmse:.2f}s, n={len(errors)}")
        data.append((prof, mae, rmse, errors))

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.5))
bp = ax.boxplot([d[3] for d in data], tick_labels=[F.PROFILE_NAMES[d[0]] for d in data],
                patch_artist=True, widths=0.5,
                medianprops=dict(color=F.INK, linewidth=1.2),
                flierprops=dict(marker="o", markersize=3, markerfacecolor="none",
                                markeredgecolor=F.MUTED, markeredgewidth=0.6))

for patch, d in zip(bp["boxes"], data):
    prof = d[0]
    patch.set_facecolor(F.PROFILE_COLORS[prof])
    patch.set_alpha(0.55)
    patch.set_edgecolor(F.PROFILE_COLORS[prof])

ax.axhline(0, color=F.GREY, linestyle="--", linewidth=0.8)

# Calculate dynamic y-position for annotations based on axis limits
y_min, y_max = ax.get_ylim()
y_pos = y_max * 0.75 if y_max > 0 else 0

for i, d in enumerate(data):
    ax.annotate(f"MAE: {d[1]:.1f}s\nRMSE: {d[2]:.1f}s", (i+1, y_pos),
                ha="center", fontsize=6, color=F.INK, 
                bbox=dict(facecolor='white', alpha=0.8, edgecolor='none', pad=1))

ax.set_ylabel(f"Tracking Error (s) vs $T_{{target}}$={TARGET}s")
ax.set_title(f"ARD Tracking Error (Accelerated $T_{{target}}={TARGET}s$ Stress Test)")

fig.tight_layout()
F.save(fig, "fig19_ard_tracking_error")
