import json
from collections import defaultdict

with open("data/gas_comparison.jsonl") as f:
    events = [json.loads(line) for line in f]

# Check ALL arms, not just Direct Push
for arm_label in ("gas_direct", "gas_static", "gas_ard"):
    print(f"\n{'='*60}")
    print(f"ARM: {arm_label}")
    print(f"{'='*60}")
    
    # Collect gas_arm_end data
    arm_ends = {}
    for e in events:
        if e.get("profile_label") == arm_label and e["stage"] == "gas_arm_end":
            arm_ends[e["run_id"]] = e
    
    # Collect per-trial mint data
    trial_mints = defaultdict(list)
    for e in events:
        if e.get("profile_label") == arm_label and e["stage"] == "mint_tx_confirmed":
            trial_mints[e["run_id"]].append(e)
    
    for rid in sorted(arm_ends.keys()):
        end = arm_ends[rid]
        mints = trial_mints.get(rid, [])
        total_gas = sum(m["gas_used"] for m in mints)
        gas_values = [m["gas_used"] for m in mints]
        gas_per_hour = total_gas * 3600.0 / end["elapsed_s"] if end["elapsed_s"] else 0
        print(f"  {rid}: readings={end['readings']}, elapsed_s={end['elapsed_s']:.2f}, "
              f"mints={len(mints)}, total_gas={total_gas:,}, gas/hr={gas_per_hour:,.0f}")
        if gas_values:
            print(f"    gas_used range: min={min(gas_values):,}, max={max(gas_values):,}, "
                  f"mean={sum(gas_values)/len(gas_values):,.0f}")
