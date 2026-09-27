import math
from datetime import datetime, timezone

import pandas as pd

from app.schemas.domain import Corner, Driver, Lap, Run, Session, TelemetryPoint
from app.schemas.lineage import ProcessingRun

DEMO_DATA_LABEL = "Synthetic demonstration dataset"


class TelemetryDataStore:
    """
    In-memory / repository abstraction for session, run, lap, telemetry, and lineage.
    Acts as the staging layer before persistent database queries.
    """

    def __init__(self) -> None:
        self.sessions: dict[str, Session] = {}
        self.drivers: dict[str, Driver] = {}
        self.runs: dict[str, Run] = {}
        self.laps: dict[str, Lap] = {}
        self.telemetry_points: dict[str, list[TelemetryPoint]] = {}
        self.corners: dict[str, list[Corner]] = {}
        self.processing_runs: dict[str, ProcessingRun] = {}
        self.lap_lineage: dict[str, str] = {}  # lap_id -> processing_run_id
        self._init_demo_data()

    def _init_demo_data(self) -> None:
        # Initial demonstration dataset — explicitly labeled
        session_id = "demo-session-monza-2026"
        self.sessions[session_id] = Session(
            session_id=session_id,
            event_name="2026 Italian GP — FP2",
            circuit="Autodromo Nazionale Monza",
            session_type="FP2",
            date="2026-09-04",
            weather="Dry / Track Temp 38.5°C",
            track_temperature=38.5,
        )

        driver_id = "drv-44"
        self.drivers[driver_id] = Driver(
            driver_id=driver_id,
            name="L. Hamilton",
            team="Scuderia Ferrari",
            car_number=44,
        )

        driver_2 = "drv-16"
        self.drivers[driver_2] = Driver(
            driver_id=driver_2,
            name="C. Leclerc",
            team="Scuderia Ferrari",
            car_number=16,
        )

        run_id = "run-03-soft-stint"
        self.runs[run_id] = Run(
            run_id=run_id,
            session_id=session_id,
            driver_id=driver_id,
            compound="SOFT (C4)",
            tyre_age=2,
            run_type="Qualifying Simulation",
            start_time="2026-09-04T15:18:20Z",
            end_time="2026-09-04T15:32:45Z",
        )

        run_2 = "run-04-soft-stint"
        self.runs[run_2] = Run(
            run_id=run_2,
            session_id=session_id,
            driver_id=driver_2,
            compound="SOFT (C4)",
            tyre_age=3,
            run_type="Qualifying Simulation",
            start_time="2026-09-04T15:20:10Z",
            end_time="2026-09-04T15:35:00Z",
        )

        # Initial Processing Lineage for synthetic demonstration data
        pr_id = "pr-demo-baseline-001"
        pr = ProcessingRun(
            processing_run_id=pr_id,
            source_file="synthetic_monza_fp2.csv",
            source_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            processed_at=datetime.now(timezone.utc).isoformat(),
            pipeline_version="2.0.0",
            mapping_version="1.0.0",
            status="PASS",
            quality_score=100.0,
            resampling_resolution=1.0,
        )
        self.processing_runs[pr_id] = pr

        # Stint Laps definition: (lap_id, run_id, lap_num, lap_time, s1, s2, s3, valid, factor)
        stint_specs = [
            ("lap-demo-01", run_id, 1, 80.520, 26.780, 27.140, 26.600, True, 0.998),
            ("lap-demo-02", run_id, 2, 80.418, 26.754, 27.112, 26.552, True, 1.000),  # Baseline Ref
            ("lap-demo-03", run_2, 3, 80.624, 26.820, 27.194, 26.610, True, 0.985),   # Baseline Comp
            ("lap-demo-04", run_id, 3, 80.680, 26.830, 27.190, 26.660, True, 0.994),
            ("lap-demo-05", run_id, 4, 80.820, 26.880, 27.230, 26.710, True, 0.990),
            ("lap-demo-06", run_id, 5, 81.040, 26.950, 27.290, 26.800, True, 0.983),
            ("lap-demo-07", run_id, 6, 82.950, 27.500, 28.100, 27.350, True, 0.930),  # Outlier lap
            ("lap-demo-11", run_2, 1, 80.750, 26.860, 27.220, 26.670, True, 0.988),
            ("lap-demo-12", run_2, 2, 80.690, 26.840, 27.200, 26.650, True, 0.989),
            ("lap-demo-14", run_2, 4, 80.790, 26.870, 27.240, 26.680, True, 0.982),
            ("lap-demo-15", run_2, 5, 80.950, 26.920, 27.280, 26.750, True, 0.978),
            ("lap-demo-16", run_2, 6, 81.180, 27.010, 27.350, 26.820, True, 0.971),
        ]

        for lid, rid, lnum, ltime, s1, s2, s3, val, factor in stint_specs:
            lap_obj = Lap(
                lap_id=lid,
                run_id=rid,
                lap_number=lnum,
                lap_time=ltime,
                sector_1=s1,
                sector_2=s2,
                sector_3=s3,
                valid=val,
            )
            self.laps[lid] = lap_obj
            self.telemetry_points[lid] = self._generate_monza_points(ltime, delta_factor=factor)
            self.lap_lineage[lid] = pr_id

    def _generate_monza_points(
        self, lap_time: float, delta_factor: float = 1.0
    ) -> list[TelemetryPoint]:
        points: list[TelemetryPoint] = []
        track_length = 5793.0
        n_pts = 800
        dt = lap_time / (n_pts - 1)

        for i in range(n_pts):
            t = round(i * dt, 4)
            s = round((i / (n_pts - 1)) * track_length, 2)

            if s < 950:
                speed = (280.0 + (s / 950.0) * 65.0) * delta_factor
                throttle = 100.0
                brake = 0.0
                gear = 8
                rpm = int(12200 * delta_factor)
                drs = 1
                lat_g = 0.05 * math.sin(s * 0.02)
                long_g = 0.45
            elif s < 1200:
                p = (s - 950.0) / 250.0
                speed = 345.0 - p * (345.0 - 78.0)
                throttle = 0.0
                brake = max(0.0, 100.0 * (1.0 - p * 0.5))
                gear = 2
                rpm = 9800
                drs = 0
                lat_g = 2.8 * math.sin(p * math.pi)
                long_g = -4.8 * (1.0 - p * 0.3)
            elif s < 2000:
                p = (s - 1200.0) / 800.0
                speed = (78.0 + p * (315.0 - 78.0)) * delta_factor
                throttle = min(100.0, 40.0 + p * 60.0)
                brake = 0.0
                gear = min(7, 2 + int(p * 5))
                rpm = 11000 + int(p * 1500)
                drs = 0
                lat_g = 2.4 * math.sin(p * math.pi * 0.5)
                long_g = 0.8 * (1.0 - p * 0.5)
            elif s < 2350:
                p = (s - 2000.0) / 350.0
                speed = 315.0 - p * (315.0 - 110.0)
                throttle = max(0.0, 30.0 * (1.0 - p))
                brake = max(0.0, 85.0 * (1.0 - p * 0.6))
                gear = 3
                rpm = 10200
                drs = 0
                lat_g = -3.2 * math.sin(p * math.pi)
                long_g = -3.8
            elif s < 3200:
                p = (s - 2350.0) / 850.0
                speed = (160.0 + 90.0 * math.sin(p * math.pi)) * delta_factor
                throttle = 60.0 + 35.0 * math.sin(p * math.pi)
                brake = 0.0 if p > 0.5 else 25.0 * (1.0 - p * 2)
                gear = 4
                rpm = 11400
                drs = 0
                lat_g = 3.6
                long_g = 0.2
            elif s < 4400:
                p = (s - 3200.0) / 1200.0
                speed = (210.0 + 100.0 * math.sin(p * math.pi * 0.8)) * delta_factor
                throttle = 80.0
                brake = 0.0
                gear = 6
                rpm = 11800
                drs = 1 if p > 0.6 else 0
                lat_g = -3.8 * math.sin(p * math.pi)
                long_g = 0.4
            else:
                p = (s - 4400.0) / (track_length - 4400.0)
                speed = (180.0 + p * 130.0) * delta_factor
                throttle = min(100.0, 50.0 + p * 50.0)
                brake = 0.0
                gear = min(8, 4 + int(p * 4))
                rpm = 11500 + int(p * 1200)
                drs = 0
                lat_g = 3.1 * (1.0 - p * 0.4)
                long_g = 0.6

            points.append(
                TelemetryPoint(
                    timestamp=t,
                    distance=s,
                    speed=round(speed, 2),
                    throttle=round(throttle, 1),
                    brake=round(brake, 1),
                    gear=int(gear),
                    rpm=int(rpm),
                    drs=int(drs),
                    lateral_acceleration=round(lat_g, 2),
                    longitudinal_acceleration=round(long_g, 2),
                )
            )
        return points

    def get_lap_dataframe(self, lap_id: str) -> pd.DataFrame | None:
        points = self.telemetry_points.get(lap_id)
        if not points:
            return None
        return pd.DataFrame([p.model_dump() for p in points])


store = TelemetryDataStore()
