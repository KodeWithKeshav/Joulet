#!/usr/bin/env python3
"""fig13: scalability vs number of concurrent simulated inverters
(1/5/10/20, each 1 reading per 2 s, 120 s per level).
Panel (a): verified-reading and mint-tx throughput. Panel (b): gas per hour."""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F

F.setup()

LEVELS = [1, 5, 10, 20]
events = F.load_events("scale.jsonl")

rows = []
print("\n=== fig13 summary stats ===")
for n in LEVELS:
    label = f"scale_{n:02d}"
    evs = [e for e in events if e.get("profile_label") == label]
    if not evs:
        print(f"{label}: NO DATA")
        continue
    t_start = next(e["timestamp_ms"] for e in evs if e["stage"] == "scale_start")
    t_end = next(e["timestamp_ms"] for e in evs if e["stage"] == "scale_end")
    dur_min = (t_end - t_start) / 60000.0
    accepted = [e for e in evs if e["stage"] == "consensus_reached" and e["accepted"]]
    submitted = [e for e in evs if e["stage"] == "packet_submitted"]
    mints = [e for e in evs if e["stage"] == "mint_tx_confirmed"]
    gas = sum(e["gas_used"] for e in mints)
    lat = [e["agreement_latency_ms"] for e in accepted]
    rows.append({
        "n": n,
        "submitted_per_min": len(submitted) / dur_min,
        "verified_per_min": len(accepted) / dur_min,
        "tx_per_min": len(mints) / dur_min,
        "gas_per_hour": gas * 60.0 / dur_min,
    })
    print(f"{label}: submitted/min={rows[-1]['submitted_per_min']:.1f} "
          f"verified/min={rows[-1]['verified_per_min']:.1f} "
          f"mint tx/min={rows[-1]['tx_per_min']:.2f} "
          f"gas/hour={rows[-1]['gas_per_hour']:,.0f}")
    F.stats_line("  agreement latency (ms)", lat)

ns = [r["n"] for r in rows]
fig, (ax_a, ax_b) = plt.subplots(1, 2, figsize=(F.DOUBLE_COL, 2.5))

ax_a.plot(ns, [r["verified_per_min"] for r in rows], marker="o", markersize=4,
          color=F.BLUE, label="Verified readings/min")
ax_a.plot(ns, [r["submitted_per_min"] for r in rows], marker="s", markersize=4,
          color=F.GREY, linestyle="--", label="Offered load/min")
ax_a.plot(ns, [r["tx_per_min"] for r in rows], marker="x", markersize=6,
          markeredgewidth=1.2, color=F.RED, label="Mint tx/min")
for r in rows:
    ax_a.annotate(f"{r['verified_per_min']:.0f}", (r["n"], r["verified_per_min"]),
                  textcoords="offset points", xytext=(0, 4), ha="center",
                  fontsize=6, color=F.BLUE)
ax_a.set_xticks(ns)
ax_a.set_xlabel("Concurrent inverters")
ax_a.set_ylabel("Events per minute")
ax_a.legend(fontsize=6.2)
ax_a.set_title("(a) Throughput")

ax_b.bar(range(len(ns)), [r["gas_per_hour"] / 1e6 for r in rows], 0.55,
         color=F.ORANGE, edgecolor="white")
for i, r in enumerate(rows):
    ax_b.annotate(f"{r['gas_per_hour']/1e6:.2f}", (i, r["gas_per_hour"] / 1e6),
                  textcoords="offset points", xytext=(0, 3), ha="center",
                  fontsize=6.5, color=F.INK)
ax_b.set_xticks(range(len(ns)), [str(n) for n in ns])
ax_b.set_xlabel("Concurrent inverters")
ax_b.set_ylabel("Gas per hour ($\\times 10^6$)")
ax_b.set_title("(b) On-chain gas rate")

fig.suptitle("Scalability with concurrent devices (ARD batching, 3-oracle consensus)",
             y=1.04, fontsize=9)
fig.tight_layout()
F.save(fig, "fig13_scalability_throughput")
