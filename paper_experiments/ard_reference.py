#!/usr/bin/env python3
"""
Standalone reference implementation of the dual-signal Adaptive Reporting
Difficulty (ARD) controller of the Joulet paper, plus baseline reporting
policies, with explicit seeds and metric definitions.

    python ard_reference.py                 # 30 seeds, writes results/ and the figure
    python ard_reference.py --seeds 5       # quick run

Controller (paper Eq. (4)), executed once per mint:

    D_{k+1} = clip_[Dmin,Dmax]( D_k * (1 + (T_tgt - dt_k)/T_tgt) * sat(P_ref/P_mkt) )

Energy is accumulated at 1 Hz as E += P[kW] * 1 s  (kJ), a mint fires when
E >= D, dt_k is the time since the previous mint.

Policies compared (all see the same 1 Hz generation stream):
  fixed_interval       mint every T_tgt seconds (if any energy was accumulated)
  dev_heartbeat        mint when E >= delta  OR  T_tgt*2 s elapsed (heartbeat);
                       the deviation-threshold + heartbeat rule used by deployed
                       price/data oracles, with delta tuned for profile A
  ard_interval         ARD with the market signal switched off (m = 1)
  ard_dual             full dual-signal ARD

Assumptions that the paper text does not fix (documented here and in the paper):
  * generation noise: multiplicative N(0, 0.03) per sample
  * price ratio: Ornstein-Uhlenbeck around 1 with reversion 0.02 /s and
    stationary SD 0.03, saturated to [0.6, 1.4]
  * profile C: piecewise-constant cloud factor ~ U[0.2, 1] re-drawn at Poisson
    events (mean inter-arrival 15 s) on a 2 kW clear-sky output
  * profile D: linear ramp 0.05 -> 2.0 kW over the run

Metric definitions (statistics window 300-1800 s):
  mints_per_min   number of mints with timestamp in the window / window minutes
  dt_mean, dt_sd  mean / SD of the interval between each in-window mint and
                  the mint before it (the first interval may straddle t = 300 s)
  inv_mean_dt     60 / dt_mean   (differs from mints_per_min by edge effects)
  within25        share of in-window intervals within +-25 % of T_tgt
  conv_s          time at which the first run of five consecutive intervals
                  within +-25 % of T_tgt begins, i.e. the time after which
                  every interval is in tolerance for five mints (None if never)
"""
import argparse
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "results")

T_RUN = 1800
WIN_LO = 300
T_TGT = 60.0
D_MIN, D_MAX, D_0 = 1.0, 500.0, 10.0
M_MIN, M_MAX = 0.6, 1.4
DELTA_TUNED = 90.0            # kJ = 1.5 kW * 60 s, tuned at the profile-A operating point
HEARTBEAT = 2 * T_TGT
NOISE = 0.03
OU_THETA, OU_STD = 0.02, 0.03


def power_profile(name, rng, n=T_RUN):
    t = np.arange(1, n + 1)
    if name == "A":
        p = np.full(n, 1.5)
    elif name == "B":
        p = np.full(n, 0.1)
    elif name == "C":
        p = np.empty(n)
        nxt, factor = 0.0, 1.0
        for i in range(n):
            while t[i] >= nxt:
                factor = rng.uniform(0.2, 1.0)
                nxt += rng.exponential(15.0)
            p[i] = 2.0 * factor
    elif name == "D":
        p = np.linspace(0.05, 2.0, n)
    else:
        raise ValueError(name)
    return np.clip(p * (1.0 + NOISE * rng.standard_normal(n)), 0.0, None)


def price_ratio(rng, n=T_RUN, const=None):
    if const is not None:
        return np.full(n, float(const))
    sigma = OU_STD * np.sqrt(2 * OU_THETA)
    y = np.zeros(n)
    for i in range(1, n):
        y[i] = y[i - 1] * (1 - OU_THETA) + sigma * rng.standard_normal()
    return np.clip(1.0 + y, M_MIN, M_MAX)


def run_policy(policy, p, m):
    """Returns mint times (s), batch energies (kJ), and the difficulty trace D_t."""
    D = D_0
    E = 0.0
    t_last = 0.0
    mint_t, mint_e = [], []
    dtrace = np.empty(len(p))
    for i, pw in enumerate(p):
        t = i + 1.0
        E += pw  # kW * 1 s = kJ
        fire = False
        if policy == "fixed_interval":
            fire = (t - t_last) >= T_TGT and E > 0
        elif policy == "dev_heartbeat":
            fire = E >= DELTA_TUNED or (t - t_last) >= HEARTBEAT
        elif policy in ("ard_interval", "ard_dual"):
            fire = E >= D
        if fire:
            dt = t - t_last
            if policy in ("ard_interval", "ard_dual"):
                mk = m[i] if policy == "ard_dual" else 1.0
                D = float(np.clip(D * (1.0 + (T_TGT - dt) / T_TGT) * mk, D_MIN, D_MAX))
            mint_t.append(t)
            mint_e.append(E)
            E = 0.0
            t_last = t
        dtrace[i] = D
    return np.array(mint_t), np.array(mint_e), dtrace


