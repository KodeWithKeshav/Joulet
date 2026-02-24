
import random
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from datetime import datetime
import os

# --- Configuration for Simulation ---
SIM_STEPS = 300  # 300 seconds (5 minutes) per case
TARGET_INTERVAL = 15.0 # Target seconds between transactions
DIFF_MIN = 1.0
DIFF_MAX = 100.0
INITIAL_DIFF = 10.0

# --- The Adaptive Logical Core (Simplified from api_bridge.py) ---
class AdaptiveSimulator:
    def __init__(self):
        self.difficulty = INITIAL_DIFF
        self.accumulated_energy = 0.0
        self.last_tx_time = -TARGET_INTERVAL # Start "fresh"
        self.tx_history = [] # List of (time, amount) tuples
        self.diff_history = [] # List of (time, difficulty) tuples
        self.energy_history = [] # List of (time, accumulated) tuples
        
    def step(self, current_time, generated_kwh):
        self.accumulated_energy += generated_kwh
        
        # Difficulty Adjustment Logic
        should_report = self.accumulated_energy >= self.difficulty
        
        if should_report:
            # Valid Transaction Triggered
            time_delta = current_time - self.last_tx_time
            
            # Record Transaction
            self.tx_history.append((current_time, self.accumulated_energy))
            
            # Adjust Difficulty
            old_diff = self.difficulty
            if time_delta < TARGET_INTERVAL:
                # Too fast -> Increase Difficulty
                self.difficulty = min(DIFF_MAX, self.difficulty * 1.1)
            else:
                # Too slow -> Decrease Difficulty
                self.difficulty = max(DIFF_MIN, self.difficulty * 0.9)
                
            self.accumulated_energy = 0.0
            self.last_tx_time = current_time

        # Always record state
        self.diff_history.append((current_time, self.difficulty))
        self.energy_history.append((current_time, self.accumulated_energy))
        
        return should_report

# --- Define the 4 Cases ---

def run_case(case_name, generator_func):
    sim = AdaptiveSimulator()
    times = []
    productions = []
    
    for t in range(SIM_STEPS):
        gen = generator_func(t)
        sim.step(t, gen)
        times.append(t)
        productions.append(gen)
        
    return {
        "name": case_name,
        "times": times,
        "productions": productions,
        "difficulty": [d[1] for d in sim.diff_history],
        "transactions": sim.tx_history
    }

# 1. High Constant (Summer Noon)
def gen_high_constant(t):
    return random.uniform(2.5, 3.0) # ~2.75 kWh per sec (Unrealistically high for a home but good for stress test) - actually let's scale it to fit the 10kWh threshold better.
    # If Threshold is 10, and we want ~15s interval, we need ~0.66 kWh/s.
    # Let's make High = 1.5 kWh/s -> Should trigger every ~7s -> Difficulty should skyrocket.

def gen_high(t):
    return 1.5 + random.uniform(-0.1, 0.1)

# 2. Low Constant (Winter Evening)
# Target > 15s. So < 0.66 kWh/s.
# Let's make Low = 0.1 kWh/s -> Should trigger every 100s -> Difficulty should crash.
def gen_low(t):
    return 0.1 + random.uniform(-0.02, 0.02)

# 3. Volatile (Cloudy Day)
# Fluctuates wildly between 0.1 and 2.0
def gen_volatile(t):
    # Use a sine wave + noise
    base = 1.0 + 0.9 * np.sin(t / 20.0) # Period of ~120s
    return max(0.05, base + random.uniform(-0.2, 0.2))

# 4. Ramp Up (Sunrise)
# Linearly increases from 0.1 to 1.5
def gen_ramp(t):
    return 0.1 + (1.4 * (t / SIM_STEPS)) + random.uniform(-0.1, 0.1)

# --- Execution ---
results = []
results.append(run_case("Case A: High Production (1.5 kW/s)", gen_high))
results.append(run_case("Case B: Low Production (0.1 kW/s)", gen_low))
results.append(run_case("Case C: Volatile (Cloudy)", gen_volatile))
results.append(run_case("Case D: Ramp Up (Sunrise)", gen_ramp))

# --- Plotting ---
plt.style.use('seaborn-v0_8-whitegrid')
# Increase complexity of layout for visibility (4 rows, 1 col)
# Tall figure to fit in single column width but readable
fig, axs = plt.subplots(4, 1, figsize=(10, 16)) 
fig.suptitle('Joulet Adaptive Difficulty Response Analysis', fontsize=16)

for i, res in enumerate(results):
    ax1 = axs[i]
    
    times = res['times']
    
    # Plot Production (Left Axis)
    ax1.plot(times, res['productions'], color='orange', alpha=0.6, label='Energy Gen (kWh/s)')
    ax1.set_xlabel('Time (s)')
    ax1.set_ylabel('Gen Rate', color='orange')
    ax1.tick_params(axis='y', labelcolor='orange')
    
    # Set limits based on case
    if "High" in res['name']:
        ax1.set_ylim(0, 3.0)
    elif "Low" in res['name']:
         ax1.set_ylim(0, 1.0)
    else:
         ax1.set_ylim(0, 2.5)

    
    # Plot Difficulty (Right Axis)
    ax2 = ax1.twinx()
    ax2.plot(times, res['difficulty'], color='blue', linewidth=2, label='Difficulty')
    ax2.set_ylabel('Diff (kWh)', color='blue')
    ax2.tick_params(axis='y', labelcolor='blue')
    ax2.set_ylim(0, 105)
    
    # Plot Transactions
    tx_times = [tx[0] for tx in res['transactions']]
    tx_vals = [res['difficulty'][t] for t in tx_times] 
    
    ax2.scatter(tx_times, tx_vals, color='red', marker='x', s=60, zorder=5, label='Tx Minted')
    
    ax1.set_title(res['name'], fontsize=12, fontweight='bold')
    
    # Legend (Combine both axes) - Only on first plot to save space? Or simplified?
    # Let's put legend on top right of each
    if i == 0:
        lines1, labels1 = ax1.get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=8, framealpha=0.8)

plt.tight_layout()
plt.subplots_adjust(top=0.94, hspace=0.4)

output_path = 'experimental_results_4cases.png'
plt.savefig(output_path, dpi=300)
print(f"Graph saved to {os.path.abspath(output_path)}")
