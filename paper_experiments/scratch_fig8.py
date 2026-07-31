import json

with open("data/gas_comparison.jsonl") as f:
    events = [json.loads(line) for line in f]

trials = {}
for e in events:
    if e.get("profile_label") == "gas_direct" and e["stage"] == "gas_arm_end":
        trials[e["trial"]] = e

for t, e in sorted(trials.items()):
    print(f"Trial {t}: readings={e['readings']}, elapsed_s={e['elapsed_s']:.2f}")
