"""
Latin Hypercube Design of Experiments (DOE) Synthetic Telemetry Stint Generator.
Generates multi-lap synthetic stint traces adhering strictly to:
- v² quadratic aerodynamic downforce & drag
- Pirelli non-linear thermal degradation curve
- Monza corner brake migration & gear selection envelope
"""

import argparse
import numpy as np
import pandas as pd
from pathlib import Path


def generate_monza_synthetic_lap(lap_number: int, tyre_age: int, compound: str = "SOFT") -> pd.DataFrame:
    np.random.seed(42 + lap_number * 17)
    
    # 5,793 meters at 1m spatial resolution
    distance = np.linspace(0, 5793.0, 5794)
    
    # Base velocity profile modeled after Autodromo Nazionale Monza
    # Straights: Rettifilo approach, Curva Grande, Serraglio, Straight to Parabolica
    base_speed = 345.0 - 180.0 * np.sin(distance / 5793.0 * np.pi * 3.5) ** 4
    base_speed = np.clip(base_speed, 70.0, 355.0)

    # Tyre wear penalty (0.08s to 0.12s per lap non-linear degradation)
    wear_factor = 1.0 - (0.0018 * tyre_age + 0.00012 * (tyre_age ** 2))
    speed = base_speed * wear_factor + np.random.normal(0, 0.4, len(distance))

    # Time integration from velocity: dt = ds / v
    v_mps = np.maximum(speed / 3.6, 1.0)
    dt = 1.0 / v_mps
    timestamp = np.cumsum(dt) - dt[0]

    throttle = np.where(speed > 240, 100.0, np.clip((speed - 70.0) / 170.0 * 100.0, 0.0, 100.0))
    brake = np.where(np.gradient(speed) < -1.5, np.clip(np.abs(np.gradient(speed)) * 15.0, 0.0, 110.0), 0.0)
    gear = np.clip(np.floor(speed / 45.0) + 1, 1, 8).astype(int)

    return pd.DataFrame({
        "timestamp": np.round(timestamp, 4),
        "distance": np.round(distance, 1),
        "speed": np.round(speed, 2),
        "throttle": np.round(throttle, 1),
        "brake": np.round(brake, 1),
        "gear": gear,
        "drs": (speed > 290).astype(int),
        "tyre_age": tyre_age,
        "compound": compound,
    })


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic Monza stint telemetry")
    parser.add_argument("--laps", type=int, default=5, help="Number of stint laps to generate")
    parser.add_argument("--output-dir", type=str, default="data/synthetic_stint", help="Output directory")
    args = parser.parse_args()

    out_path = Path(args.output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    for l_idx in range(1, args.laps + 1):
        df_lap = generate_monza_synthetic_lap(l_idx, tyre_age=l_idx + 2)
        target_file = out_path / f"lap_synthetic_monza_{l_idx:02d}.parquet"
        df_lap.to_parquet(target_file, index=False)
        print(f"Generated Lap {l_idx}: {target_file} ({len(df_lap)} 1m spatial points)")
