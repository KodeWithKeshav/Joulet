#!/usr/bin/env python3
"""fig17: precision, recall, and F1 score"""

import numpy as np
import matplotlib.pyplot as plt
import figstyle as F

F.setup()
events = F.load_events("attacks_trials.jsonl")

injections = {}
last_inj = None
for e in events:
    st = e["stage"]
    if st == "attack_injected" and e.get("trial", -1) >= 0:
        last_inj = {"ts": e["timestamp_ms"]}
    elif st == "attack_responses" and last_inj is not None:
        injections[e["sig_id"]] = last_inj["ts"]
    elif st == "packet_submitted" and e.get("forged") and last_inj is not None:
        injections[e["sig_id"]] = last_inj["ts"]

decisions = {}
for e in events:
    if e["stage"] == "consensus_reached":
        decisions[e["sig_id"]] = (e["accepted"], e["timestamp_ms"])

TP = FP = TN = FN = 0
for sig_id, dec in decisions.items():
    accepted, ts_dec = dec
    is_fraud = sig_id in injections
    if is_fraud:
        if not accepted: TP += 1
        else: FN += 1
    else:
        if not accepted: FP += 1
        else: TN += 1

precision = TP / (TP + FP) if (TP + FP) > 0 else 0.0
recall = TP / (TP + FN) if (TP + FN) > 0 else 0.0
f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

print("\n=== fig17 summary stats ===")
print(f"Precision={precision:.3f}, Recall={recall:.3f}, F1={f1:.3f}")

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.5))
metrics = ["Precision", "Recall", "F1 Score"]
vals = [precision, recall, f1]
colors = [F.BLUE, F.ORANGE, F.RED]

ax.bar(metrics, vals, color=colors, edgecolor="white", width=0.5)
ax.set_ylim(0, 1.15)
for i, v in enumerate(vals):
    ax.annotate(f"{v:.3f}", (i, v), textcoords="offset points", xytext=(0, 4), ha="center", fontsize=7)

ax.set_ylabel("Score")
ax.set_title("Fraud Detection Accuracy")
fig.tight_layout()
F.save(fig, "fig17_precision_recall")
