#!/bin/bash
cd /Users/keshavs/Desktop/Joulet_Beta/iot-simulation

.venv/bin/python experiments/run_profile_trial.py A_high 0 900 60.0 30 ../paper_experiments/data/profiles_A_high_60s.jsonl &
.venv/bin/python experiments/run_profile_trial.py B_low 0 900 60.0 31 ../paper_experiments/data/profiles_B_low_60s.jsonl &
.venv/bin/python experiments/run_profile_trial.py C_volatile 0 900 60.0 32 ../paper_experiments/data/profiles_C_volatile_60s.jsonl &
.venv/bin/python experiments/run_profile_trial.py D_ramp 0 900 60.0 33 ../paper_experiments/data/profiles_D_ramp_60s.jsonl &

wait
