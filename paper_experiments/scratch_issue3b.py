import json
from collections import defaultdict

with open("data/attacks_trials.jsonl") as f:
    events = [json.loads(line) for line in f]

# The spike check uses last_readings[device_id]. Between trials, does the
# oracle state reset? Or does state persist?
# Each FP has 4 oracle rejections (4 = oracle_1, oracle_2, oracle_3, and oracle_4).
# All 4 oracles rejected => consensus rejects.
# The jump is measured as (current_power - last_power) > 3.0 kW.
# If the last reading for a device was 0 kW (start of trial or after a gap),
# any reading > 3.0 kW triggers the spike check.
# The honest readings have power 3.18-4.55 kW, all > 3.0 kW.

# Let's confirm: are these the FIRST honest reading submitted after an
# attack or trial boundary (where last_readings resets to 0)?

# Build per-trial honest submissions timeline
injections = {}
last_inj = None
for e in events:
    st = e["stage"]
    if st == "attack_injected" and e.get("trial", -1) >= 0:
        last_inj = {"ts": e["timestamp_ms"]}
    elif st == "attack_responses" and last_inj is not None:
        injections[e["sig_id"]] = True
    elif st == "packet_submitted" and e.get("forged") and last_inj is not None:
        injections[e["sig_id"]] = True

# Track submission order per device
device_submissions = defaultdict(list)
for e in events:
    if e["stage"] == "packet_submitted":
        is_fraud = e["sig_id"] in injections
        device_submissions[e.get("device_id", "?")].append({
            "sig_id": e["sig_id"],
            "power_kw": e.get("power_kw", 0),
            "ts": e["timestamp_ms"],
            "forged": e.get("forged", False),
            "is_fraud": is_fraud,
            "trial": e.get("trial", "?"),
        })

# Now check which honest submissions are first-after-gap
decisions = {}
for e in events:
    if e["stage"] == "consensus_reached":
        decisions[e["sig_id"]] = e

fp_sigs = set()
for sig_id, dec in decisions.items():
    if not dec["accepted"] and sig_id not in injections:
        fp_sigs.add(sig_id)

print(f"Checking position of {len(fp_sigs)} FP submissions in device timeline:")

first_after_gap_count = 0
for device_id, subs in device_submissions.items():
    for i, sub in enumerate(subs):
        if sub["sig_id"] in fp_sigs:
            if i == 0:
                prev_power = 0
                gap_type = "FIRST EVER"
            else:
                prev = subs[i-1]
                prev_power = prev["power_kw"]
                # Check if previous was a different trial or an attack
                if prev.get("is_fraud") or prev.get("forged"):
                    gap_type = "AFTER ATTACK"
                elif prev["trial"] != sub["trial"]:
                    gap_type = "CROSS-TRIAL"
                else:
                    gap_type = f"NORMAL (prev={prev_power:.2f}kW)"
            
            jump = sub["power_kw"] - prev_power
            print(f"  {device_id} sub#{i}: power={sub['power_kw']:.3f}kW, "
                  f"prev={prev_power:.2f}kW, jump={jump:.2f}kW, "
                  f"gap_type={gap_type}")
            if gap_type in ("FIRST EVER", "AFTER ATTACK", "CROSS-TRIAL") or prev_power < 0.1:
                first_after_gap_count += 1

print(f"\nFirst-after-gap/reset FPs: {first_after_gap_count}/{len(fp_sigs)}")
