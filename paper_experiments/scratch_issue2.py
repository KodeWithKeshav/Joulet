import json

with open("data/ttarget.jsonl") as f:
    events = [json.loads(line) for line in f]

for tt in (30, 60, 120):
    evs = [e for e in events if e.get("profile_label") == f"ttarget_{tt}"]
    if not evs:
        print(f"ttarget {tt}: NO DATA")
        continue
    t0 = next(e["timestamp_ms"] for e in evs if e["stage"] == "ttarget_start")
    submitted = [e for e in evs if e["stage"] == "packet_submitted"]
    dur = (max(e["timestamp_ms"] for e in evs) - t0) / 1000.0
    kwh_total = sum(e.get("power_kw", 0) for e in submitted)
    r = kwh_total / dur if dur else 0
    dstar = r * tt
    
    # Also check the dstar <= 100 guard
    print(f"ttarget {tt}: dur={dur:.1f}s, n_submitted={len(submitted)}, "
          f"kwh_total={kwh_total:.2f}, r={r:.4f} kWh/s, "
          f"D*=r*Tt={dstar:.1f}, guard(dstar<=100)={dstar<=100}")
