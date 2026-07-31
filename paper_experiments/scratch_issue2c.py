import json

with open("data/ttarget.jsonl") as f:
    events = [json.loads(line) for line in f]

# The bug: the script computes r = sum(power_kw) / total_wall_time.
# But for 120s, many submissions are REJECTED by oracles (not accepted by consensus).
# Only ACCEPTED readings contribute to the accumulator and trigger mints.
# So D* should use ACCEPTED rate, not total submission rate.
# Let's check how many readings are accepted vs submitted per sweep.

for tt in (30, 60, 120):
    evs = [e for e in events if e.get("profile_label") == f"ttarget_{tt}"]
    subs = [e for e in evs if e["stage"] == "packet_submitted"]
    accepted = [e for e in evs if e["stage"] == "consensus_reached" and e["accepted"]]
    rejected = [e for e in evs if e["stage"] == "consensus_reached" and not e["accepted"]]
    
    t0 = next(e["timestamp_ms"] for e in evs if e["stage"] == "ttarget_start")
    dur = (max(e["timestamp_ms"] for e in evs) - t0) / 1000.0
    
    # Get power_kw from accepted submissions only
    accepted_sigs = {e["sig_id"] for e in accepted}
    sub_by_sig = {e["sig_id"]: e for e in subs}
    
    accepted_power = sum(sub_by_sig[sig].get("power_kw", 0) for sig in accepted_sigs if sig in sub_by_sig)
    r_accepted = accepted_power / dur if dur else 0
    dstar_accepted = r_accepted * tt
    
    total_power = sum(e.get("power_kw", 0) for e in subs)
    r_total = total_power / dur if dur else 0
    dstar_total = r_total * tt
    
    print(f"ttarget {tt}: submitted={len(subs)}, accepted={len(accepted)}, rejected={len(rejected)}")
    print(f"  dur={dur:.1f}s")
    print(f"  r_total (all subs)  = {r_total:.4f}, D*_total  = {dstar_total:.1f}")
    print(f"  r_accepted          = {r_accepted:.4f}, D*_accepted = {dstar_accepted:.1f}")
    print(f"  rejection reasons:")
    for e in rejected[:5]:
        # Find the oracle verification reason
        sig = e["sig_id"]
        oracle_rejects = [ev for ev in evs if ev["stage"] == "oracle_verified" and ev.get("sig_id") == sig and not ev.get("valid", True)]
        if oracle_rejects:
            print(f"    {oracle_rejects[0].get('reason', 'unknown')}")
    print()