def stats(mint_t, mint_e, dtrace, policy):
    prev = np.concatenate(([0.0], mint_t[:-1]))
    intervals = mint_t - prev
    sel = mint_t >= WIN_LO
    iv = intervals[sel]
    out = {
        "mints_per_min": float(sel.sum() / ((T_RUN - WIN_LO) / 60.0)),
        "dt_mean": float(iv.mean()) if iv.size else float("nan"),
        "dt_sd": float(iv.std(ddof=0)) if iv.size else float("nan"),
        "dt_p95": float(np.percentile(iv, 95)) if iv.size else float("nan"),
        "within25": float(np.mean(np.abs(iv - T_TGT) <= 0.25 * T_TGT)) if iv.size else float("nan"),
        "kj_per_mint": float(mint_e[sel].mean()) if sel.any() else float("nan"),
    }
    out["inv_mean_dt"] = 60.0 / out["dt_mean"] if iv.size else float("nan")
    ok = np.abs(intervals - T_TGT) <= 0.25 * T_TGT
    conv = None
    for k in range(len(ok) - 4):
        if ok[k:k + 5].all():
            conv = float(prev[k])  # start of the first run of five in-tolerance intervals
            break
    out["conv_s"] = conv
    if policy.startswith("ard"):
        d = dtrace[WIN_LO - 1:]
        out["d_p5"], out["d_p95"] = float(np.percentile(d, 5)), float(np.percentile(d, 95))
    return out


