import json

with open('paper_experiments/data/attacks_trials.jsonl') as f:
    events = [json.loads(line) for line in f]

# Find how many false positives there actually are in the file using fig16 logic
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

fps = []
for sig_id, dec in decisions.items():
    accepted, ts = dec
    is_fraud = sig_id in injections
    if not is_fraud and not accepted:
        fps.append(sig_id)

print(f"Number of FPs: {len(fps)}")

# Now find the reasons for these FPs
# The reason is in oracle_verified for these sig_ids
reasons = []
for e in events:
    if e["stage"] == "oracle_verified" and e.get("sig_id") in fps and e.get("valid") is False:
        reasons.append(e.get("reason"))

from collections import Counter
c = Counter([r.split(':')[0] for r in reasons])
for k, v in c.items():
    print(f"{k}: {v}")

