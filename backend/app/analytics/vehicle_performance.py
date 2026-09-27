from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from app.analytics.corner_analysis import MONZA_CORNERS


@dataclass
class CornerSimulationResult:
    corner_id: str
    corner_name: str
    turn_number: int
    curvature_radius_m: float
    length_m: float
    downforce_n: float
    normal_load_n: float
    max_lateral_force_n: float
    max_lateral_accel_g: float
    max_corner_speed_kph: float
    transit_time_s: float
    domain_status: str


@dataclass
class StraightSimulationResult:
    straight_name: str
    start_distance_m: float
    end_distance_m: float
    length_m: float
    entry_speed_kph: float
    exit_speed_kph: float
    top_speed_kph: float
    mean_acceleration_g: float
    transit_time_s: float
    drag_at_exit_n: float


@dataclass
class VehicleLapSimulationResult:
    modeled_lap_time_s: float
    total_corner_time_s: float
    total_straight_time_s: float
    corners: list[CornerSimulationResult]
    straights: list[StraightSimulationResult]
    top_speed_kph: float
    mean_lateral_accel_g: float
    disclaimer: str = (
        "Modelled lap-time estimate based on point-mass quasi-steady cornering and "
        "numerical longitudinal power/drag integration across Monza segments. "
        "Physics-based synthetic estimate; not an empirical guarantee."
    )


