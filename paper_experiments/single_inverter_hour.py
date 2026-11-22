#!/usr/bin/env python3
"""
Single-inverter, one-hour (3,600 s) gas comparison behind the paper's Table II
(Table \\ref{tab:gas1}).

Input: iot-simulation/mock_data/realistic_sunny.csv, produced by the
repository's Python single-diode PV generator (iot-simulation/
generate_mock_data.py, 350 W x 14-panel string, ~5 kW), simulated day
2026-02-24. There is no OpenModelica inverter model in this repository
(the only .mo file, GridSystem.mo, is a grid load profile, not PV
generation) and no logged run spans a continuous 3,600 s single-inverter
test, so this script builds the 1 Hz, 1-hour trace itself: it takes the
chosen clock hour's rows (5-minute resolution, 12 rows/hour) and holds
each value for 300 consecutive 1 Hz samples (zero-order hold) to produce
exactly 3,600 samples.

Policies (same constants as the Table III / Fig. 3 reference simulator,
paper_experiments/ard_reference.py: T_tgt=60 s, D_min=1 kJ, D_max=500 kJ,
D_0=10 kJ, m in [0.6, 1.4]):
  direct        mint every reading with P > 0 kW
  static100     mint every 100 readings (count-based batch)
  ard_interval  Eq. (4) with the market signal switched off (m = 1)
  ard_dual      full dual-signal Eq. (4), OU price ratio (same process as
                ard_reference.py, independent seed)

Gas is the assumed constant 70,000/mint used throughout the paper's
Table II (not an on-chain measurement; the measured 110,281-146,849
gas/tx figures come from the separate testbed campaign, Section VI-D).

Usage: python single_inverter_hour.py --hour 11 --seed 0
"""
import argparse
import csv
import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(os.path.dirname(HERE), "iot-simulation", "mock_data", "realistic_sunny.csv")
OUT = os.path.join(HERE, "results")

T_TGT = 60.0
D_MIN, D_MAX, D_0 = 1.0, 500.0, 10.0
M_MIN, M_MAX = 0.6, 1.4
OU_THETA, OU_STD = 0.02, 0.03
GAS_PER_MINT = 70_000
N = 3600
HOLD_S = 300  # 5 min of CSV resolution -> 300 x 1 Hz samples


def load_hour_trace(hour):
    with open(CSV_PATH) as f:
        rows = list(csv.DictReader(f))
    hour_rows = [r for r in rows if int(r["Timestamp"][11:13]) == hour]
    if not hour_rows:
        raise ValueError(f"no rows for hour {hour:02d} in {CSV_PATH}")
    vals = [float(r["Power_kW"]) for r in hour_rows]
    trace = []
    for v in vals:
        trace.extend([v] * HOLD_S)
    trace = (trace * ((N // len(trace)) + 1))[:N]
    return np.array(trace), hour_rows


def price_ratio(rng, n):
    sigma = OU_STD * np.sqrt(2 * OU_THETA)
    y = np.zeros(n)
    for i in range(1, n):
        y[i] = y[i - 1] * (1 - OU_THETA) + sigma * rng.standard_normal()
    return np.clip(1.0 + y, M_MIN, M_MAX)


def run_ard(p, m, use_market):
    D = D_0
    E = 0.0
    t_last = 0.0
    mint_t = []
    for i, pw in enumerate(p):
        t = i + 1.0
        E += pw
        if E >= D:
            dt = t - t_last
            mk = m[i] if use_market else 1.0
            D = float(np.clip(D * (1.0 + (T_TGT - dt) / T_TGT) * mk, D_MIN, D_MAX))
            mint_t.append(t)
            E = 0.0
            t_last = t
    return np.array(mint_t)


def run_direct(p):
    return np.array([i + 1.0 for i, pw in enumerate(p) if pw > 0])


def run_static_count(n_readings, batch=100):
    return np.array([float(i + 1) for i in range(batch - 1, n_readings, batch)])


def intervals_of(mint_t):
    if len(mint_t) == 0:
        return np.array([])
    prev = np.concatenate(([0.0], mint_t[:-1]))
    return mint_t - prev


def row(name, mint_t, direct_gas=None):
    iv = intervals_of(mint_t)
    gas = int(len(mint_t) * GAS_PER_MINT)
    r = {
        "strategy": name,
        "mints": int(len(mint_t)),
        "gas": gas,
        "interval_min_s": float(iv.min()) if iv.size else None,
        "interval_max_s": float(iv.max()) if iv.size else None,
        "interval_mean_s": float(iv.mean()) if iv.size else None,
    }
    if direct_gas:
        r["reduction_vs_direct"] = 1.0 - gas / direct_gas
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hour", type=int, default=11)
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    p, hour_rows = load_hour_trace(args.hour)
    rng = np.random.default_rng(args.seed)
    m = price_ratio(rng, len(p))

    direct_t = run_direct(p)
    static_t = run_static_count(len(p), 100)
    ard_int_t = run_ard(p, m, use_market=False)
    ard_dual_t = run_ard(p, m, use_market=True)

    direct_row = row("Direct Push", direct_t)
    rows = [
        direct_row,
        row("Static Batch (x100)", static_t, direct_row["gas"]),
        row("ARD, interval only", ard_int_t, direct_row["gas"]),
        row("ARD, dual-signal", ard_dual_t, direct_row["gas"]),
    ]
    direct_row["reduction_vs_direct"] = 0.0

    results = {
        "input": {
            "source": "iot-simulation/mock_data/realistic_sunny.csv",
            "generator": "iot-simulation/generate_mock_data.py (single-diode PV model, 350 W x 14 panels)",
            "simulated_day": "2026-02-24",
            "hour_window": f"{args.hour:02d}:00-{args.hour + 1:02d}:00",
            "raw_power_kw": [float(r["Power_kW"]) for r in hour_rows],
            "raw_rows_in_hour": len(hour_rows),
            "upsampling": f"each 5-min CSV row held for {HOLD_S} consecutive 1 Hz samples (zero-order hold) to build {N} samples",
            "seed": args.seed,
        },
        "ard_constants": {"T_tgt_s": T_TGT, "D_min_kJ": D_MIN, "D_max_kJ": D_MAX, "D_0_kJ": D_0, "m_bounds": [M_MIN, M_MAX]},
        "gas_per_mint_assumed": GAS_PER_MINT,
        "rows": rows,
    }

    with open(os.path.join(OUT, f"single_inverter_hour_{args.hour:02d}.json"), "w") as f:
        json.dump(results, f, indent=2)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
