import json

with open("data/ttarget.jsonl") as f:
    events = [json.loads(line) for line in f]

evs = [e for e in events if e.get("profile_label") == "ttarget_60"]
subs = sorted([e for e in evs if e["stage"] == "packet_submitted"], key=lambda e: e["timestamp_ms"])
for e in subs[:10]:
    print(f"{e.get('power_kw')}")
print("...")
for e in subs[-10:]:
    print(f"{e.get('power_kw')}")