def frozen_signal_check():
    """x_{k+1} = m x (2 - x): convergence to x* = 2 - 1/m from 199 initial states."""
    res = {}
    for m in (0.6, 0.8, 1.0, 1.2, 1.4):
        xs = np.linspace(0.01, 1.99, 199)
        x = xs.copy()
        for _ in range(400):
            x = m * x * (2 - x)
        res[str(m)] = {"x_star": 2 - 1 / m, "max_abs_err": float(np.max(np.abs(x - (2 - 1 / m)))),
                       "converged": int(np.sum(np.abs(x - (2 - 1 / m)) < 1e-6)), "of": 199}
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=30)
    ap.add_argument("--no-figure", action="store_true")
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    policies = ["fixed_interval", "dev_heartbeat", "ard_interval", "ard_dual"]
    profiles = ["A", "B", "C", "D"]
    per = {pf: {pl: [] for pl in policies} for pf in profiles}
    for seed in range(args.seeds):
        for pf in profiles:
            rng = np.random.default_rng(1000 * seed + ord(pf))
            p = power_profile(pf, rng)
            m = price_ratio(rng)
            for pl in policies:
                mt, me, dt_ = run_policy(pl, p, m)
                per[pf][pl].append(stats(mt, me, dt_, pl))

    def agg(rows, key):
        v = np.array([r[key] for r in rows if r.get(key) is not None], dtype=float)
        n_none = sum(1 for r in rows if r.get(key) is None)
        return (float(np.nanmean(v)) if v.size else None, float(np.nanstd(v)) if v.size else None, n_none)

    summary = {pf: {pl: {k: agg(per[pf][pl], k) for k in per[pf][pl][0]} for pl in policies} for pf in profiles}

    # price response on profile A with constant m (expected interval T_tgt*(2-1/m))
    resp = {}
    for mc in (0.6, 1.0, 1.4):
        rows = []
        for seed in range(args.seeds):
            rng = np.random.default_rng(777 + seed)
            p = power_profile("A", rng)
            m = price_ratio(rng, const=mc)
            for pl in ("fixed_interval", "dev_heartbeat", "ard_dual"):
                mt, me, dt_ = run_policy(pl, p, m)
                rows.append((pl, stats(mt, me, dt_, pl)))
        resp[str(mc)] = {pl: {"mints_per_min": float(np.mean([r["mints_per_min"] for q, r in rows if q == pl])),
                              "dt_mean": float(np.mean([r["dt_mean"] for q, r in rows if q == pl])),
                              "predicted_dt": T_TGT * (2 - 1 / mc)} for pl in ("fixed_interval", "dev_heartbeat", "ard_dual")}

    result = {
        "config": {"seeds": args.seeds, "T_run_s": T_RUN, "window_s": [WIN_LO, T_RUN], "T_tgt": T_TGT,
                   "D_min": D_MIN, "D_max": D_MAX, "D_0": D_0, "m_bounds": [M_MIN, M_MAX],
                   "delta_tuned_kJ": DELTA_TUNED, "heartbeat_s": HEARTBEAT, "gen_noise": NOISE,
                   "ou_theta": OU_THETA, "ou_std": OU_STD},
        "summary": summary,
        "price_response_profile_A": resp,
        "frozen_signal_check": frozen_signal_check(),
    }
    with open(os.path.join(OUT, "ard_reference_results.json"), "w") as f:
        json.dump(result, f, indent=2)

    # human-readable tables
    lines = [f"# ARD reference results ({args.seeds} seeds; mean +- SD across seeds)\n"]
    for pf in profiles:
        lines.append(f"\n## Profile {pf}\n")
        lines.append("| policy | mints/min | 60/mean dt | dt mean (s) | dt SD (s) | dt P95 (s) | within +-25% | kJ/mint | conv (s) |")
        lines.append("|---|---|---|---|---|---|---|---|---|")
        for pl in policies:
            s = summary[pf][pl]
            def f2(k, d=2):
                mu, sd, nn = s[k]
                return "n/a" if mu is None else f"{mu:.{d}f} +- {sd:.{d}f}" + (f" ({nn} runs never)" if nn else "")
            lines.append(f"| {pl} | {f2('mints_per_min')} | {f2('inv_mean_dt')} | {f2('dt_mean',1)} | {f2('dt_sd',1)} | "
                         f"{f2('dt_p95',1)} | {f2('within25')} | {f2('kj_per_mint',1)} | {f2('conv_s',0)} |")
    lines.append("\n## Price response, profile A (constant m)\n")
    lines.append("| m | policy | mints/min | dt mean (s) | predicted dt* (s) |")
    lines.append("|---|---|---|---|---|")
    for mc, d in resp.items():
        for pl, v in d.items():
            lines.append(f"| {mc} | {pl} | {v['mints_per_min']:.2f} | {v['dt_mean']:.1f} | {v['predicted_dt']:.1f} |")
    lines.append("\n## Frozen-signal check of x -> m x (2 - x)\n")
    for m, v in result["frozen_signal_check"].items():
        lines.append(f"- m={m}: x*={v['x_star']:.4f}, converged {v['converged']}/{v['of']}, max error {v['max_abs_err']:.2e}")
    with open(os.path.join(OUT, "ard_reference_results.md"), "w") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))

    if not args.no_figure:
        try:
            import matplotlib
            matplotlib.use("Agg")
            import matplotlib.pyplot as plt
        except ImportError:
            print("matplotlib not available: figure skipped", file=sys.stderr)
            return
        titles = {"A": "(a) High production, 1.5 kW constant", "B": "(b) Low production, 0.1 kW constant",
                  "C": "(c) Volatile cloudy conditions", "D": "(d) Sunrise ramp-up"}
        fig, axes = plt.subplots(2, 2, figsize=(7.2, 5.0), sharex=True)
        for ax, pf in zip(axes.ravel(), profiles):
            rng = np.random.default_rng(1000 * 0 + ord(pf))
            p = power_profile(pf, rng)
            m = price_ratio(rng)
            mt, me, dtr = run_policy("ard_dual", p, m)
            t = np.arange(1, T_RUN + 1)
            ax.plot(t, p, color="#f0a030", lw=0.6, label="Generation $P$ (kW)")
            ax.set_ylabel("Generation (kW)", color="#c07000", fontsize=8)
            ax2 = ax.twinx()
            ax2.step(t, dtr, where="post", color="tab:blue", lw=1.3, label="Difficulty $D_t$ (kJ)")
            ax2.plot(mt, [dtr[int(x) - 1] for x in mt], "rx", ms=3.5, label="Mint")
            ax2.set_ylabel("Difficulty $D_t$ (kJ)", color="tab:blue", fontsize=8)
            ax.set_title(titles[pf], fontsize=8.5)
            ax.tick_params(labelsize=7)
            ax2.tick_params(labelsize=7)
        for ax in axes[1]:
            ax.set_xlabel("Time (s)", fontsize=8)
        fig.tight_layout()
        fig.savefig(os.path.join(OUT, "fig_ard_profiles.png"), dpi=300)
        print("figure written:", os.path.join(OUT, "fig_ard_profiles.png"))


if __name__ == "__main__":
    main()
