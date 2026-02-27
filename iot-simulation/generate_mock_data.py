#!/usr/bin/env python3
"""
Phase 1: Realistic Physics Data Generator (Modelica-style)
Generates 3 CSV files simulating real solar panel physics:
- realistic_sunny.csv (Ideal generation with temperature effects)
- realistic_cloudy.csv (Intermittent irradiance)
- realistic_fraud.csv (Data that violates physics rules)

Uses a simplified single-diode model (SDM) equivalent to Modelica solar components.
"""

import csv
import random
import math
from datetime import datetime, timedelta
import os

# --- Solar Panel Constants (Typical 350W Panel) ---
I_sc_ref = 9.8  # Short-circuit current reference (A)
V_oc_ref = 46.5 # Open-circuit voltage reference (V)
K_i = 0.005     # Temperature coefficient of I_sc (A/K)
K_v = -0.13     # Temperature coefficient of V_oc (V/K)
N_s = 72        # Number of cells in series
T_ref = 298.15  # Reference temperature (25 C in Kelvin)
k = 1.3806503e-23 # Boltzmann constant
q = 1.60217646e-19 # Electron charge
A = 1.2         # Diode ideality factor
E_g = 1.12      # Bandgap energy of silicon (eV)
# ----------------------------------------------------

def calculate_iv_point(irradiance_wm2, temp_c):
    """
    Calculates realistic output Current (A), Voltage (V), and Power (W)
    for a given solar irradiance and panel temperature using physics formulas.
    """
    if irradiance_wm2 <= 0:
        return 0.0, 0.0, 0.0
        
    T_cell = temp_c + 273.15 # Convert to Kelvin
    
    # Calculate photocurrent (I_ph) based on irradiance and temp
    I_ph = (I_sc_ref + K_i * (T_cell - T_ref)) * (irradiance_wm2 / 1000.0)
    
    # Calculate reverse saturation current (I_rs)
    I_rs = I_sc_ref / (math.exp((q * V_oc_ref) / (N_s * k * A * T_ref)) - 1)
    
    # Calculate saturation current (I_0)
    I_0 = I_rs * ((T_cell / T_ref) ** 3) * math.exp(((q * E_g) / (A * k)) * (1 / T_ref - 1 / T_cell))
    
    # Find the Maximum Power Point (MPP) via simple approximation
    # In a full Modelica sim, this is a non-linear solver (Newton-Raphson)
    # We approximate V_mp ≈ 0.8 * V_oc and I_mp ≈ 0.9 * I_sc
    
    V_oc = V_oc_ref + K_v * (T_cell - T_ref)
    
    # Approximate Maximum Power Point Tracking (MPPT)
    V_mpp = V_oc * 0.82
    I_mpp = I_ph - I_0 * (math.exp((q * V_mpp) / (N_s * k * A * T_cell)) - 1)
    
    # String configuration: Let's assume a 5kW system = ~14 panels in series
    total_V = V_mpp * 14
    total_I = I_mpp
    
    # Add slight inverter/grid variations
    total_V = total_V * random.uniform(0.98, 1.02)
    
    power_kw = (total_V * total_I) / 1000.0
    
    return max(0, total_V), max(0, total_I), max(0, power_kw)

def generate_csv(filename, device_id, rows, scenario="sunny"):
    """
    Generate mock energy data simulating standard physics: Power = Voltage * Current
    """
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Timestamp', 'Device_ID', 'Voltage', 'Current', 'Power_kW'])
        
        base_time = datetime.now() - timedelta(days=1)
        base_time = base_time.replace(hour=0, minute=0, second=0) # Start exactly at midnight
        
        for i in range(rows):
            # Time stepping: 5 minutes per row
            current_time = base_time + timedelta(minutes=5 * i)
            hour = current_time.hour + current_time.minute / 60.0 # Decimal hour
            
            # --- Calculate environmental conditions ---
            irradiance = 0.0
            temp_c = 15.0 # Base nighttime temp
            
            # Daylight hours generally 6 AM to 6 PM 
            if 6 <= hour <= 18:
                # Solar bell curve for irradiance (W/m^2)
                # Peaking at ~900 W/m^2 around noon
                hour_angle = (hour - 12) * (math.pi / 12) # Noon is 0
                irradiance = 900.0 * math.cos(hour_angle)
                
                # Temperature rises during the day
                temp_c = 15.0 + 15.0 * math.cos(hour_angle) 
                
                if scenario == "cloudy":
                    # Realistic cloud cover fluctuations (fractal/noise-like drops)
                    if random.random() < 0.4:
                        cloud_thickness = random.uniform(0.1, 0.8) # 10% to 80% light blocked
                        irradiance = irradiance * (1.0 - cloud_thickness)
            
            # --- Apply Physics Model ---
            v, current_amp, p_kw = calculate_iv_point(irradiance, temp_c)
            
            # Set grid voltage even when not generating (system is plugged in)
            if p_kw == 0:
                v = 230.0 + random.uniform(-1.0, 1.0)
                current_amp = 0.0
            else:
                 # Invert DC to grid AC equivalent for simple reporting
                 # If inverter is 230V AC, the current shifts to match power
                 v = 230.0 + random.uniform(-2.0, 2.0)
                 current_amp = (p_kw * 1000.0) / v
            
            # --- Inject Fraud Vectors ---
            if scenario == "fraud":
                if 6 <= hour <= 18:
                    if random.random() < 0.15:
                        # Fraud 1: Over-reporting generation (Voltage * Current math breaks!)
                        p_kw = p_kw * 1.5 
                    elif random.random() < 0.15:
                        # Fraud 2: Over-capacity (Exceeds typical 5kW home setup)
                        current_amp = current_amp + 35.0
                        p_kw = (v * current_amp) / 1000.0
                elif 0 <= hour <= 4:
                    if random.random() < 0.2:
                        # Fraud 3: Generating power in the dead of night
                        current_amp = 12.0
                        p_kw = (v * current_amp) / 1000.0
            
            writer.writerow([
                current_time.isoformat(),
                device_id,
                round(v, 2),
                round(current_amp, 2),
                round(p_kw, 3)
            ])
    
    print(f"Generated {rows} rows in {filename} (Scenario: {scenario})")

if __name__ == "__main__":
    os.makedirs('mock_data', exist_ok=True)
    # Generate 24 hours of data (288 rows of 5-min intervals)
    generate_csv('mock_data/realistic_sunny.csv', 'solar_node_alpha', 288, scenario="sunny")
    generate_csv('mock_data/realistic_cloudy.csv', 'solar_node_beta', 288, scenario="cloudy")
    generate_csv('mock_data/realistic_fraud.csv', 'solar_node_gamma', 288, scenario="fraud")
    
    print("\n✓ Phase 1: Realistic Physics Data Generation Complete.")
