#!/usr/bin/env python3
"""Run every figure script against the final datasets and collect each one's
printed summary-stats block into data/summary_stats.txt (one consolidated
file for the paper's tables)."""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "data", "summary_stats.txt")

SCRIPTS = [
    "fig5_latency_breakdown.py",
    "fig6_latency_cdf.py",
    "fig7_convergence_boxplot.py",
    "fig8_gas_comparison_errorbars.py",
    "fig9_ttarget_sensitivity.py",
    "fig10_lyapunov_phase_portrait.py",
    "fig11_attack_timeline.py",
    "fig12_stake_trajectories.py",
    "fig13_scalability_throughput.py",
    "fig14_zk_overhead.py",
    "fig15_consensus_latency.py",
    "fig16_fraud_confusion_matrix.py",
    "fig17_precision_recall.py",
    "fig18_trust_score_over_time.py",
    "fig19_ard_tracking_error.py",
    "fig19_ard_tracking_error_60s.py",
    "fig20_uptime_by_node.py",
    "fig21_sustained_throughput.py",
]

py = sys.executable
failures = []
with open(OUT, "w") as out:
    for script in SCRIPTS:
        print(f"--- {script}")
        r = subprocess.run([py, os.path.join(HERE, script)],
                           capture_output=True, text=True, cwd=HERE)
        out.write(f"\n{'='*70}\n{script}\n{'='*70}\n{r.stdout}")
        if r.returncode != 0:
            failures.append(script)
            out.write(f"\nFAILED (exit {r.returncode}):\n{r.stderr}\n")
            print(r.stderr, file=sys.stderr)

print(f"\nstats written to {OUT}")
if failures:
    print(f"FAILED: {', '.join(failures)}")
    sys.exit(1)
print("all figures OK")
