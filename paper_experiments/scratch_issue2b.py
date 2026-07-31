import json

with open("data/ttarget.jsonl") as f:
    events = [json.loads(line) for line in f]

# The 120s sweep ran for twice as long (1903s vs 955s), so it got more
# submitted readings. But the reading RATE was the same ~6s pace.
# The r calculation uses power_kw (instantaneous kW), NOT energy-over-time kWh.
# So the total "kwh_total" is really sum-of-power_kw, not real energy.
# With pace_s=6s, each reading of ~2.5 kW contributes ~2.5 "units" but
# actually generates 2.5*6/3600 kWh over 6 seconds.
# The script computes r = sum(power_kw) / dur_s. 
# For 30s: r=253.73/955.9 = 0.265 "kW" not "kWh/s"
# For 120s: r=278.43/1903.8 = 0.146 "kW" — lower because longer run but
# nearly same total power readings, since the 120s run had 71 vs 65 readings
# spread over twice the wall time.
# 
# The problem: the 120s sweep ran for ~1904s (vs ~955s for 30/60), so
# submissions were spread over a longer window. The per-reading power is
# the same, but r is HALVED because duration doubled.
# This means D* for 120s = 0.146 * 120 = 17.5, which is wrong.
# The equilibrium D* should scale linearly with Ttarget when the generation
# RATE is the same. The issue is that the 120s run produced readings at
# a lower effective rate (same pace but longer total duration).

# Let's check the ttarget_start params
for tt in (30, 60, 120):
    evs = [e for e in events if e.get("profile_label") == f"ttarget_{tt}"]
    starts = [e for e in evs if e["stage"] == "ttarget_start"]
    for s in starts:
        print(f"ttarget_{tt} start: duration_s={s.get('duration_s')}, pace_s={s.get('pace_s')}, target_s={s.get('target_s')}")
    
    # Check actual reading rate
    subs = [e for e in evs if e["stage"] == "packet_submitted"]
    if len(subs) >= 2:
        t0 = subs[0]["timestamp_ms"]
        t_last = subs[-1]["timestamp_ms"]
        effective_rate = len(subs) / ((t_last - t0) / 1000.0) if t_last > t0 else 0
        avg_power = sum(e.get("power_kw", 0) for e in subs) / len(subs)
        print(f"  actual submission rate: {effective_rate:.3f} readings/s, avg_power_kw={avg_power:.3f}")
        # r should be avg_power * pace_rate in kWh/s
        # If pace=6s, 1 reading every 6s, each reading = avg_power kW * (6s/3600) kWh
        # So energy rate = avg_power * (1/3600) kWh/reading * (1 reading / 6s) ??? No.
        # Actually, in the consensus engine, power_kw is directly added to batch_accumulated_kwh.
        # So the "rate" r = sum(power_kw) / total_time is the rate at which batch_accumulated_kwh
        # grows, which determines when threshold D is met and mint fires.
        # D* = r * Ttarget where r = readings_per_second * avg_power_kw
        r_correct = effective_rate * avg_power
        print(f"  r_correct (sub_rate * avg_power) = {r_correct:.4f}")
        print(f"  D*_correct = {r_correct * tt:.1f}")
