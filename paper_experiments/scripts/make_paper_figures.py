#!/usr/bin/env python3
"""
IEEE single-column export of the two paper figures behind this revision:

  fig_ard_profiles        2x2 ARD response (Generation vs Difficulty D_t,
                           mint markers), reference simulator.
  fig8_gas_comparison_kJ  gas cost comparison, Direct Push / Static Batch /
                           Joulet ARD, from real hardhat logs.

This script changes NO experiment, controller, or data logic:
  - the ARD figure imports power_profile/price_ratio/run_policy/stats and
    every constant (T_TGT, D_MIN, D_MAX, D_0, M_MIN, M_MAX, T_RUN, WIN_LO)
    unmodified from ard_reference.py and runs the same ard_dual policy at
    the same seed (0) ard_reference.py's own figure code already used;
  - the gas figure re-reads data/gas_comparison.jsonl with the exact same
    clean-trial filter (>= 100 logged readings per trial) already used by
    gas_arms_check.py and scripts/fig8_gas_comparison_errorbars.py.

Only plotting, units/labels, and export format/size are new here:
  - axis units are kW / kJ / s everywhere, no "kWh", no "kW/s"
    (the field is literally named "kwh" in the raw jsonl logs, but per
    gas_arms_check.py's own docstring it is the accumulator's running sum
    of Power_kW at 1 reading/s, i.e. kJ -- this script never prints "kWh");
  - IEEE single-column sizing (3.5 in wide), serif font, vector PDF + 600
    dpi PNG, one shared legend placed outside the axes (never over data),
    single grid per axis (no doubled gridlines from stacked twin axes),
    no overall suptitle on the ARD figure.

Usage: python scripts/make_paper_figures.py
Writes: paper_experiments/paper_figures/fig_ard_profiles.{pdf,png}
        paper_experiments/paper_figures/fig8_gas_comparison_kJ.{pdf,png}
"""
import json
import os
import sys
from collections import defaultdict

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Patch

HERE = os.path.dirname(os.path.abspath(__file__))
EXPDIR = os.path.dirname(HERE)
sys.path.insert(0, EXPDIR)

import ard_reference as ard  # noqa: E402  (unmodified: controller/profile logic lives there)

OUT = os.path.join(EXPDIR, "paper_figures")
os.makedirs(OUT, exist_ok=True)

SINGLE_COL = 3.5  # inches, IEEE single column

plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Times New Roman", "Times", "Nimbus Roman", "DejaVu Serif"],
    "font.size": 8,
    "axes.titlesize": 8,
    "axes.labelsize": 7.5,
    "xtick.labelsize": 6.5,
    "ytick.labelsize": 6.5,
    "legend.fontsize": 7,
    "axes.linewidth": 0.6,
    "grid.linewidth": 0.4,
    "grid.color": "#DDDDDD",
    "grid.alpha": 0.8,
    "axes.axisbelow": True,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "lines.linewidth": 1.0,
    "pdf.fonttype": 42,   # embed as TrueType, IEEE requirement
    "ps.fonttype": 42,
})

ORANGE = "#D97706"
BLUE = "#0072B2"
RED = "#D62728"
INK = "#222222"


def save(fig, name):
    png = os.path.join(OUT, f"{name}.png")
    pdf = os.path.join(OUT, f"{name}.pdf")
    fig.savefig(png, dpi=600, bbox_inches="tight")
    fig.savefig(pdf, bbox_inches="tight")
    print(f"saved {png}")
    print(f"saved {pdf}")


# ============================================================ Fig. 3/ARD ===
ARD_FIGURE_SEED = 0  # same seed ard_reference.py's own figure code used

# Reference table supplied by the user for sanity-checking this run
# (mints/min, dt_mean (s), D_t P5-P95 (kJ))
USER_TABLE = {
    "A": (1.04, 59.8, 84.9, 93.3),
    "B": (1.00, 59.8, 5.7, 6.2),
    "C": (1.08, 56.4, 45.9, 95.0),
    "D": (1.08, 55.4, 21.7, 105.1),
}

TITLES = {
    "A": "(a) High production, 1.5 kW constant",
    "B": "(b) Low production, 0.1 kW constant",
    "C": "(c) Volatile cloudy conditions",
    "D": "(d) Sunrise ramp-up",
}


