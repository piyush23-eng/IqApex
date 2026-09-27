from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import yaml

from app.analytics.tyre_model import SyntheticTyreModel
from app.analytics.vehicle_performance import VehiclePerformanceSimulator


@dataclass
class SimulatedLapData:
    lap_number: int
    stint_number: int
    compound: str
    tyre_age: int
    fuel_remaining_kg: float
    vehicle_mass_kg: float
    effective_grip: float
    base_lap_time_s: float
    tyre_penalty_s: float
    fuel_effect_s: float
    traffic_penalty_s: float
    interruption_penalty_s: float
    lap_time_s: float
    cumulative_time_s: float
    is_pit_in_lap: bool
    pit_loss_s: float


@dataclass
class StintSimulationResult:
    stint_number: int
    compound: str
    start_lap: int
    end_lap: int
    stint_length: int
    total_stint_time_s: float
    mean_lap_time_s: float
    start_tyre_age: int
    end_tyre_age: int
    laps: list[SimulatedLapData]


@dataclass
class RaceSimulationResult:
    strategy_id: str
    total_race_time_s: float
    mean_lap_time_s: float
    pit_stops_count: int
    total_pit_loss_s: float
    stints: list[StintSimulationResult]
    laps: list[SimulatedLapData]
    weather_scenario: str
    safety_car_scenario: str
    traffic_scenario: str
    scientific_disclaimer: str = (
        "Modelled scenario based on synthetic tyre degradation, dynamic fuel-mass depletion, "
        "and quasi-steady vehicle performance. Not real F1 race telemetry."
    )


