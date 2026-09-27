from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class TyreCompoundConfig:
    name: str
    code: str
    color: str
    initial_grip: float
    degradation_a: float
    degradation_b: float
    thermal_penalty_rate: float
    warmup_laps: int
    max_viable_laps: int
    minimum_viable_grip: float


@dataclass
class TyreState:
    lap_number: int
    tyre_age: int
    compound: str
    effective_grip: float
    degradation_penalty_s: float
    thermal_penalty_s: float
    is_cliff_exceeded: bool


class SyntheticTyreModel:
    """
    Transparent, non-linear synthetic tyre degradation model:
    Grip(age) = Grip_initial - a * age - b * age^2 - thermal_penalty
    Includes compound-specific warm-up characteristics and cliff thresholds.
    """

    def __init__(self, config_path: Path | None = None) -> None:
        if config_path is None:
            config_path = Path(__file__).parent / "strategy_config.yaml"

        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

        self.compounds: dict[str, TyreCompoundConfig] = {}
        for code, data in cfg["compounds"].items():
            self.compounds[code] = TyreCompoundConfig(
                name=data["name"],
                code=data["code"],
                color=data["color"],
                initial_grip=float(data["initial_grip"]),
                degradation_a=float(data["degradation_a"]),
                degradation_b=float(data["degradation_b"]),
                thermal_penalty_rate=float(data["thermal_penalty_rate"]),
                warmup_laps=int(data["warmup_laps"]),
                max_viable_laps=int(data["max_viable_laps"]),
                minimum_viable_grip=float(data["minimum_viable_grip"]),
            )

    def evaluate_grip(
        self,
        compound_code: str,
        tyre_age: int,
        weather_thermal_mult: float = 1.0,
        weather_grip_mult: float = 1.0,
    ) -> TyreState:
        """
        Computes effective tyre grip coefficient and lap time penalty for a given age.
        """
        code = compound_code.upper()
        if code not in self.compounds:
            raise ValueError(f"Unknown tyre compound code: {compound_code}")

        cmp = self.compounds[code]
        age = max(0, tyre_age)

        # Warm-up progression: Laps 0 to warmup_laps have slight cold tire deficit
        warmup_factor = min(1.0, 0.95 + 0.05 * (age / max(cmp.warmup_laps, 1)))

        # Mechanical wear: linear rate + quadratic cliff
        mechanical_decay = cmp.degradation_a * age + cmp.degradation_b * (age**2)
        # Thermal decay: increases under high track/ambient temperatures
        thermal_penalty = cmp.thermal_penalty_rate * age * weather_thermal_mult

        total_decay = mechanical_decay + thermal_penalty
        raw_grip = (cmp.initial_grip * warmup_factor - total_decay) * weather_grip_mult
        effective_grip = max(cmp.minimum_viable_grip, raw_grip)

        # In motorsport kinetics, ~0.10 decrease in mu corresponds to ~0.50-0.70s lap time loss
        # Delta grip from fresh tire
        grip_drop = max(0.0, cmp.initial_grip - effective_grip)
        lap_time_penalty_s = grip_drop * 6.5  # empirical motorsport proxy coefficient

        is_cliff = age > cmp.max_viable_laps or effective_grip <= cmp.minimum_viable_grip + 0.01

        return TyreState(
            lap_number=age,
            tyre_age=age,
            compound=code,
            effective_grip=round(float(effective_grip), 4),
            degradation_penalty_s=round(float(lap_time_penalty_s), 3),
            thermal_penalty_s=round(float(thermal_penalty * 6.5), 3),
            is_cliff_exceeded=is_cliff,
        )

    def generate_compound_curve(
        self,
        compound_code: str,
        max_laps: int = 40,
        weather_thermal_mult: float = 1.0,
    ) -> list[dict[str, Any]]:
        """
        Generates full degradation curve (lap penalty vs age) for workstation plotting.
        """
        curve = []
        for age in range(max_laps + 1):
            st = self.evaluate_grip(compound_code, age, weather_thermal_mult=weather_thermal_mult)
            curve.append({
                "tyre_age": age,
                "effective_grip": st.effective_grip,
                "lap_time_penalty_s": st.degradation_penalty_s,
                "thermal_penalty_s": st.thermal_penalty_s,
                "is_cliff_exceeded": st.is_cliff_exceeded,
            })
        return curve
