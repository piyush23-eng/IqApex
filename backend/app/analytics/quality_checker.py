import math
from typing import ClassVar

import numpy as np

from app.schemas.domain import Lap, TelemetryPoint
from app.schemas.quality import DataQualityResult, DataQualityStatus


class TelemetryQualityChecker:
    """
    Validates raw telemetry sequences and lap timing data against physical
    boundaries, continuity constraints, and acquisition integrity standards.
    """

    SPEED_BOUNDS = (0.0, 395.0)  # km/h
    THROTTLE_BOUNDS = (0.0, 100.0)  # %
    BRAKE_BOUNDS = (0.0, 150.0)  # bar or % (normalized max tolerance 150)
    RPM_BOUNDS = (0, 16000)  # RPM limit (current 1.6L V6 turbo-hybrid regulations)
    ALLOWED_GEARS: ClassVar[set[int]] = set(
        range(-1, 9)
    )  # Reverse (-1), Neutral (0), 1-8
    DRS_STATES: ClassVar[set[int]] = {0, 1}
    LAT_ACCEL_BOUNDS = (-6.5, 6.5)  # g
    LONG_ACCEL_BOUNDS = (-6.5, 3.5)  # g (heavy braking ~-5.5g to -6g, traction ~+2.5g)
    MAX_ALLOWABLE_SAMPLE_GAP_SEC = 0.25  # 250ms gap indicates telemetry loss
    MAX_JITTER_CV = 0.50  # Coefficient of variation in dt

    @classmethod
    def evaluate_lap(
        cls,
        lap: Lap | None,
        telemetry: list[TelemetryPoint],
        nominal_hz: float = 20.0,
    ) -> DataQualityResult:
        warnings: list[str] = []
        total_checks = 0
        invalid_checks = 0
        missing_count = 0

        # 1. Lap Timing Validation
        if lap is not None:
            total_checks += 4
            if lap.lap_time <= 30.0 or lap.lap_time >= 300.0:
                warnings.append(
                    f"Lap time {lap.lap_time:.3f}s outside realistic track envelope [30.0s, 300.0s]"
                )
                invalid_checks += 1
            if lap.sector_1 <= 5.0 or lap.sector_2 <= 5.0 or lap.sector_3 <= 5.0:
                warnings.append(
                    "One or more sector times below physical minimum threshold (5.0s)"
                )
                invalid_checks += 1

            # Sector sum verification
            sector_sum = lap.sector_1 + lap.sector_2 + lap.sector_3
            if abs(sector_sum - lap.lap_time) > 0.05:
                warnings.append(
                    f"Sector sum discrepancy: S1+S2+S3 ({sector_sum:.3f}s) != LapTime ({lap.lap_time:.3f}s)"
                )
                invalid_checks += 1

            if not lap.valid:
                warnings.append(
                    "Lap flagged invalid by marshaling / track limits system"
                )

        # 2. Telemetry Point Integrity
        n_points = len(telemetry)
        if n_points == 0:
            return DataQualityResult(
                status=DataQualityStatus.FAIL,
                quality_score=0.0,
                missing_percentage=100.0,
                invalid_percentage=100.0,
                warnings=["Empty telemetry series: 0 points provided"],
            )

        # Check critical channels
        timestamps = []
        distances = []
        dts = []

        seen_timestamps = set()
        duplicate_timestamp_count = 0
        discontinuity_count = 0
        negative_distance_count = 0
        sensor_violation_count = 0

        for i, pt in enumerate(telemetry):
            total_checks += (
                9  # timestamp, distance, speed, throttle, brake, gear, rpm, lat, long
            )

            # Missing or NaN check
            for val in [
                pt.timestamp,
                pt.distance,
                pt.speed,
                pt.throttle,
                pt.brake,
                pt.lateral_acceleration,
                pt.longitudinal_acceleration,
            ]:
                if val is None or math.isnan(val) or math.isinf(val):
                    missing_count += 1

            # Duplicate timestamp check
            ts_key = round(pt.timestamp, 4)
            if ts_key in seen_timestamps:
                duplicate_timestamp_count += 1
            else:
                seen_timestamps.add(ts_key)

            timestamps.append(pt.timestamp)
            distances.append(pt.distance)

            # Delta time and discontinuity check
            if i > 0:
                dt = pt.timestamp - telemetry[i - 1].timestamp
                dts.append(dt)
                if dt < 0 or dt > cls.MAX_ALLOWABLE_SAMPLE_GAP_SEC:
                    discontinuity_count += 1

                # Distance monotonicity
                dd = pt.distance - telemetry[i - 1].distance
                if (
                    dd < -1.0
                ):  # Allow minor tolerance, negative jump > 1m indicates reset
                    negative_distance_count += 1

            # Physical Sensor Boundaries
            if not (cls.SPEED_BOUNDS[0] <= pt.speed <= cls.SPEED_BOUNDS[1]):
                sensor_violation_count += 1
            if not (cls.THROTTLE_BOUNDS[0] <= pt.throttle <= cls.THROTTLE_BOUNDS[1]):
                sensor_violation_count += 1
            if not (cls.BRAKE_BOUNDS[0] <= pt.brake <= cls.BRAKE_BOUNDS[1]):
                sensor_violation_count += 1
            if pt.gear not in cls.ALLOWED_GEARS:
                sensor_violation_count += 1
            if not (cls.RPM_BOUNDS[0] <= pt.rpm <= cls.RPM_BOUNDS[1]):
                sensor_violation_count += 1
            if pt.drs not in cls.DRS_STATES:
                sensor_violation_count += 1
            if not (
                cls.LAT_ACCEL_BOUNDS[0]
                <= pt.lateral_acceleration
                <= cls.LAT_ACCEL_BOUNDS[1]
            ):
                sensor_violation_count += 1
            if not (
                cls.LONG_ACCEL_BOUNDS[0]
                <= pt.longitudinal_acceleration
                <= cls.LONG_ACCEL_BOUNDS[1]
            ):
                sensor_violation_count += 1

        if duplicate_timestamp_count > 0:
            warnings.append(
                f"Detected {duplicate_timestamp_count} duplicate timestamps"
            )
            invalid_checks += duplicate_timestamp_count

        if discontinuity_count > 0:
            warnings.append(
                f"Detected {discontinuity_count} telemetry time discontinuities (> {cls.MAX_ALLOWABLE_SAMPLE_GAP_SEC}s or backwards)"
            )
            invalid_checks += discontinuity_count

        if negative_distance_count > 0:
            warnings.append(
                f"Detected {negative_distance_count} negative distance increments"
            )
            invalid_checks += negative_distance_count

        if sensor_violation_count > 0:
            warnings.append(
                f"Detected {sensor_violation_count} physical sensor boundary violations"
            )
            invalid_checks += sensor_violation_count

        # 3. Sampling Jitter Analysis
        if len(dts) > 5:
            dts_arr = np.array(dts)
            mean_dt = float(np.mean(dts_arr))
            std_dt = float(np.std(dts_arr))
            if mean_dt > 0:
                cv = std_dt / mean_dt
                if cv > cls.MAX_JITTER_CV:
                    warnings.append(
                        f"Inconsistent sampling interval: jitter CV {cv:.2f} exceeds threshold {cls.MAX_JITTER_CV:.2f} (mean dt: {mean_dt * 1000:.1f}ms, std: {std_dt * 1000:.1f}ms)"
                    )
                    invalid_checks += 5

        # Compute metric percentages
        invalid_checks += missing_count
        missing_pct = round((missing_count / max(1, total_checks)) * 100.0, 2)
        invalid_pct = round((invalid_checks / max(1, total_checks)) * 100.0, 2)

        # Compute quality score (100 is pristine)
        penalty = (missing_pct * 1.5) + (invalid_pct * 1.2)
        quality_score = max(0.0, min(100.0, round(100.0 - penalty, 1)))

        # Status determination
        if quality_score >= 95.0 and len(warnings) == 0:
            status = DataQualityStatus.PASS
        elif quality_score >= 80.0:
            status = DataQualityStatus.WARNING
        else:
            status = DataQualityStatus.FAIL

        return DataQualityResult(
            status=status,
            quality_score=quality_score,
            missing_percentage=missing_pct,
            invalid_percentage=min(100.0, invalid_pct),
            warnings=warnings,
        )