class StrategySimulationEngine:
    """
    Simulates race stints and full race distance by chaining:
    Vehicle Setup -> Aero Response -> Dynamic Fuel Mass -> Synthetic Tyre Wear -> Quasi-Steady Lap Time
    """

    def __init__(self, config_path: Path | None = None) -> None:
        if config_path is None:
            config_path = Path(__file__).parent / "strategy_config.yaml"

        with open(config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

        self.race_cfg = self.config["race"]
        self.pit_cfg = self.config["pit_stop"]
        self.tyre_model = SyntheticTyreModel(config_path=config_path)
        self.vehicle_sim = VehiclePerformanceSimulator()

    def simulate_race(
        self,
        strategy_id: str,
        stint_definitions: list[dict[str, Any]],  # [{"compound": "MEDIUM", "laps": 25}, ...]
        weather_code: str = "DRY",
        safety_car_code: str = "GREEN",
        traffic_code: str = "LIGHT_TRAFFIC",
        cl_total: float | None = None,
        cd_total: float | None = None,
        degradation_multiplier: float = 1.0,
        random_seed: int = 42871,
    ) -> RaceSimulationResult:
        cl = cl_total or float(self.race_cfg["baseline_cl"])
        cd = cd_total or float(self.race_cfg["baseline_cd"])

        rng = np.random.default_rng(random_seed)
        weather = self.config["weather"].get(weather_code, self.config["weather"]["DRY"])
        sc_info = self.config["interruptions"].get(safety_car_code, self.config["interruptions"]["GREEN"])
        traffic = self.config["traffic_scenarios"].get(traffic_code, self.config["traffic_scenarios"]["LIGHT_TRAFFIC"])

        start_fuel = float(self.race_cfg["starting_fuel_kg"])
        fuel_burn = float(self.race_cfg["fuel_mass_per_lap_kg"])
        base_mass = float(self.race_cfg["base_vehicle_mass_kg"])

        all_laps: list[SimulatedLapData] = []
        stint_results: list[StintSimulationResult] = []

        current_lap = 1
        cumulative_time = 0.0
        total_pit_loss = 0.0
        num_stops = max(0, len(stint_definitions) - 1)

        for s_idx, s_def in enumerate(stint_definitions):
            compound = s_def["compound"].upper()
            stint_len = int(s_def["laps"])
            stint_start_lap = current_lap
            stint_laps: list[SimulatedLapData] = []
            stint_time = 0.0

            for lap_in_stint in range(stint_len):
                tyre_age = lap_in_stint
                fuel_rem = max(0.0, start_fuel - (current_lap - 1) * fuel_burn)
                car_mass = base_mass + fuel_rem

                # 1. Effective tyre grip
                t_state = self.tyre_model.evaluate_grip(
                    compound_code=compound,
                    tyre_age=tyre_age,
                    weather_thermal_mult=float(weather["thermal_deg_multiplier"]) * degradation_multiplier,
                    weather_grip_mult=float(weather["grip_multiplier"]),
                )

                # 2. Physics-based lap time from vehicle_performance model
                perf_res = self.vehicle_sim.simulate_lap(
                    cl_total=cl,
                    cd_total=cd,
                    mass_kg=car_mass,
                    tyre_grip_mu=t_state.effective_grip,
                )
                raw_lap_time = perf_res.modeled_lap_time_s

                # 3. Environmental & Interruption modifiers
                traffic_delay = float(traffic["penalty_s_per_lap"]) if rng.random() < float(traffic["traffic_probability"]) else 0.0
                interruption_factor = float(sc_info["lap_time_multiplier"])
                modified_lap_time = (raw_lap_time * interruption_factor) + traffic_delay

                # Check if pit in-lap (end of stint, but not end of race)
                is_pit_lap = (lap_in_stint == stint_len - 1) and (s_idx < len(stint_definitions) - 1)
                pit_loss = 0.0
                if is_pit_lap:
                    # Pit loss depends on green vs VSC vs SC
                    pit_loss = float(sc_info["pit_loss_override_s"])
                    total_pit_loss += pit_loss

                final_lap_time = modified_lap_time + pit_loss
                cumulative_time += final_lap_time
                stint_time += final_lap_time

                # Fuel mass effect delta relative to 0kg fuel
                fuel_delta_s = round(fuel_rem * 0.032, 3)  # ~0.032s per kg fuel at Monza

                lap_obj = SimulatedLapData(
                    lap_number=current_lap,
                    stint_number=s_idx + 1,
                    compound=compound,
                    tyre_age=tyre_age,
                    fuel_remaining_kg=round(fuel_rem, 2),
                    vehicle_mass_kg=round(car_mass, 2),
                    effective_grip=t_state.effective_grip,
                    base_lap_time_s=round(raw_lap_time, 3),
                    tyre_penalty_s=t_state.degradation_penalty_s,
                    fuel_effect_s=fuel_delta_s,
                    traffic_penalty_s=round(traffic_delay, 3),
                    interruption_penalty_s=round((interruption_factor - 1.0) * raw_lap_time, 3),
                    lap_time_s=round(final_lap_time, 3),
                    cumulative_time_s=round(cumulative_time, 3),
                    is_pit_in_lap=is_pit_lap,
                    pit_loss_s=round(pit_loss, 2),
                )
                all_laps.append(lap_obj)
                stint_laps.append(lap_obj)
                current_lap += 1

            stint_results.append(
                StintSimulationResult(
                    stint_number=s_idx + 1,
                    compound=compound,
                    start_lap=stint_start_lap,
                    end_lap=current_lap - 1,
                    stint_length=stint_len,
                    total_stint_time_s=round(stint_time, 3),
                    mean_lap_time_s=round(stint_time / max(stint_len, 1), 3),
                    start_tyre_age=0,
                    end_tyre_age=stint_len - 1,
                    laps=stint_laps,
                )
            )

        mean_lt = cumulative_time / max(len(all_laps), 1)

        return RaceSimulationResult(
            strategy_id=strategy_id,
            total_race_time_s=round(cumulative_time, 3),
            mean_lap_time_s=round(mean_lt, 3),
            pit_stops_count=num_stops,
            total_pit_loss_s=round(total_pit_loss, 2),
            stints=stint_results,
            laps=all_laps,
            weather_scenario=weather_code,
            safety_car_scenario=safety_car_code,
            traffic_scenario=traffic_code,
        )
