#!/usr/bin/env python3
"""fig7: box plot of ARD difficulty convergence time per profile across the
10 trials. Convergence = first instant after which D_t stays within +/-25%
of the trial's steady-state difficulty (median over the last third of the
trial) for the remainder of the trial."""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F
from pipeline import group_runs

F.setup()

BAND = 0.25

conv = {p: [] for p in F.PROFILE_ORDER}
for prof in F.PROFILE_ORDER:
    events = F.load_events(f"profiles_{prof}.jsonl")
    for rid, evs in group_runs(events).items():
        t0 = next((e["timestamp_ms"] for e in evs if e["stage"] == "trial_start"), None)
        t_end = max(e["timestamp_ms"] for e in evs)
        adj = [(e["timestamp_ms"], e["new_difficulty"]) for e in evs
               if e["stage"] == "difficulty_adjusted"]
        if t0 is None or len(adj) < 4:
            continue
        times = np.array([a[0] for a in adj])
        diffs = np.array([a[1] for a in adj])
        # steady state = median difficulty over last third of the trial
        tail = diffs[times >= t0 + (t_end - t0) * 2 / 3]
        if len(tail) == 0:
            tail = diffs[-3:]
        dstar = np.median(tail)
        inside = np.abs(diffs - dstar) <= BAND * dstar
        # first index from which all subsequent samples remain in band
        k = len(diffs)
        for i in range(len(diffs) - 1, -1, -1):
            if inside[i]:
                k = i
            else:
                break
        if k == len(diffs):
            continue  # never converged within trial
        conv[prof].append((times[k] - t0) / 1000.0)

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.6))
data = [conv[p] for p in F.PROFILE_ORDER]
bp = ax.boxplot(data, tick_labels=[F.PROFILE_NAMES[p] for p in F.PROFILE_ORDER],
                patch_artist=True, widths=0.5,
                medianprops=dict(color=F.INK, linewidth=1.2),
                flierprops=dict(marker="o", markersize=3, markerfacecolor="none",
                                markeredgecolor=F.MUTED, markeredgewidth=0.6))
for patch, prof in zip(bp["boxes"], F.PROFILE_ORDER):
    patch.set_facecolor(F.PROFILE_COLORS[prof])
    patch.set_alpha(0.55)
    patch.set_edgecolor(F.PROFILE_COLORS[prof])
# overlay individual trials
rng = np.random.default_rng(0)
for i, prof in enumerate(F.PROFILE_ORDER):
    xs = 1 + i + rng.uniform(-0.10, 0.10, len(conv[prof]))
    ax.scatter(xs, conv[prof], s=6, color=F.PROFILE_COLORS[prof], zorder=3,
               edgecolor="white", linewidth=0.3)

ax.set_ylabel("Convergence time of $D_t$ (s)")
ax.margins(y=0.1)
ax.set_title(f"ARD convergence time (±{int(BAND*100)}% band), N=10 trials")
fig.tight_layout()
F.save(fig, "fig7_convergence_boxplot")

print("\n=== fig7 summary stats (s) ===")
for prof in F.PROFILE_ORDER:
    F.stats_line(prof, conv[prof])
