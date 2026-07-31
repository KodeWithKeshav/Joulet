#!/bin/bash
cd /Users/keshavs/Desktop/Joulet_Beta/iot-simulation

# 2 trials per profile, 900s each
for trial in 0 1; do
    echo "Running trial $trial for A_high and B_low..."
    .venv/bin/python experiments/run_profile_trial.py A_high $trial 900 60.0 1 ../paper_experiments/data/profiles_A_high_60s.jsonl &
    P1=$!
    .venv/bin/python experiments/run_profile_trial.py B_low $trial 900 60.0 2 ../paper_experiments/data/profiles_B_low_60s.jsonl &
    P2=$!
    wait $P1
    wait $P2

    echo "Running trial $trial for C_volatile and D_ramp..."
    .venv/bin/python experiments/run_profile_trial.py C_volatile $trial 900 60.0 1 ../paper_experiments/data/profiles_C_volatile_60s.jsonl &
    P1=$!
    .venv/bin/python experiments/run_profile_trial.py D_ramp $trial 900 60.0 2 ../paper_experiments/data/profiles_D_ramp_60s.jsonl &
    P2=$!
    wait $P1
    wait $P2
done
echo "All done!"
