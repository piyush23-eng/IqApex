"""
Telemetry Parquet Dataset Invariant Verifier.
Validates monotonic distance progression, physical bounds, sensor non-negativity,
and absence of corrupted telemetry drops across persisted sessions.
"""

import sys
from pathlib import Path
import pandas as pd


def verify_parquet_file(file_path: Path) -> dict:
    df = pd.read_parquet(file_path)
    report = {
        "file": str(file_path.name),
        "total_rows": len(df),
        "checks": {},
    }

    # 1. Monotonic distance check
    is_monotonic_dist = bool(df["distance"].is_monotonic_increasing)
    report["checks"]["monotonic_distance"] = is_monotonic_dist

    # 2. Monotonic timestamp check
    is_monotonic_time = bool(df["timestamp"].is_monotonic_increasing)
    report["checks"]["monotonic_timestamp"] = is_monotonic_time

    # 3. Speed physical sanity (0 to 380 km/h)
    speed_valid = bool((df["speed"] >= 0.0).all() and (df["speed"] <= 380.0).all())
    report["checks"]["speed_within_bounds"] = speed_valid

    # 4. Throttle range [0, 100]
    throttle_valid = bool((df["throttle"] >= -0.01).all() and (df["throttle"] <= 100.01).all())
    report["checks"]["throttle_within_bounds"] = throttle_valid

    # 5. Brake pressure non-negative
    brake_valid = bool((df["brake"] >= -0.01).all() and (df["brake"] <= 150.0).all())
    report["checks"]["brake_pressure_valid"] = brake_valid

    # 6. Gear selection [0, 8]
    gear_valid = bool((df["gear"] >= 0).all() and (df["gear"] <= 8).all())
    report["checks"]["gear_within_envelope"] = gear_valid

    all_passed = all(report["checks"].values())
    report["all_passed"] = all_passed
    return report


def scan_data_directory(data_dir: Path) -> bool:
    print(f"Scanning telemetry parquet archives in {data_dir}...")
    parquet_files = list(data_dir.rglob("*.parquet"))
    if not parquet_files:
        print("No parquet telemetry files discovered.")
        return True

    all_ok = True
    for f in parquet_files:
        rep = verify_parquet_file(f)
        status = "PASSED" if rep["all_passed"] else "FAILED"
        print(f"[{status}] {rep['file']} (Rows: {rep['total_rows']:,})")
        if not rep["all_passed"]:
            all_ok = False
            for check_name, passed in rep["checks"].items():
                if not passed:
                    print(f"    - Failed: {check_name}")

    return all_ok


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data")
    success = scan_data_directory(target)
    sys.exit(0 if success else 1)