def make_ard_figure():
    print(f"\n=== Fig. 3 (ARD response), seed={ARD_FIGURE_SEED} ===")
    print(f"{'profile':8s} {'mints/min':>10s} {'dt_mean(s)':>11s} {'D_t P5(kJ)':>11s} "
          f"{'D_t P95(kJ)':>12s}   vs user table (mints/min, dt_mean, P5, P95)")

    fig, axes = plt.subplots(2, 2, figsize=(SINGLE_COL, SINGLE_COL * 0.92), sharex=True)
    profiles = ["A", "B", "C", "D"]
    legend_handles = [
        Line2D([0], [0], color=ORANGE, lw=1.0, label="Generation $P$ (kW)"),
        Line2D([0], [0], color=BLUE, lw=1.3, label="Difficulty $D_t$ (kJ)"),
        Line2D([0], [0], color=RED, marker="x", lw=0, ms=4, label="Mint"),
    ]

    for ax, pf in zip(axes.ravel(), profiles):
        rng = np.random.default_rng(1000 * ARD_FIGURE_SEED + ord(pf))
        p = ard.power_profile(pf, rng)
        m = ard.price_ratio(rng)
        mt, me, dtr = ard.run_policy("ard_dual", p, m)
        s = ard.stats(mt, me, dtr, "ard_dual")
        u = USER_TABLE[pf]
        print(f"{pf:8s} {s['mints_per_min']:>10.2f} {s['dt_mean']:>11.1f} {s['d_p5']:>11.1f} "
              f"{s['d_p95']:>12.1f}   vs  ({u[0]:.2f}, {u[1]:.1f}, {u[2]:.1f}, {u[3]:.1f})")

        t = np.arange(1, ard.T_RUN + 1)
        ax.plot(t, p, color=ORANGE, lw=0.7)
        ax.set_ylabel("Generation (kW)", color=ORANGE, fontsize=6.8)
        ax.tick_params(axis="y", labelcolor=ORANGE, labelsize=6)
        ax.grid(True)

        ax2 = ax.twinx()
        ax2.step(t, dtr, where="post", color=BLUE, lw=1.0)
        ax2.plot(mt, [dtr[int(x) - 1] for x in mt], "x", color=RED, ms=3, mew=0.8)
        ax2.set_ylabel("Difficulty $D_t$ (kJ)", color=BLUE, fontsize=6.8)
        ax2.tick_params(axis="y", labelcolor=BLUE, labelsize=6)
        ax2.grid(False)  # avoid doubled gridlines from the twin axis

        ax.set_title(TITLES[pf], fontsize=6.8)
        ax.tick_params(axis="x", labelsize=6)

    for ax in axes[1]:
        ax.set_xlabel("Time (s)", fontsize=6.8)

    fig.legend(handles=legend_handles, loc="lower center", ncol=3,
               bbox_to_anchor=(0.5, -0.06), frameon=False, fontsize=6.5)
    fig.tight_layout(rect=(0, 0.035, 1, 1))
    save(fig, "fig_ard_profiles")


# ======================================================== Fig. 8/gas =====
ARMS = [("gas_direct", "Direct Push", "#88BBDD"),
        ("gas_static", "Static Batch (10 kJ)", "#4292C6"),
        ("gas_ard", "Joulet ARD", ORANGE)]

DATA_PATH = os.path.join(EXPDIR, "data", "gas_comparison.jsonl")


