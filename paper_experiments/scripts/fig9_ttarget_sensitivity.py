#!/usr/bin/env python3
"""fig9: D_t trajectory for Ttarget = 30/60/120 s under the same constant
real input stream. Blue sequential ramp encodes Ttarget magnitude; red X =
minting events; grey dashed = the theoretical steady state D* = r x Ttarget
estimated from the measured input rate.

D* is computed using the ACTIVE submission rate (first-to-last submission
interval) rather than total wall time, to avoid inflating the denominator
with idle gaps at the start/end of each sweep."""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F

F.setup()

# sequential blues: magnitude of Ttarget
TT_COLORS = {30: "#9ECAE1", 60: "#4292C6", 120: "#08519C"}

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.7))
events = F.load_events("ttarget.jsonl")

# D* label vertical offsets to avoid overlap
DSTAR_VA = {30: "top", 60: "bottom", 120: "bottom"}
DSTAR_YOFF = {30: -2, 60: 2, 120: 2}

print("\n=== fig9 summary stats ===")
for tt in (30, 60, 120):
    all_evs = [e for e in events if e.get("profile_label") == f"ttarget_{tt}"]
    if not all_evs:
        print(f"ttarget {tt}: NO DATA")
        continue
    latest_run_id = all_evs[-1]["run_id"]
    evs = [e for e in all_evs if e.get("run_id") == latest_run_id]
    t0 = next(e["timestamp_ms"] for e in evs if e["stage"] == "ttarget_start")
    adj = [(e["timestamp_ms"], e["new_difficulty"]) for e in evs
           if e["stage"] == "difficulty_adjusted"]
    mints = [e for e in evs if e["stage"] == "mint_tx_confirmed"]
    # measured input rate r (kWh/s of accepted energy) for D* line
    # Use ACTIVE period (first to last submission) to avoid idle gaps
    submitted = sorted([e for e in evs if e["stage"] == "packet_submitted"],
                       key=lambda e: e["timestamp_ms"])
    if len(submitted) >= 2:
        active_dur = (submitted[-1]["timestamp_ms"] -
                      submitted[0]["timestamp_ms"]) / 1000.0
    else:
        active_dur = (max(e["timestamp_ms"] for e in evs) - t0) / 1000.0
    kwh_total = sum(e.get("power_kw", 0) for e in submitted)
    r = kwh_total / active_dur if active_dur else 0

    ts = np.array([0] + [(a[0] - t0) / 1000.0 / 60.0 for a in adj])
    ds = np.array([5.0] + [a[1] for a in adj])  # INITIAL_DIFFICULTY = 5
    c = TT_COLORS[tt]
    ax.step(ts, ds, where="post", color=c, label=f"$T_{{target}}$={tt}s")
    ax.annotate(f"{tt}s", (ts[-1], ds[-1]), textcoords="offset points",
                xytext=(3, 0), fontsize=6.5, color=c, fontweight="bold")
    # mint events on the trajectory
    mt = [(m["timestamp_ms"] - t0) / 1000.0 / 60.0 for m in mints]
    md = np.interp(mt, ts, ds)
    ax.scatter(mt, md, marker="x", s=14, color=F.RED, linewidth=0.9, zorder=4)
    # theoretical steady state deadband for this Ttarget at measured input rate
    # Controller targets [T, 2T], so D_t will stabilize around 1.5 * r * T
    dstar_min = r * tt
    dstar_max = r * tt * 2
    dstar_mid = r * tt * 1.5

    if dstar_min <= 100:
        ax.axhline(dstar_mid, color=c, linestyle="--", linewidth=0.7, alpha=0.5)
        ax.annotate(f"D*≈{dstar_mid:.0f}",
                    (ts[-1] * 0.55, dstar_mid),
                    textcoords="offset points",
                    xytext=(0, DSTAR_YOFF[tt]),
                    fontsize=6, color=c,
                    va=DSTAR_VA[tt],
                    fontweight="bold")

    intervals = np.diff([m["timestamp_ms"] for m in mints]) / 1000.0
    print(f"ttarget {tt}: active_dur={active_dur:.1f}s, "
          f"input rate r={r:.4f} kWh/s, D*={dstar_mid:.1f}, mints={len(mints)}")
    F.stats_line("  D_t (all samples)", ds)
    F.stats_line("  mint interval (s)", intervals)

ax.scatter([], [], marker="x", s=14, color=F.RED, linewidth=0.9, label="Mint event")
ax.plot([], [], color=F.GREY, linestyle="--", linewidth=0.7, label="$D^* \\approx 1.5\\,r\\,T_{target}$")
ax.set_xlabel("Time (min)")
ax.set_ylabel("Adaptive difficulty $D_t$ (kWh)")
ax.set_title("$D_t$ trajectory vs. $T_{target}$")
ax.legend(loc="lower right", fontsize=6.2)
fig.tight_layout()
F.save(fig, "fig9_ttarget_sensitivity")
