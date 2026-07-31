#!/bin/bash
cd /Users/keshavs/Desktop/Joulet_Beta/iot-simulation

# Run ttarget 60s (1800s) and 120s (2400s)
.venv/bin/python experiments/run_ttarget.py 60 1800 20 ../paper_experiments/data/ttarget.jsonl &
PID1=$!
.venv/bin/python experiments/run_ttarget.py 120 2400 21 ../paper_experiments/data/ttarget.jsonl &
PID2=$!

wait $PID1
wait $PID2

# Run Profiles at 60s (2 trials of 900s each)
for p in A_high B_low C_volatile D_ramp; do
    .venv/bin/python experiments/run_profile_trial.py $p 0 900 60.0 30 ../paper_experiments/data/profiles_${p}_60s.jsonl
    .venv/bin/python experiments/run_profile_trial.py $p 1 900 60.0 31 ../paper_experiments/data/profiles_${p}_60s.jsonl
done
