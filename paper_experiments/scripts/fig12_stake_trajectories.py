#!/usr/bin/env python3
"""fig12: oracle stake-weight (reputation) trajectories over a continuous
240 s run with honest traffic + periodic fraud injections; 3 honest nodes vs
1 Byzantine node. Red X marks slash events on the malicious trajectory;
grey dashed line = protocol floor (0.1)."""

import matplotlib.pyplot as plt

import figstyle as F

F.setup()

events = F.load_events("attacks_long.jsonl")
t0 = next(e["timestamp_ms"] for e in events if e["stage"] == "attack_long_start")

HONEST = {"oracle_1": "#0072B2", "oracle_2": "#4292C6", "oracle_3": "#88BBDD"}
MAL = "oracle_4"

traj = {n: [(0.0, 1.0)] for n in list(HONEST) + [MAL]}
slashes = []
for e in events:
    if e["stage"] != "consensus_reached":
        continue
    ts = (e["timestamp_ms"] - t0) / 1000.0
    for n, v in (e.get("reputation_after") or {}).items():
        if n in traj:
            traj[n].append((ts, v))
    rb = (e.get("reputation_before") or {}).get(MAL)
    ra = (e.get("reputation_after") or {}).get(MAL)
    if rb is not None and ra is not None and ra < rb:
        slashes.append((ts, ra))

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.6))
for n, c in HONEST.items():
    xs, ys = zip(*traj[n])
    ax.step(xs, ys, where="post", color=c, linewidth=1.0, label=f"Honest {n}")
xs, ys = zip(*traj[MAL])
ax.step(xs, ys, where="post", color=F.RED, linewidth=1.4, label=f"Byzantine {MAL}")
if slashes:
    sx, sy = zip(*slashes)
    ax.scatter(sx, sy, marker="x", s=20, color=F.RED, linewidth=1.0, zorder=4,
               label="Slash event")
ax.axhline(0.1, color=F.GREY, linestyle="--", linewidth=0.8)
ax.annotate("stake floor 0.1", (2, 0.11), fontsize=6, color=F.GREY)

ax.annotate("honest", (xs[-1] * 0.75, 1.01), fontsize=6.5, color="#0072B2",
            fontweight="bold")
ax.annotate("malicious", (max(5, xs[-1] * 0.35), 0.35), fontsize=6.5,
            color=F.RED, fontweight="bold")

ax.set_xlabel("Time (s)")
ax.set_ylabel("Stake weight (reputation)")
ax.set_ylim(0, 1.1)
ax.legend(loc="center right", fontsize=6)
ax.set_title("Stake trajectories: honest vs. Byzantine oracle")
fig.tight_layout()
F.save(fig, "fig12_stake_trajectories")

print("\n=== fig12 summary stats ===")
print(f"  slash events: {len(slashes)}")
for n in traj:
    final = traj[n][-1][1]
    print(f"  {n}: final stake={final:.2f} (from 1.00)")
if slashes:
    F.stats_line("slash inter-arrival (s)",
                 [b - a for (a, _), (b, _) in zip(slashes, slashes[1:])])
