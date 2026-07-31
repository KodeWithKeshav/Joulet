import json
from collections import defaultdict

# Check if per-profile data exists at Ttarget=60s
# The profiles (A_high, B_low, C_volatile, D_ramp) use the default
# DIFF_TARGET_INTERVAL=15s. There isn't a separate "60s" version of these profiles.
# The ttarget.jsonl has ttarget_30/60/120 but those are single-profile runs.

# So we need to compute tracking error for profiles A-D using the actual
# Ttarget=60s target interval. But the profile data was logged with the
# consensus engine running at DIFF_TARGET_INTERVAL=15s.

# Let's verify what the actual target interval was for the profile runs:
for prof in ("A_high", "B_low", "C_volatile", "D_ramp"):
    with open(f"data/profiles_{prof}.jsonl") as f:
        events = [json.loads(line) for line in f]
    
    # Check difficulty_adjusted events for target_interval_s
    adj = [e for e in events if e["stage"] == "difficulty_adjusted"]
    if adj:
        targets = set(e.get("target_interval_s") for e in adj)
        print(f"{prof}: n_adjustments={len(adj)}, target_interval_s values: {targets}")
    else:
        print(f"{prof}: no difficulty_adjusted events")
    
    # Count mints
    mints = [e for e in events if e["stage"] == "mint_tx_confirmed"]
    runs = defaultdict(list)
    for m in mints:
        runs[m["run_id"]].append(m["timestamp_ms"])
    
    print(f"  mints total={len(mints)}, runs={len(runs)}")
    for rid, ts in sorted(runs.items()):
        ts_sorted = sorted(ts)
        if len(ts_sorted) >= 2:
            intervals = [(ts_sorted[i+1]-ts_sorted[i])/1000.0 for i in range(len(ts_sorted)-1)]
            import numpy as np
            arr = np.array(intervals)
            print(f"    {rid}: n_mints={len(ts_sorted)}, mean_interval={arr.mean():.1f}s, "
                  f"median={np.median(arr):.1f}s")
