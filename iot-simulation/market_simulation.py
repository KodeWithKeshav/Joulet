
import matplotlib.pyplot as plt
import numpy as np
import random
import os

# Configuration
HOURS = 24
STEPS_PER_HOUR = 60
TOTAL_STEPS = HOURS * STEPS_PER_HOUR

# Market Variables
# Initial Liquidity for Price Model (XY=K)
POOL_TOKEN_RESERVE = 10000.0
POOL_ETH_RESERVE = 10.0 # 1 ETH = 1000 Tokens initially
K_CONSTANT = POOL_TOKEN_RESERVE * POOL_ETH_RESERVE

# History
time_history = []
minting_history = []
price_history = []

# Simulation Loop
for t in range(TOTAL_STEPS):
    hour = t / STEPS_PER_HOUR
    
    # --- 1. MINTING (Supply Shock) ---
    generation = 0.0
    if 6 <= hour <= 18:
        intensity = max(0, 1 - ((hour - 12) / 6) ** 2)
        generation = intensity * 5.0 + random.uniform(-0.1, 0.1) # Higher generation for market impact
    
    mint_amount = max(0, generation)
    
    # --- 2. MARKET MAKER LOGIC ---
    # Producers sell (scan) 80% of what they mint immediately
    # This increases Token Reserve in Pool -> Lowers Price
    sell_pressure = mint_amount * 0.8
    
    # Consumers buy (scan) constant demand + random variance
    # This decreases Token Reserve in Pool -> Raises Price
    base_demand = 1.0 # Constant demand
    buy_pressure = base_demand + random.uniform(-0.5, 1.5)
    
    # Update Pool
    # Sell: Add Tokens to Pool, Remove ETH
    POOL_TOKEN_RESERVE += sell_pressure
    POOL_ETH_RESERVE = K_CONSTANT / POOL_TOKEN_RESERVE
    
    # Buy: Remove Tokens from Pool, Add ETH
    # Check if pool has enough tokens
    if POOL_TOKEN_RESERVE > buy_pressure:
        POOL_TOKEN_RESERVE -= buy_pressure
        POOL_ETH_RESERVE = K_CONSTANT / POOL_TOKEN_RESERVE
    
    # Calculate Price (ETH per Token)
    current_price = POOL_ETH_RESERVE / POOL_TOKEN_RESERVE
    
    # Record
    time_history.append(hour)
    minting_history.append(mint_amount)
    price_history.append(current_price * 1000) # Normailzed Price (Initial = 1.0)

# --- Plotting ---
plt.style.use('seaborn-v0_8-whitegrid')
fig, ax1 = plt.subplots(figsize=(10, 6))

time_axis = np.array(time_history)

# Left Axis: Minting (Supply)
ax1.fill_between(time_axis, 0, minting_history, color='orange', alpha=0.3, label='Minting Volume (Supply)')
ax1.set_xlabel('Time of Day (Hour)')
ax1.set_ylabel('Minting Rate (Tokens/min)', color='orange')
ax1.tick_params(axis='y', labelcolor='orange')
ax1.set_ylim(0, 6)

# Right Axis: Price
ax2 = ax1.twinx()
ax2.plot(time_axis, price_history, color='green', linewidth=2, label='Token Price (Normalized)')
ax2.set_ylabel('Market Price (Index)', color='green')
ax2.tick_params(axis='y', labelcolor='green')
ax2.set_ylim(0.8, 1.4)

# Title
plt.title('Market Dynamics: Minting Supply vs Token Price', fontsize=14)

# Legend
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right')

plt.tight_layout()
output_path = 'market_dynamics.png'
plt.savefig(output_path, dpi=300)
print(f"Graph saved to {os.path.abspath(output_path)}")
