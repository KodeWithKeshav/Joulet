#!/usr/bin/env python3
"""
Shared style + data loading for all paper figures.

House style (matches existing paper figures):
  orange  = energy generation rate
  blue    = adaptive difficulty D_t
  red X   = minting events
  grey dashed = burn / sink flows
Palette validated for CVD safety and surface contrast (dataviz validator).

IEEE two-column sizing: 3.5 in single-column, 7.16 in double-column.
Every figure saves 300-dpi PNG + vector PDF.
"""

import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

# ---------------------------------------------------------------- palette ---
ORANGE = "#D97706"   # energy generation rate
BLUE = "#0072B2"     # adaptive difficulty D_t
RED = "#D62728"      # minting events (X markers)
GREY = "#7F7F7F"     # burn / sink flows (dashed)
INK = "#222222"
MUTED = "#666666"

# categorical set for the four generation profiles (Okabe-Ito, validated)
PROFILE_COLORS = {
    "A_high": "#0072B2",
    "B_low": "#E69F00",
    "C_volatile": "#009E73",
    "D_ramp": "#CC79A7",
}
PROFILE_NAMES = {
    "A_high": "A: High",
    "B_low": "B: Low",
    "C_volatile": "C: Volatile",
    "D_ramp": "D: Ramp-up",
}
PROFILE_ORDER = ["A_high", "B_low", "C_volatile", "D_ramp"]

SINGLE_COL = 3.5    # inches
DOUBLE_COL = 7.16   # inches

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), "data")
FIGS = os.path.join(os.path.dirname(HERE), "figures")


def setup():
    plt.rcParams.update({
        "font.family": "serif",
        "font.serif": ["Times New Roman", "Times", "Nimbus Roman", "DejaVu Serif"],
        "font.size": 8,
        "axes.titlesize": 8.5,
        "axes.labelsize": 8,
        "xtick.labelsize": 7,
        "ytick.labelsize": 7,
        "legend.fontsize": 6.8,
        "axes.linewidth": 0.6,
        "grid.linewidth": 0.4,
        "grid.color": "#DDDDDD",
        "grid.alpha": 0.8,
        "axes.grid": True,
        "axes.axisbelow": True,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "lines.linewidth": 1.2,
        "legend.frameon": True,
        "legend.framealpha": 0.9,
        "legend.edgecolor": "#CCCCCC",
        "figure.dpi": 120,
        "savefig.dpi": 300,
        "pdf.fonttype": 42,   # embed TrueType (IEEE requirement)
        "ps.fonttype": 42,
    })


def load_events(*names):
    """Load one or more JSONL metric files into a single event list."""
    events = []
    for name in names:
        path = os.path.join(DATA, name)
        if not os.path.exists(path):
            print(f"WARNING: {path} missing")
            continue
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        events.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    return events


def by_stage(events, stage):
    return [e for e in events if e.get("stage") == stage]


def save(fig, name):
    os.makedirs(FIGS, exist_ok=True)
    png = os.path.join(FIGS, f"{name}.png")
    pdf = os.path.join(FIGS, f"{name}.pdf")
    fig.savefig(png, bbox_inches="tight", dpi=300)
    fig.savefig(pdf, bbox_inches="tight")
    print(f"saved {png}\nsaved {pdf}")


def stats_line(label, vals):
    v = np.asarray(vals, dtype=float)
    if len(v) == 0:
        print(f"  {label}: NO DATA")
        return
    print(f"  {label}: n={len(v)} mean={v.mean():.3f} std={v.std(ddof=1) if len(v)>1 else 0:.3f} "
          f"p50={np.percentile(v,50):.3f} p95={np.percentile(v,95):.3f} p99={np.percentile(v,99):.3f} "
          f"min={v.min():.3f} max={v.max():.3f}")
