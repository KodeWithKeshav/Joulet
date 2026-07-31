import subprocess
import os

os.chdir("iot-simulation")

profiles = ["A_high", "B_low", "C_volatile", "D_ramp"]

for p in profiles:
    for trial in [0, 1]:
        print(f"Running {p} trial {trial}...")
        subprocess.run([
            ".venv/bin/python", "experiments/run_profile_trial.py",
            p, str(trial), "900", "60.0", str(30 + trial),
            f"../paper_experiments/data/profiles_{p}_60s.jsonl"
        ], check=True)
