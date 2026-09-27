import math
from pathlib import Path

import pandas as pd

# Explicit metadata label
DATA_LABEL = "Synthetic demonstration dataset"

data_dir = Path(__file__).parent
csv_path = data_dir / "synthetic_telemetry.csv"
parquet_path = data_dir / "synthetic_telemetry.parquet"

# Create 500 samples of realistic track telemetry with raw logger aliases
# e.g. vCar, rThrottlePedal, pBrakeF, nGear, nEngine, latAccel, longAccel, LapDist, Time
n = 500
track_len = 3500.0  # meters
lap_time = 65.0  # seconds
dt = lap_time / (n - 1)

times = [round(i * dt, 4) for i in range(n)]
distances = [round((i / (n - 1)) * track_len, 2) for i in range(n)]

speeds = []
throttles = []
brakes = []
gears = []
rpms = []
drss = []
lat_accels = []
long_accels = []

for s in distances:
    # Corner 1 at 800-1100m, Corner 2 at 2200-2600m
    if s < 700:
        v = 220.0 + (s / 700.0) * 85.0
        thr = 100.0
        brk = 0.0
        g = 7
        rpm = 12000
        drs = 1
        lat = 0.1
        lon = 0.4
    elif s < 1050:
        # Braking and corner 1
        p = (s - 700.0) / 350.0
        v = 305.0 - p * (305.0 - 95.0)
        thr = 0.0 if p < 0.7 else 25.0
        brk = 90.0 * (1.0 - p) if p < 0.6 else 0.0
        g = 3
        rpm = 10000
        drs = 0
        lat = 3.2 * math.sin(p * math.pi)
        lon = -4.2 * (1.0 - p)
    elif s < 2100:
        # Full throttle acceleration
        p = (s - 1050.0) / 1050.0
        v = 95.0 + p * (290.0 - 95.0)
        thr = min(100.0, 50.0 + p * 50.0)
        brk = 0.0
        g = min(8, 3 + int(p * 5))
        rpm = 11200 + int(p * 1500)
        drs = 0
        lat = 0.2
        lon = 0.6
    elif s < 2550:
        # Corner 2
        p = (s - 2100.0) / 450.0
        v = 290.0 - p * (290.0 - 110.0)
        thr = 0.0 if p < 0.5 else 40.0
        brk = 80.0 * (1.0 - p) if p < 0.5 else 0.0
        g = 3
        rpm = 10200
        drs = 0
        lat = -3.5 * math.sin(p * math.pi)
        lon = -3.8 * (1.0 - p)
    else:
        # Final straight
        p = (s - 2550.0) / (track_len - 2550.0)
        v = 110.0 + p * (270.0 - 110.0)
        thr = 100.0
        brk = 0.0
        g = min(7, 3 + int(p * 4))
        rpm = 11800
        drs = 1 if p > 0.5 else 0
        lat = 0.0
        lon = 0.5

    speeds.append(round(v, 2))
    throttles.append(round(thr, 1))
    brakes.append(round(brk, 1))
    gears.append(int(g))
    rpms.append(int(rpm))
    drss.append(int(drs))
    lat_accels.append(round(lat, 2))
    long_accels.append(round(lon, 2))

# Use logger aliases to verify ChannelMapper!
df = pd.DataFrame(
    {
        "Time": times,
        "LapDist": distances,
        "vCar": speeds,
        "rThrottlePedal": throttles,
        "pBrakeF": brakes,
        "nGear": gears,
        "nEngine": rpms,
        "DRS": drss,
        "latAccel": lat_accels,
        "longAccel": long_accels,
    }
)

# Add header comment documenting synthetic dataset
with open(csv_path, "w", encoding="utf-8") as f:
    f.write("# Synthetic demonstration dataset - ApexIQ Test Calibration Data\n")
    df.to_csv(f, index=False)

df.to_parquet(parquet_path, engine="pyarrow", index=False)
print(f"Generated {csv_path} and {parquet_path} ({len(df)} rows)")
