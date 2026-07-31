#!/usr/bin/env python3
"""fig18: trust score (stake weight) over time for honest vs malicious nodes"""

import matplotlib.pyplot as plt
import figstyle as F

F.setup()
events = F.load_events("attacks_trials.jsonl")

# We will plot the trajectory of Trial 0 to show a continuous sequence
# without the resets between trials.
trial_events = [e for e in events if e.get("trial") == 0 or (e.get("run_id", "").endswith("t00"))]

if not trial_events:
    print("No events found for Trial 0")
    exit()

t0 = trial_events[0]["timestamp_ms"]

HONEST = {"oracle_1": "#0072B2", "oracle_2": "#4292C6", "oracle_3": "#88BBDD"}
MAL = "oracle_4"

traj = {n: [(0.0, 1.0)] for n in list(HONEST) + [MAL]}

for e in trial_events:
    if e["stage"] == "consensus_reached":
        ts = (e["timestamp_ms"] - t0) / 1000.0  # in seconds
        for n, v in (e.get("reputation_after") or {}).items():
            if n in traj:
                traj[n].append((ts, v))

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.5))
for n, c in HONEST.items():
    xs, ys = zip(*traj[n])
    ax.step(xs, ys, where="post", color=c, linewidth=1.0, label=f"Honest {n}")

xs, ys = zip(*traj[MAL])
ax.step(xs, ys, where="post", color=F.RED, linewidth=1.4, label=f"Byzantine {MAL}")

ax.axhline(0.1, color=F.GREY, linestyle="--", linewidth=0.8)
ax.annotate("stake floor 0.1", (0.5, 0.12), fontsize=6, color=F.GREY)

ax.set_xlabel("Time since trial start (s)")
ax.set_ylabel("Trust Score (Stake Weight)")
ax.set_ylim(0, 1.1)
ax.legend(loc="lower left", fontsize=6)
ax.set_title("Oracle Trust Score (Trial 0 of 10 — Representative Run)")

fig.tight_layout()
F.save(fig, "fig18_trust_score_over_time")

print("\n=== fig18 summary stats ===")
for n in traj:
    print(f"{n} final trust score: {traj[n][-1][1]:.2f}")
