
import matplotlib.pyplot as plt
import numpy as np
import random
import os

# Configuration
HOURS = 24
STEPS_PER_HOUR = 60
TOTAL_STEPS = HOURS * STEPS_PER_HOUR

# Simulated Wallets
PRODUCER_BALANCE = 0.0
CONSUMER_BALANCE = 0.0
GRID_UTILITY_BALANCE = 0.0

# History
time_history = []
producer_history = []
consumer_history = []
utility_history = []
events = [] # (time, type, value)

# Simulation Loop
for t in range(TOTAL_STEPS):
    hour = t / STEPS_PER_HOUR
    
    # --- 1. MINTING (Solar Generation) ---
    # Bell curve for solar (peak at hour 12)
    if 6 <= hour <= 18:
        # Simple parabolic curve
        intensity = max(0, 1 - ((hour - 12) / 6) ** 2)
        generation = intensity * 2.0 + random.uniform(-0.1, 0.1) # kWh/min
        
        # Accumulate (Minting happens in batches in real system, but continuous here for smooth graph)
        # In reality, minting happens when threshold reached.
        # Let's simple add to producer balance
        mint_amount = max(0, generation)
        PRODUCER_BALANCE += mint_amount
    
    # --- 2. TRADING (P2P Transfer) ---
    # Producer sells to Consumer during high generation or accumulated stock
    if PRODUCER_BALANCE > 50 and random.random() < 0.1:
        trade_amount = random.uniform(10, 30)
        PRODUCER_BALANCE -= trade_amount
        CONSUMER_BALANCE += trade_amount
        events.append((t, 'TRADE', trade_amount))

    # --- 3. BURNING (Utility Redemption) ---
    # Consumer spends tokens to pay for grid electricity at night or fees
    # Or Producer pays fees.
    # Let's say Consumer burns tokens to offset bill.
    if CONSUMER_BALANCE > 20 and random.random() < 0.05:
        burn_amount = random.uniform(5, 15)
        CONSUMER_BALANCE -= burn_amount
        GRID_UTILITY_BALANCE += burn_amount # Transferred to Utility for burning/cycling
        events.append((t, 'BURN', burn_amount))
        
    # Record History
    time_history.append(hour)
    producer_history.append(PRODUCER_BALANCE)
    consumer_history.append(CONSUMER_BALANCE)
    utility_history.append(GRID_UTILITY_BALANCE)

# --- Plotting ---
plt.style.use('seaborn-v0_8-whitegrid')
fig, ax = plt.subplots(figsize=(10, 6))

# Stackplot or Line plot? Line plot is clearer for balances.
ax.plot(time_history, producer_history, label='Producer (Source)', color='orange', linewidth=2)
ax.plot(time_history, consumer_history, label='Consumer (Trader)', color='blue', linewidth=2)
ax.plot(time_history, utility_history, label='Utility/Burned (Sink)', color='gray', linestyle='--', linewidth=2)

# Annotate significant events
# Find max trade
max_trade = max([e for e in events if e[1] == 'TRADE'], key=lambda x: x[2])
ax.annotate(f'Big Trade\n{max_trade[2]:.1f} JLT', 
            xy=(max_trade[0]/60, producer_history[max_trade[0]]), 
            xytext=(max_trade[0]/60, producer_history[max_trade[0]]+100),
            arrowprops=dict(facecolor='black', shrink=0.05))

ax.set_title('Token Economy Lifecycle (24h Simulation)', fontsize=14)
ax.set_xlabel('Time of Day (Hour)')
ax.set_ylabel('Token Balance (JLT)')
ax.legend(loc='upper left')
ax.grid(True, alpha=0.3)
ax.set_xlim(0, 24)
ax.set_xticks(range(0, 25, 4))

# Fill area to show "Volume"
ax.fill_between(time_history, 0, producer_history, color='orange', alpha=0.1)
ax.fill_between(time_history, 0, consumer_history, color='blue', alpha=0.05)

plt.tight_layout()
output_path = 'token_lifecycle.png'
plt.savefig(output_path, dpi=300)
print(f"Graph saved to {os.path.abspath(output_path)}")
