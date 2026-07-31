#!/usr/bin/env python3
"""fig16: fraud detection confusion matrix"""

import numpy as np
import matplotlib.pyplot as plt
import figstyle as F

try:
    import seaborn as sns
except ImportError:
    sns = None

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

print("\n=== fig16 summary stats ===")
print(f"TP={TP}, FP={FP}, TN={TN}, FN={FN}")

fig, ax = plt.subplots(figsize=(F.SINGLE_COL, 2.5))
cm = np.array([[TN, FP], [FN, TP]])
if sns:
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False, 
                xticklabels=["Honest", "Fraud"], yticklabels=["Honest", "Fraud"], ax=ax)
else:
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["Honest", "Fraud"])
    ax.set_yticklabels(["Honest", "Fraud"])
    for i in range(2):
        for j in range(2):
            ax.text(j, i, cm[i, j], ha="center", va="center", color="black" if cm[i,j] < (cm.max()/2) else "white")

ax.set_xlabel("System Decision (Consensus)")
ax.set_ylabel("Ground Truth (Injected)")
ax.set_title("Fraud Detection Confusion Matrix")
fig.tight_layout()
F.save(fig, "fig16_fraud_confusion_matrix")
