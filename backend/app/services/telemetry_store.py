import math

from app.schemas.domain import Corner, Driver, Lap, Run, Session, TelemetryPoint

DEMO_DATA_LABEL = "Synthetic demonstration dataset"


class TelemetryDataStore:
    """
    In-memory / repository abstraction for session, run, lap, and telemetry data.
    Acts as the staging layer before persistent database queries.
    """

    def __init__(self) -> None:
        self.sessions: dict[str, Session] = {}
        self.drivers: dict[str, Driver] = {}
        self.runs: dict[str, Run] = {}
        self.laps: dict[str, Lap] = {}
        self.telemetry_points: dict[str, list[TelemetryPoint]] = {}
        self.corners: dict[str, list[Corner]] = {}
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

        lap_id = "lap-demo-02"
        lap = Lap(
            lap_id=lap_id,
            run_id=run_id,
            lap_number=2,
            lap_time=80.418,
            sector_1=26.754,
            sector_2=27.112,
            sector_3=26.552,
            valid=True,
        )
        self.laps[lap_id] = lap

        # Generate synthetic physical lap telemetry across 5793 meters (Monza lap)
        points: list[TelemetryPoint] = []
        track_length = 5793.0
        n_pts = 800  # 10 Hz representative trace across 80.4s
        dt = lap.lap_time / (n_pts - 1)

        # Simplified kinematic trace (Variante del Rettifilo, Curva Grande, Roggia, Lesmo, Ascari, Parabolica)
        for i in range(n_pts):
            t = round(i * dt, 4)
            s = round((i / (n_pts - 1)) * track_length, 2)

            # Profile speed based on track segments
            # T1/T2 Rettifilo at ~1100m, Roggia at ~2100m, Lesmo 1&2 at ~2700-3000m, Ascari at ~4200m, Parabolica at ~5200m
            if s < 950:
                speed = 280.0 + (s / 950.0) * 65.0  # Main straight up to 345 km/h
                throttle = 100.0
                brake = 0.0
                gear = 8
                rpm = 12200
                drs = 1
                lat_g = 0.05 * math.sin(s * 0.02)
                long_g = 0.45
            elif s < 1200:
                # Heavy braking for T1 chicane
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
                # Curva Grande acceleration
                p = (s - 1200.0) / 800.0
                speed = 78.0 + p * (315.0 - 78.0)
                throttle = min(100.0, 40.0 + p * 60.0)
                brake = 0.0
                gear = min(7, 2 + int(p * 5))
                rpm = 11000 + int(p * 1500)
                drs = 0
                lat_g = 2.4 * math.sin(p * math.pi * 0.5)
                long_g = 0.8 * (1.0 - p * 0.5)
            elif s < 2350:
                # Variante della Roggia
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
                # Lesmo 1 and Lesmo 2
                p = (s - 2350.0) / 850.0
                speed = 160.0 + 90.0 * math.sin(p * math.pi)
                throttle = 60.0 + 35.0 * math.sin(p * math.pi)
                brake = 0.0 if p > 0.5 else 25.0 * (1.0 - p * 2)
                gear = 4
                rpm = 11400
                drs = 0
                lat_g = 3.6
                long_g = 0.2
            elif s < 4400:
                # Variante Ascari
                p = (s - 3200.0) / 1200.0
                speed = 210.0 + 100.0 * math.sin(p * math.pi * 0.8)
                throttle = 80.0
                brake = 0.0
                gear = 6
                rpm = 11800
                drs = 1 if p > 0.6 else 0
                lat_g = -3.8 * math.sin(p * math.pi)
                long_g = 0.4
            else:
                # Curva Parabolica / Alboreto
                p = (s - 4400.0) / (track_length - 4400.0)
                speed = 180.0 + p * 130.0
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

        self.telemetry_points[lap_id] = points


store = TelemetryDataStore()
