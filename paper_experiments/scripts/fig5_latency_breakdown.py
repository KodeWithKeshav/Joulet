#!/usr/bin/env python3
"""fig5: stacked bar of mean per-stage pipeline latency per generation profile.

Panel (a): full pipeline in seconds (dominated by ARD batch-accumulation wait).
Panel (b): zoom on the millisecond-scale processing stages.
"""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F
from pipeline import group_runs, pipeline_records

F.setup()

STAGES_MS = [
    ("sign_ms", "ECDSA sign", "#88BBDD"),
    ("transport_ms", "Transport", "#4292C6"),
    ("validate_ms", "Oracle validate", F.BLUE),
    ("consensus_ms", "Consensus", "#08519C"),
    ("mint_confirm_ms", "Mint tx confirm", F.RED),
]
WAIT = ("batch_wait_ms", "ARD batch accumulation", F.ORANGE)
per_profile = {}
for prof in F.PROFILE_ORDER:
    events = F.load_events(f"profiles_{prof}.jsonl")
    stage_vals = {k: [] for k, _, _ in STAGES_MS}
    stage_vals[WAIT[0]] = []
    for rid, evs in group_runs(events).items():
        readings, _ = pipeline_records(evs)
        for rec in readings.values():
            if not rec.get("accepted"):
                continue
            for k, _, _ in STAGES_MS:
                if rec.get(k) is not None:
                    stage_vals[k].append(rec[k])
            if rec.get(WAIT[0]) is not None:
                stage_vals[WAIT[0]].append(rec[WAIT[0]])
    per_profile[prof] = stage_vals

fig, (ax_a, ax_b) = plt.subplots(1, 2, figsize=(F.DOUBLE_COL, 2.4))
x = np.arange(len(F.PROFILE_ORDER))
labels = [F.PROFILE_NAMES[p] for p in F.PROFILE_ORDER]

# ---- panel (a): full pipeline (seconds), incl. batch wait ----
bottom = np.zeros(len(x))
for key, name, color in STAGES_MS + [WAIT]:
    means = np.array([np.mean(per_profile[p][key]) / 1000.0 if per_profile[p][key] else 0
                      for p in F.PROFILE_ORDER])
    ax_a.bar(x, means, 0.55, bottom=bottom, color=color, label=name,
             edgecolor="white", linewidth=0.8)
    bottom += means
for xi, tot in zip(x, bottom):
    ax_a.annotate(f"{tot:.1f}s", (xi, tot), textcoords="offset points",
                  xytext=(0, 2), ha="center", fontsize=6.5, color=F.INK)
ax_a.set_xticks(x, labels)
ax_a.set_ylabel("Mean latency (s)")
ax_a.set_title("(a) Per-reading inclusion latency")

# ---- panel (b): processing stages only (ms) ----
bottom = np.zeros(len(x))
for key, name, color in STAGES_MS:
    means = np.array([np.mean(per_profile[p][key]) if per_profile[p][key] else 0
                      for p in F.PROFILE_ORDER])
    ax_b.bar(x, means, 0.55, bottom=bottom, color=color,
             edgecolor="white", linewidth=0.8)
    bottom += means
for xi, tot in zip(x, bottom):
    ax_b.annotate(f"{tot:.0f}ms", (xi, tot), textcoords="offset points",
                  xytext=(0, 2), ha="center", fontsize=6.5, color=F.INK)
ax_b.set_xticks(x, labels)
ax_b.set_ylabel("Mean latency (ms)")
ax_b.set_title("(b) Processing stages only (excl. accumulation)")

handles, lab = ax_a.get_legend_handles_labels()
fig.suptitle("Per-stage pipeline latency by generation profile", y=1.05, fontsize=9)
fig.legend(handles, lab, loc="upper center", bbox_to_anchor=(0.5, -0.02),
           ncols=3, fontsize=6.2, frameon=False, columnspacing=1.0,
           handlelength=1.2)
fig.tight_layout(rect=[0, 0.05, 1, 1])
F.save(fig, "fig5_latency_breakdown")

print("\n=== fig5 summary stats (ms) ===")
for prof in F.PROFILE_ORDER:
    print(f"{prof}:")
    for key, name, _ in STAGES_MS + [WAIT]:
        F.stats_line(name, per_profile[prof][key])
