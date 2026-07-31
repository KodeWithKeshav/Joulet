import json

with open("data/scale.jsonl") as f:
    events = [json.loads(line) for line in f]

evs = [e for e in events if e.get("profile_label") == "scale_10"]
t0 = next(e["timestamp_ms"] for e in evs if e["stage"] == "scale_start")

mints = [e["timestamp_ms"] for e in evs if e["stage"] == "mint_tx_confirmed"]
subs = [e["timestamp_ms"] for e in evs if e["stage"] == "packet_submitted"]

print("Mints between 65s and 80s:")
for m in mints:
    t = (m - t0) / 1000.0
    if 60 < t < 85:
        print(f"Mint at {t:.1f}s")

print("Submissions between 65s and 80s:")
sub_count = 0
for s in subs:
    t = (s - t0) / 1000.0
    if 65 < t < 80:
         sub_count += 1
print(f"Total submissions in gap: {sub_count}")

