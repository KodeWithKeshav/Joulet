#!/usr/bin/env python3
"""fig10: stability of the ARD update law.
Panel (a): return map D_{t+1} vs D_t (all difficulty adjustments, all trials,
colored by profile) with the identity line.
Panel (b): Lyapunov function V(D_t) = (D_t - D*)^2 / D*^2 vs adjustment index,
mean across trials per profile (log scale)."""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F
from pipeline import group_runs

F.setup()

fig, (ax_a, ax_b) = plt.subplots(1, 2, figsize=(F.DOUBLE_COL, 2.7))

print("\n=== fig10 summary stats ===")
for prof in F.PROFILE_ORDER:
    events = F.load_events(f"profiles_{prof}.jsonl")
    c = F.PROFILE_COLORS[prof]
    all_pairs = []
    v_series = []
    for rid, evs in group_runs(events).items():
        seq = [e for e in evs if e["stage"] == "difficulty_adjusted"]
        if len(seq) < 4:
            continue
        d = np.array([5.0] + [e["new_difficulty"] for e in seq])
        all_pairs += list(zip(d[:-1], d[1:]))
        dstar = np.median(d[max(1, len(d) * 2 // 3):])
        v_series.append((d - dstar) ** 2 / dstar ** 2)
    if not all_pairs:
        continue
    p = np.array(all_pairs)
    ax_a.scatter(p[:, 0], p[:, 1], s=7, color=c, alpha=0.55,
                 edgecolor="white", linewidth=0.2, label=F.PROFILE_NAMES[prof])
    # panel b: mean V across trials, truncated to the median trial length so
    # the tail is not an average over a shrinking survivor set
    L = int(np.median([len(v) for v in v_series]))
    V = np.full((len(v_series), L), np.nan)
    for i, v in enumerate(v_series):
        V[i, :min(L, len(v))] = v[:L]
    mv = np.nanmean(V, axis=0)
    ax_b.plot(np.arange(L), np.maximum(mv, 1e-6), color=c,
              label=F.PROFILE_NAMES[prof])
    # Offset inline labels vertically to prevent collision
    y_offset = {"A_high": -4, "B_low": 8, "C_volatile": 0, "D_ramp": -6}.get(prof, 0)
    ax_b.annotate(F.PROFILE_NAMES[prof].split(":")[0],
                  (L - 1, max(mv[-1], 1e-6)), textcoords="offset points",
                  xytext=(6, y_offset), fontsize=6.5, color=c, fontweight="bold")
    contraction = np.mean(np.abs(p[:, 1] - np.median(p[:, 1])) <=
                          np.abs(p[:, 0] - np.median(p[:, 1])))
    print(f"{prof}: {len(p)} transitions, fraction non-expanding={contraction:.3f}")
    F.stats_line("  V(D_t) final third", np.concatenate(
        [v[len(v) * 2 // 3:] for v in v_series]))

lim = (0, 105)
ax_a.plot(lim, lim, color=F.GREY, linestyle="--", linewidth=0.8, label="$D_{t+1}=D_t$")
ax_a.set_xlim(lim); ax_a.set_ylim(lim)
ax_a.set_xlabel("$D_t$ (kWh)")
ax_a.set_ylabel("$D_{t+1}$ (kWh)")
ax_a.set_title("(a) Return map of difficulty updates")
ax_a.legend(loc="upper left", fontsize=6.2)

ax_b.set_yscale("log")
ax_b.set_xlabel("Adjustment index $t$")
ax_b.set_ylabel("$V(D_t)=(D_t-D^*)^2/D^{*2}$")
ax_b.set_title("(b) Lyapunov function decay (mean of 10 trials)")

fig.tight_layout()
F.save(fig, "fig10_lyapunov_phase_portrait")