def load_gas_trials():
    """Exact same clean-trial filter (>= 100 readings) as gas_arms_check.py
    and scripts/fig8_gas_comparison_errorbars.py. Field is named 'kwh' in the
    raw log but is the kJ-at-1Hz accumulator value per those scripts' own
    docstrings; never relabelled as kWh here."""
    events = [json.loads(line) for line in open(DATA_PATH, encoding="utf-8") if line.strip()]
    per_arm = {}
    excluded_counts = {}
    for label, _, _ in ARMS:
        trials = defaultdict(lambda: {"gas": 0, "tx": 0, "kj": 0.0, "dur": None, "readings": 0})
        for e in events:
            if e.get("profile_label") != label:
                continue
            rid = e["run_id"]
            if e["stage"] == "mint_tx_confirmed":
                trials[rid]["gas"] += e["gas_used"]
                trials[rid]["tx"] += 1
                trials[rid]["kj"] += e.get("kwh", 0.0)
            elif e["stage"] == "gas_arm_end":
                trials[rid]["dur"] = e["elapsed_s"]
                trials[rid]["readings"] = e.get("readings", 0)
        rows, excluded = [], 0
        for rid, t in trials.items():
            if t["readings"] < 100:
                excluded += 1
                continue
            if t["dur"] and t["tx"]:
                rows.append({
                    "gas_per_hour": t["gas"] * 3600.0 / t["dur"],
                    "gas_per_kj": t["gas"] / t["kj"] if t["kj"] else float("nan"),
                    "readings": t["readings"], "dur": t["dur"],
                })
        per_arm[label] = rows
        excluded_counts[label] = excluded
    return per_arm, excluded_counts


USER_GAS_TABLE = {
    "Direct Push": (381.56e6, 28900),
    "Static Batch (10 kJ)": (124.05e6, 9308),
    "Joulet ARD": (69.10e6, 5418),
}


def make_gas_figure():
    per_arm, excluded_counts = load_gas_trials()
    n_clean = len(per_arm["gas_direct"])

    print(f"\n=== Fig. 8 (gas comparison), N={n_clean} clean trials/arm "
          f"(real hardhat receipts, data/gas_comparison.jsonl) ===")
    for label, name, _ in ARMS:
        print(f"{name}: excluded {excluded_counts[label]} trials with <100 readings")
        vals_h = [r["gas_per_hour"] for r in per_arm[label]]
        vals_k = [r["gas_per_kj"] for r in per_arm[label]]
        mean_h, sd_h = np.mean(vals_h), np.std(vals_h, ddof=1)
        mean_k = np.mean(vals_k)
        u_h, u_k = USER_GAS_TABLE[name]
        print(f"  gas/hour: {mean_h:,.2f} +- {sd_h:,.2f}  (user table: {u_h:,.2f})")
        print(f"  gas/kJ (exact): {mean_k:.4f}  -> rounds to {round(mean_k)}  "
              f"(user table: {u_k}, earlier figure said 28901 for Direct Push)")

    fig, (ax_a, ax_b) = plt.subplots(2, 1, figsize=(SINGLE_COL, SINGLE_COL * 1.15))
    x = np.arange(len(ARMS))

    for ax, metric, ylab, title, scale in (
            (ax_a, "gas_per_hour", "Gas per hour ($\\times 10^6$)", "(a) Gas consumption rate", 1e6),
            (ax_b, "gas_per_kj", "Gas per kJ minted", "(b) Gas per verified kJ", 1)):
        means, stds = [], []
        for label, _, _ in ARMS:
            vals = [r[metric] for r in per_arm[label]]
            means.append(np.mean(vals) / scale if vals else 0)
            stds.append(np.std(vals, ddof=1) / scale if len(vals) > 1 else 0)
        ax.bar(x, means, 0.55, yerr=stds, capsize=3,
               color=[c for _, _, c in ARMS], edgecolor="white",
               error_kw=dict(elinewidth=0.8, ecolor=INK))
        for xi, mn, sd in zip(x, means, stds):
            ax.annotate(f"{mn:,.2f}" if scale > 1 else f"{mn:,.0f}",
                        (xi, mn + sd), textcoords="offset points", xytext=(0, 3),
                        ha="center", fontsize=6, color=INK)
        ax.set_xticks(x, ["" for _ in ARMS])
        ax.set_ylabel(ylab, fontsize=7)
        ax.set_title(title, fontsize=7.5)
        ax.grid(True, axis="y")

    legend_handles = [Patch(facecolor=c, label=n) for _, n, c in ARMS]
    fig.legend(handles=legend_handles, loc="lower center", ncol=1,
               bbox_to_anchor=(0.5, -0.06), frameon=False, fontsize=6.8)
    fig.text(0.02, 0.005, f"N={n_clean} clean trials/arm, mean $\\pm$ SD", fontsize=5.8, color="#555555")
    fig.tight_layout(rect=(0, 0.1, 1, 1))
    save(fig, "fig8_gas_comparison_kJ")


if __name__ == "__main__":
    make_ard_figure()
    make_gas_figure()
