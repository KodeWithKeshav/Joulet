import json
from collections import defaultdict

with open("data/attacks_trials.jsonl") as f:
    events = [json.loads(line) for line in f]

# Wait — the log says 30 FPs but the individual jump values show many with
# jumps BELOW 3.0 kW (e.g. jump=-1.38, 0.03, 0.15). How can they be rejected
# by the spike check if jump < 3.0?
# 
# The oracle_node has a stateful `last_readings` dict. But the experiment runs
# 4 oracle nodes. Each oracle has its OWN `last_readings`. 
# Between trials or after attack injections, the oracles' `last_readings`
# state for the device may reset or be stale.
# 
# But the HONEST oracles (1,2,3) AND the MALICIOUS oracle (4) all rejected
# with 4x spike detections. That means all 4 oracles see the same spike.
# This can only happen if the oracle state was reset between readings.
# 
# The consensus engine uses a fresh set of oracle nodes per experiment run.
# After each attack injection, the oracles are likely restarted, resetting
# `last_readings` to empty. Then the first honest reading comes in with
# power=3.18 kW, and since last_readings[device_id] defaults to 0,
# the jump is 3.18-0 = 3.18 > 3.0 kW, triggering the spike check.
#
# But the log shows only 6 "AFTER ATTACK" entries. The other 24 FPs have
# prior readings with non-zero power. Let me re-check the oracle logs.

# Actually wait: the oracles run as separate Flask processes. The
# experiment_runner may restart them between attack injections, OR the
# experiment runner script in paper_experiments may not restart them.
# The key is what the oracle node's `last_readings` state is AT THE TIME
# each oracle processes the honest submission.
# 
# Let me check the oracle_verified events for a non-gap FP (e.g. sub#24
# with prev=4.56kW and power=3.18kW, jump=-1.38kW which is NOT > 3.0)

# Find the oracle_verified events for the first FP
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

decisions = {}
for e in events:
    if e["stage"] == "consensus_reached":
        decisions[e["sig_id"]] = e

fp_sigs = []
for sig_id, dec in decisions.items():
    if not dec["accepted"] and sig_id not in injections:
        fp_sigs.append(sig_id)

# For the first FP, check oracle_verified
target = fp_sigs[0]
print(f"Target FP sig_id: {target[:16]}...")
oracle_vfs = [e for e in events if e["stage"] == "oracle_verified" and e.get("sig_id") == target]
for v in oracle_vfs:
    print(f"  oracle={v.get('oracle_id')}, valid={v.get('valid')}, reason={v.get('reason')}")

# Check: is the MALICIOUS oracle inverting its vote here?
# oracle_4 is malicious. It votes OPPOSITE of its validation.
# If the honest reading passes validation (is_valid=True), the malicious
# oracle inverts to is_valid=False ("MALICIOUS_INVERTED (Passed)").
# Then it forwards approval="INVALID" to consensus.
# 
# With 3 honest oracles + 1 malicious oracle:
# If honest reading passes all checks:
#   oracle_1,2,3 vote VALID (weight ~1.0 each = 3.0)
#   oracle_4 votes INVALID (weight = its current reputation)
#   Consensus: 3.0 / (3.0 + rep_4) >= 0.66 -> accepted (should pass)
# 
# But if honest reading FAILS the spike check on ALL oracles:
#   oracle_1,2,3 each detect spike -> validation result = False
#   oracle_4 (malicious) detects spike -> result = False -> inverts to True
#   oracle_1,2,3 forward INVALID
#   oracle_4 forwards VALID
#   Consensus: rep_4 / (3 * rep_honest + rep_4) < 0.66 -> REJECTED
# 
# So the reading gets rejected because all 3 honest oracles flagged the spike.
# The malicious inversion actually AGREES with the honest reading here but
# gets outvoted.

# But wait — if the oracle correctly computes the jump as -1.38 kW (which is < 3.0),
# why does it flag as a spike? Let me look at the oracle_node code again.

# In oracle_node.py line 163:
# if (power_kw - last_power) > 3.0:
# This checks if the INCREASE is > 3.0. A decrease (-1.38) would NOT trigger this.
# So why are these being rejected?

# Let me check: does the oracle's `last_readings` state for the device differ
# from the submission-order analysis I did above? The oracle processes events
# differently from the submission order in the log.

# Actually, the oracle `last_readings` tracks the last power it VALIDATED (not submitted).
# If a reading is rejected, the oracle still updates last_readings[device_id] = power_kw
# (line 165 in oracle_node.py — it's OUTSIDE the if/else block).
# Wait, let me re-read.

print("\nChecking oracle_node.py line 160-165 logic...")
# Line 161: last_power = last_readings.get(device_id, 0)
# Line 163: if (power_kw - last_power) > 3.0:
# Line 164:     return False, ...
# Line 165: last_readings[device_id] = power_kw
# 
# Line 165 is AFTER the check. If the check triggers (return False),
# last_readings is NOT updated. So the oracle's last_readings stays at the
# old value, and the NEXT reading is compared against the same old last_power.
# 
# This means: once a reading is rejected by the spike check, the oracle's
# state for that device is FROZEN at the last accepted power. All subsequent
# readings with power > last_accepted + 3.0 will ALSO be rejected.
# 
# This is the cascading false positive bug: the first legitimate reading
# after an attack injection has last_power=0 (because attack readings used
# forged signatures and possibly different device IDs, or the attack used
# the same device and left power at 0), triggering a spike.
# Once that first honest reading is rejected, last_readings stays at 0.
# The NEXT honest reading also has power > 3.0 kW, so it also triggers spike.
# And so on — ALL subsequent honest readings get rejected until one happens
# to have power < 3.0 kW.

# Let's verify this cascading theory:
# Group FPs into contiguous runs
submissions_ordered = sorted(
    [(e["timestamp_ms"], e) for e in events if e["stage"] == "packet_submitted"],
    key=lambda x: x[0]
)

fp_sig_set = set(fp_sigs)
print(f"\nSubmission order (honest only, showing accepted/rejected):")
for ts, sub in submissions_ordered:
    if sub["sig_id"] in injections:
        tag = "FRAUD"
    elif sub["sig_id"] in fp_sig_set:
        tag = "FP (honest, rejected)"
    elif sub["sig_id"] in decisions and decisions[sub["sig_id"]]["accepted"]:
        tag = "TP (honest, accepted)"
    else:
        tag = "? unknown"
    
    if tag != "FRAUD":
        # Just print non-fraud
        power = sub.get("power_kw", 0)
        print(f"  ts={ts:.0f} power={power:.3f}kW -> {tag}")
