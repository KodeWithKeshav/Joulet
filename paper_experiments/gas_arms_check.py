#!/usr/bin/env python3
"""
Recomputes the "hourly gas in quorum mode" table (paper Table IV) and the
measured gas per transaction of each arm from data/gas_comparison.jsonl,
using exactly the filter of scripts/fig8_gas_comparison_errorbars.py
(a trial is clean if it logged at least 100 readings).

    python gas_arms_check.py

Facts it makes explicit (they are easy to miss in the figure script):
  * every trial is 120 s long at 1 reading/s; "gas per hour" is the
    120 s total multiplied by 3600/120, not an hour-long measurement;
  * gas per transaction differs between arms (the ARD arm carries a Merkle
    root and more state writes), so a single "g" is an assumption;
  * the energy unit is the accumulator unit of the testbed (the sum of
    per-reading Power_kW values; at 1 reading/s this equals kJ).
"""
import json
import os
from collections import defaultdict

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "gas_comparison.jsonl")
OUT = os.path.join(HERE, "results")
ARMS = [("gas_direct", "Direct Push"), ("gas_static", "Static Batch"), ("gas_ard", "Joulet ARD")]


def main():
    ev = [json.loads(l) for l in open(DATA, encoding="utf-8") if l.strip()]
    res = {}
    for label, name in ARMS:
        trials = defaultdict(lambda: {"gas": 0, "tx": 0, "kwh": 0.0, "dur": None, "readings": 0, "gas_list": []})
        for e in ev:
            if e.get("profile_label") != label:
                continue
            t = trials[e["run_id"]]
            if e["stage"] == "mint_tx_confirmed":
                t["gas"] += e["gas_used"]
                t["tx"] += 1
                t["kwh"] += e.get("kwh", 0.0)
                t["gas_list"].append(e["gas_used"])
            elif e["stage"] == "gas_arm_end":
                t["dur"] = e["elapsed_s"]
                t["readings"] = e.get("readings", 0)
        clean = {k: v for k, v in trials.items() if v["readings"] >= 100 and v["dur"] and v["tx"]}
        all_gas = [g for v in clean.values() for g in v["gas_list"]]
        gph = [v["gas"] * 3600.0 / v["dur"] for v in clean.values()]
        gpk = [v["gas"] / v["kwh"] for v in clean.values()]
        res[label] = {
            "name": name, "trials_total": len(trials), "trials_clean": len(clean),
            "readings_per_clean_trial": sorted(v["readings"] for v in clean.values()),
            "readings_per_excluded_trial": sorted(v["readings"] for k, v in trials.items() if k not in clean),
            "duration_s": sorted(round(v["dur"], 1) for v in clean.values()),
            "tx_per_clean_trial": sorted(v["tx"] for v in clean.values()),
            "gas_per_hour_mean": float(np.mean(gph)), "gas_per_hour_sd": float(np.std(gph, ddof=1)),
            "gas_per_unit_energy_mean": float(np.mean(gpk)),
            "gas_per_tx_mean": float(np.mean(all_gas)), "gas_per_tx_sd": float(np.std(all_gas, ddof=1)),
            "gas_per_tx_first": int(all_gas[0]) if all_gas else None,
        }
    base = res["gas_direct"]["gas_per_hour_mean"]
    for r in res.values():
        r["reduction_vs_direct_pct"] = 100.0 * (1.0 - r["gas_per_hour_mean"] / base)
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "gas_arms_check.json"), "w") as f:
        json.dump(res, f, indent=2)
    print("| arm | clean/total | gas/h (mean +- SD) | gas/unit energy | reduction | gas per tx (mean +- SD) |")
    print("|---|---|---|---|---|---|")
    for r in res.values():
        print(f"| {r['name']} | {r['trials_clean']}/{r['trials_total']} | "
              f"{r['gas_per_hour_mean']:,.0f} +- {r['gas_per_hour_sd']:,.0f} | {r['gas_per_unit_energy_mean']:,.0f} | "
              f"{r['reduction_vs_direct_pct']:.2f}% | {r['gas_per_tx_mean']:,.0f} +- {r['gas_per_tx_sd']:,.0f} |")
    print()
    for r in res.values():
        print(r["name"], "durations", r["duration_s"], "tx", r["tx_per_clean_trial"],
              "readings(clean)", r["readings_per_clean_trial"], "readings(excluded)", r["readings_per_excluded_trial"])
    s, d, a = (res[k] for k in ("gas_static", "gas_direct", "gas_ard"))
    print()
    print("ARD vs Static Batch (gas/h): %.1f%% lower" % (100 * (1 - a["gas_per_hour_mean"] / s["gas_per_hour_mean"])))
    print("ARD vs Static Batch (gas per unit energy): %.1f%% lower" %
          (100 * (1 - a["gas_per_unit_energy_mean"] / s["gas_per_unit_energy_mean"])))


if __name__ == "__main__":
    main()
