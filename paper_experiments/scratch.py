import json

injections = {}
last_inj = None
with open("data/attacks_trials.jsonl") as f:
    events = [json.loads(line) for line in f]

for e in events:
    st = e["stage"]
    if st == "attack_injected" and e.get("trial", -1) >= 0:
        last_inj = e
    elif st == "attack_responses" and last_inj is not None:
        injections[e["sig_id"]] = True
    elif st == "packet_submitted" and e.get("forged") and last_inj is not None:
        injections[e["sig_id"]] = True

rejections = {}
for e in events:
    if e["stage"] == "oracle_verified" and not e.get("valid", True):
        rejections[e["sig_id"]] = e.get("reason", "unknown")

honest_rejections = []
for sig_id, reason in rejections.items():
    if sig_id not in injections:
        honest_rejections.append(reason)

from collections import Counter
print(Counter(honest_rejections))
