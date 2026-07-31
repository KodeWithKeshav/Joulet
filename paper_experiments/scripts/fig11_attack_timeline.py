#!/usr/bin/env python3
"""fig11: fraud-injection timeline across 10 attack trials.
Panel (a): per-trial timeline - injection markers (by attack class) and the
consensus slash event (red X), grey dashed connector = detection window.
Panel (b): malicious oracle's stake weight (reputation) before first slash
vs after the trial's last slash (dumbbell).
Note: the codebase's penalty mechanism is the consensus engine's
reputation weight (no token staking exists in JouletToken.sol); we report
it as the stake weight it functionally is."""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F

F.setup()

ATTACK_STYLE = {
    "nighttime_generation": ("o", "#0072B2", "Nighttime gen"),
    "capacity_violation": ("s", "#E69F00", "Capacity >5kW"),
    "physics_violation": ("^", "#009E73", "Physics V·I≠P"),
    "signature_forgery": ("D", "#CC79A7", "Forged signature"),
}

events = F.load_events("attacks_trials.jsonl")

trials = {}
for e in events:
    if e["stage"] == "attack_trial_start":
        trials[e["trial"]] = {"t0": e["timestamp_ms"], "inj": [], "slashes": [],
                              "stake_before": None, "stake_after": None}

# injections: attach sig_id via the immediately following packet_submitted/attack_responses
last_inj = None
for e in events:
    st = e["stage"]
    if st == "attack_injected" and e.get("trial", -1) >= 0:
        last_inj = {"trial": e["trial"], "type": e["attack_type"],
                    "ts": e["timestamp_ms"], "sig_id": None}
        trials[e["trial"]]["inj"].append(last_inj)
    elif st == "attack_responses" and last_inj is not None and e.get("trial") == last_inj["trial"]:
        last_inj["sig_id"] = e["sig_id"]
    elif st == "packet_submitted" and e.get("forged") and last_inj is not None:
        last_inj["sig_id"] = e["sig_id"]

# consensus decisions: detection = consensus rejection of the fraud reading;
# the stake drop accompanies it unless the Byzantine node already sits at the
# 0.1 protocol floor
sig_slash = {}
for e in events:
    if e["stage"] == "consensus_reached" and not e["accepted"]:
        rb = (e.get("reputation_before") or {}).get("oracle_4")
        ra = (e.get("reputation_after") or {}).get("oracle_4")
        sig_slash[e["sig_id"]] = {"ts": e["timestamp_ms"], "before": rb, "after": ra}

fig, (ax_a, ax_b) = plt.subplots(
    1, 2, figsize=(F.DOUBLE_COL, 2.9), gridspec_kw={"width_ratios": [2.2, 1]})

det_lat = []
for trial, t in sorted(trials.items()):
    t0 = t["t0"]
    for inj in t["inj"]:
        x_inj = (inj["ts"] - t0) / 1000.0
        m, c, _ = ATTACK_STYLE[inj["type"]]
        ax_a.scatter(x_inj, trial, marker=m, s=22, color=c, zorder=3,
                     edgecolor="white", linewidth=0.4)
        s = sig_slash.get(inj["sig_id"])
        if s:
            x_sl = (s["ts"] - t0) / 1000.0
            ax_a.plot([x_inj, x_sl], [trial, trial], color=F.GREY,
                      linestyle="--", linewidth=0.7, zorder=2)
            ax_a.scatter(x_sl, trial, marker="x", s=26, color=F.RED,
                         linewidth=1.1, zorder=4)
            det_lat.append((x_sl - x_inj) * 1000.0)
            if t["stake_before"] is None:
                t["stake_before"] = s["before"]
            t["stake_after"] = s["after"]

for atype, (m, c, name) in ATTACK_STYLE.items():
    ax_a.scatter([], [], marker=m, s=22, color=c, label=name)
ax_a.scatter([], [], marker="x", s=26, color=F.RED, linewidth=1.1,
             label="Rejected + slashed")
ax_a.set_xlabel("Time since trial start (s)")
ax_a.set_ylabel("Attack trial #")
ax_a.set_yticks(range(len(trials)))
ax_a.invert_yaxis()
ax_a.legend(loc="upper center", bbox_to_anchor=(0.5, -0.15), fontsize=6, ncol=3)
ax_a.set_title("(a) Injection → slash timeline")

ys = sorted(trials)
before = [trials[k]["stake_before"] for k in ys]
after = [trials[k]["stake_after"] for k in ys]
for y, b, a in zip(ys, before, after):
    if b is None:
        continue
    ax_b.plot([b, a], [y, y], color=F.GREY, linestyle="--", linewidth=0.8)
    ax_b.scatter(b, y, s=18, color=F.BLUE, zorder=3, label="_")
    ax_b.scatter(a, y, s=22, marker="x", color=F.RED, linewidth=1.1, zorder=3)
ax_b.scatter([], [], s=18, color=F.BLUE, label="Stake before")
ax_b.scatter([], [], s=22, marker="x", color=F.RED, linewidth=1.1, label="After slashes")
ax_b.set_xlabel("Malicious oracle stake weight")
ax_b.set_yticks(ys)
ax_b.invert_yaxis()
ax_b.legend(loc="upper center", bbox_to_anchor=(0.5, -0.15), fontsize=6, framealpha=0.95, ncol=1)
ax_b.set_title("(b) Stake before/after")

fig.suptitle("Fraud injection and reputation slashing (10 trials, 4-node consensus, 1 Byzantine)",
             y=1.03, fontsize=9)
fig.tight_layout(rect=[0, 0.05, 1, 1])
F.save(fig, "fig11_attack_timeline")

print("\n=== fig11 summary stats ===")
F.stats_line("detection latency (ms)", det_lat)
F.stats_line("stake before", [b for b in before if b is not None])
F.stats_line("stake after", [a for a in after if a is not None])
n_inj = sum(len(t['inj']) for t in trials.values())
print(f"  injections={n_inj}, slashes matched={len(det_lat)}")
