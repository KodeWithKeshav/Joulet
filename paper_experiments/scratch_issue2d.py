import json
import numpy as np

with open("data/ttarget.jsonl") as f:
    events = [json.loads(line) for line in f]

# The core issue: `r` uses `sum(power_kw)` not `sum(energy_kwh)`.
# power_kw is instantaneous power (kW). The script adds these raw, but the
# consensus engine also adds them raw to batch_accumulated_kwh.
# So the "accumulated kWh" in the consensus engine is actually the SUM of
# instantaneous power readings, NOT real energy.
# This means the D* calculation using r = sum(power_kw)/dur is self-consistent
# with how the system works. The problem must be elsewhere.

# Let's look at why 120s r is ~half of 30/60s r.
# 30s: 65 readings in 955.9s = 1 reading every 14.7s (pace 6s but real interval?)  
# 60s: 65 readings in 954.5s = 1 reading every 14.7s
# 120s: 71 readings in 1903.8s = 1 reading every 26.8s
# The 120s sweep has FEWER readings per unit time — its effective submission
# rate dropped. Let's check timing of submissions.

for tt in (30, 60, 120):
    evs = [e for e in events if e.get("profile_label") == f"ttarget_{tt}"]
    subs = sorted([e for e in evs if e["stage"] == "packet_submitted"], key=lambda e: e["timestamp_ms"])
    t0 = next(e["timestamp_ms"] for e in evs if e["stage"] == "ttarget_start")
    
    intervals = []
    for i in range(1, len(subs)):
        dt = (subs[i]["timestamp_ms"] - subs[i-1]["timestamp_ms"]) / 1000.0
        intervals.append(dt)
    
    if intervals:
        arr = np.array(intervals)
        print(f"ttarget {tt}: n_intervals={len(arr)}, "
              f"mean={arr.mean():.2f}s, median={np.median(arr):.2f}s, "
              f"min={arr.min():.2f}s, max={arr.max():.2f}s, "
              f"p95={np.percentile(arr,95):.2f}s")
        # Check if there are big gaps (e.g. one huge gap inflating dur)
        big_gaps = [(i, v) for i, v in enumerate(intervals) if v > 60]
        if big_gaps:
            print(f"  BIG GAPS (>60s): {big_gaps}")
    
    # The real question: does the 120s sweep have the same actual input rate
    # but a longer total duration? Let's compute r over just the "active" period
    # (first to last submission, not start to very end)
    if len(subs) >= 2:
        active_dur = (subs[-1]["timestamp_ms"] - subs[0]["timestamp_ms"]) / 1000.0
        active_r = sum(e.get("power_kw", 0) for e in subs) / active_dur if active_dur else 0
        print(f"  active_dur={active_dur:.1f}s, active_r={active_r:.4f}, D*_active={active_r*tt:.1f}")