class VehiclePerformanceSimulator:
    """
    Simplified, interpretable vehicle performance model:
    - Cornering: Point-mass lateral equilibrium: F_lat,max = mu * (m*g + Downforce(v))
    - Longitudinal: Forward Euler numerical integration: a = (F_engine(v) - F_drag(v) - F_rolling)/m
    - Circuit Integration: Computes corner and straight transit times across Autodromo Nazionale Monza.
    """

    def __init__(self) -> None:
        self.gravity = 9.80665
        self.rho = 1.225
        self.ref_area = 1.60
        self.engine_peak_power_watts = 745_700.0  # ~1,000 hp
        self.rolling_coeff = 0.015
        self.wheel_drive_eff = 0.94

        # Curvature radius approximations for Monza corners (meters)
        self.monza_corner_radii: dict[str, float] = {
            "T1": 38.0,   # Tight Variante Rettifilo apex 1
            "T2": 45.0,   # Variante Rettifilo apex 2
            "T3": 380.0,  # Curva Grande (very fast sweep)
            "T4": 55.0,   # Roggia chicane entry
            "T5": 52.0,   # Roggia chicane exit
            "T6": 125.0,  # Lesmo 1
            "T7": 105.0,  # Lesmo 2
            "T8": 140.0,  # Variante Ascari entry
            "T9": 160.0,  # Variante Ascari mid
            "T10": 135.0, # Variante Ascari exit
            "T11": 115.0, # Curva Parabolica / Alboreto
        }

        # Major Monza straights connecting corner complexes
        self.monza_straights = [
            {"name": "Pit Straight (Rettifilo)", "start": 0.0, "end": 950.0, "entry_from": "T11"},
            {"name": "Curva Grande Straight", "start": 1850.0, "end": 2080.0, "entry_from": "T3"},
            {"name": "Lesmo Link", "start": 2720.0, "end": 2820.0, "entry_from": "T6"},
            {"name": "Serraglio Straight", "start": 3040.0, "end": 4020.0, "entry_from": "T7"},
            {"name": "Back Straight (Rettifilo delle Rogge)", "start": 4420.0, "end": 5120.0, "entry_from": "T10"},
        ]

    def solve_corner_equilibrium(
        self,
        radius_m: float,
        length_m: float,
        corner_id: str,
        corner_name: str,
        turn_num: int,
        mass_kg: float,
        tyre_grip_mu: float,
        cl_total: float,
    ) -> CornerSimulationResult:
        """
        Solves for maximum steady-state cornering speed:
        m * v^2 / R = mu * (m * g + 0.5 * rho * S * Cl * v^2)
        v^2 * (m/R - 0.5 * mu * rho * S * Cl) = mu * m * g
        """
        aero_term = 0.5 * tyre_grip_mu * self.rho * self.ref_area * cl_total
        inertia_term = mass_kg / radius_m

        if inertia_term <= aero_term:
            # High downforce exceeding lateral requirement (e.g. flat out Curva Grande)
            v_ms = 330.0 / 3.6
        else:
            v_sq = (tyre_grip_mu * mass_kg * self.gravity) / (inertia_term - aero_term)
            v_ms = math.sqrt(max(v_sq, 10.0))
            # Speed cap for realism
            v_ms = min(v_ms, 335.0 / 3.6)

        v_kph = v_ms * 3.6
        q = 0.5 * self.rho * (v_ms**2)
        downforce_n = q * self.ref_area * cl_total
        normal_load_n = mass_kg * self.gravity + downforce_n
        max_f_lat = tyre_grip_mu * normal_load_n
        max_lat_accel_g = (v_ms**2 / radius_m) / self.gravity
        transit_time_s = length_m / max(v_ms, 1.0)

        return CornerSimulationResult(
            corner_id=corner_id,
            corner_name=corner_name,
            turn_number=turn_num,
            curvature_radius_m=radius_m,
            length_m=length_m,
            downforce_n=round(downforce_n, 1),
            normal_load_n=round(normal_load_n, 1),
            max_lateral_force_n=round(max_f_lat, 1),
            max_lateral_accel_g=round(max_lat_accel_g, 2),
            max_corner_speed_kph=round(v_kph, 1),
            transit_time_s=round(transit_time_s, 3),
            domain_status="PHYSICS_EQUILIBRIUM",
        )

    def simulate_straight(
        self,
        straight_name: str,
        start_m: float,
        end_m: float,
        entry_speed_kph: float,
        mass_kg: float,
        cd_total: float,
    ) -> StraightSimulationResult:
        """
        Integrates forward longitudinal kinematics across the straight.
        F_net(v) = (Power * eta / v) - Drag(v) - Rolling_resistance
        """
        length_m = end_m - start_m
        dt = 0.05  # 50 ms integration step
        v = entry_speed_kph / 3.6
        dist = 0.0
        t = 0.0
        max_v = v
        accels = []

        # Peak traction acceleration limit at low speeds (~1.6g)
        max_traction_force = mass_kg * self.gravity * 1.6

        while dist < length_m and t < 60.0:
            # Engine tractive force
            if v > 1.0:
                f_drive = (self.engine_peak_power_watts * self.wheel_drive_eff) / v
                f_drive = min(f_drive, max_traction_force)
            else:
                f_drive = max_traction_force

            # Aero drag & rolling resistance
            q = 0.5 * self.rho * (v**2)
            f_drag = q * self.ref_area * cd_total
            f_roll = self.rolling_coeff * mass_kg * self.gravity

            f_net = f_drive - f_drag - f_roll
            a = max(f_net / mass_kg, 0.0)  # No negative accel on throttle straight
            accels.append(a / self.gravity)

            v += a * dt
            # Speed governor ceiling (terminal velocity)
            v = min(v, 360.0 / 3.6)

            max_v = max(max_v, v)

            dist += v * dt
            t += dt

        q_exit = 0.5 * self.rho * (v**2)
        drag_exit_n = q_exit * self.ref_area * cd_total
        mean_accel_g = float(np.mean(accels)) if accels else 0.5

        return StraightSimulationResult(
            straight_name=straight_name,
            start_distance_m=start_m,
            end_distance_m=end_m,
            length_m=length_m,
            entry_speed_kph=round(entry_speed_kph, 1),
            exit_speed_kph=round(v * 3.6, 1),
            top_speed_kph=round(max_v * 3.6, 1),
            mean_acceleration_g=round(mean_accel_g, 2),
            transit_time_s=round(t, 3),
            drag_at_exit_n=round(drag_exit_n, 1),
        )

    def simulate_lap(
        self,
        cl_total: float,
        cd_total: float,
        mass_kg: float = 810.0,
        tyre_grip_mu: float = 1.75,
    ) -> VehicleLapSimulationResult:
        """
        Executes complete track-segment lap time calculation for Monza.
        """
        corner_results: list[CornerSimulationResult] = []
        corner_exit_speeds: dict[str, float] = {}

        for c in MONZA_CORNERS:
            r = self.monza_corner_radii.get(c.corner_id, 80.0)
            length = c.exit_distance - c.entry_distance
            cr = self.solve_corner_equilibrium(
                radius_m=r,
                length_m=length,
                corner_id=c.corner_id,
                corner_name=c.name,
                turn_num=c.turn_number,
                mass_kg=mass_kg,
                tyre_grip_mu=tyre_grip_mu,
                cl_total=cl_total,
            )
            corner_results.append(cr)
            corner_exit_speeds[c.corner_id] = cr.max_corner_speed_kph

        straight_results: list[StraightSimulationResult] = []
        for s in self.monza_straights:
            v_entry = corner_exit_speeds.get(s["entry_from"], 120.0)
            sr = self.simulate_straight(
                straight_name=s["name"],
                start_m=s["start"],
                end_m=s["end"],
                entry_speed_kph=v_entry,
                mass_kg=mass_kg,
                cd_total=cd_total,
            )
            straight_results.append(sr)

        total_corner_t = sum(c.transit_time_s for c in corner_results)
        total_straight_t = sum(s.transit_time_s for s in straight_results)

        # Baseline connector transition delta (braking / throttle pickups)
        transition_slack_s = 6.25  # Braking zones deceleration slack

        modeled_lap_t = total_corner_t + total_straight_t + transition_slack_s
        top_spd = max(s.top_speed_kph for s in straight_results)
        mean_lat_g = float(np.mean([c.max_lateral_accel_g for c in corner_results]))

        return VehicleLapSimulationResult(
            modeled_lap_time_s=round(modeled_lap_t, 3),
            total_corner_time_s=round(total_corner_t, 3),
            total_straight_time_s=round(total_straight_t, 3),
            corners=corner_results,
            straights=straight_results,
            top_speed_kph=round(top_spd, 1),
            mean_lateral_accel_g=round(mean_lat_g, 2),
        )
