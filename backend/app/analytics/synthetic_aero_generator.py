from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml
from scipy.stats import qmc


@dataclass(frozen=True)
class AeroParameterSpec:
    name: str
    unit: str
    minimum: float
    maximum: float
    step: float
    default: float
    source: str
    description: str

    def clamp(self, value: float) -> float:
        return max(self.minimum, min(self.maximum, value))


@dataclass
class SyntheticAeroDatasetMetadata:
    dataset_version: str
    dataset_hash: str
    generator_version: str
    sampling_method: str
    random_seed: int
    sample_count: int
    columns: list[str]
    parameter_ranges: dict[str, dict[str, Any]]
    label: str = "Synthetic engineering dataset"
    scientific_disclaimer: str = (
        "Synthetic engineering dataset generated for demonstration purposes. "
        "Not real F1 CFD, wind-tunnel, vehicle-dynamics, or team data."
    )


class SyntheticAeroGenerator:
    """
    Deterministic Synthetic Aerodynamic Dataset Generator using Latin Hypercube Sampling (LHS).
    Computes physically plausible lift, drag, and balance coefficients based on configurable
    aerodynamic physics parameters.
    """

    def __init__(self, config_path: Path | None = None) -> None:
        if config_path is None:
            config_path = Path(__file__).parent / "synthetic_aero_config.yaml"

        if not config_path.exists():
            raise FileNotFoundError(f"Configuration not found at {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

        self.constants = self.config["constants"]
        self.baseline_aero = self.config["baseline_aero"]
        self.doe_config = self.config["doe_sampling"]
        
        self.parameters: dict[str, AeroParameterSpec] = {}
        for p_name, p_data in self.config["parameter_ranges"].items():
            self.parameters[p_name] = AeroParameterSpec(
                name=p_data["name"],
                unit=p_data["unit"],
                minimum=float(p_data["minimum"]),
                maximum=float(p_data["maximum"]),
                step=float(p_data["step"]),
                default=float(p_data["default"]),
                source=p_data["source"],
                description=p_data["description"],
            )

    def evaluate_physics(
        self,
        front_wing_angle: float | np.ndarray,
        rear_wing_angle: float | np.ndarray,
        ride_height_front: float | np.ndarray,
        ride_height_rear: float | np.ndarray,
        yaw_angle: float | np.ndarray,
        vehicle_speed_kph: float | np.ndarray,
    ) -> dict[str, np.ndarray]:
        """
        Evaluates analytical physics formulas for Cl, Cd, Downforce, Drag, and Aero Balance.
        Works seamlessly with floats or NumPy arrays.
        """
        fw = np.asarray(front_wing_angle, dtype=float)
        rw = np.asarray(rear_wing_angle, dtype=float)
        rhf = np.asarray(ride_height_front, dtype=float)
        rhr = np.asarray(ride_height_rear, dtype=float)
        yaw = np.asarray(yaw_angle, dtype=float)
        spd_kph = np.asarray(vehicle_speed_kph, dtype=float)

        cfg = self.baseline_aero
        consts = self.constants

        # Speed conversion to m/s
        v_ms = spd_kph / 3.6
        # Dynamic pressure: q = 0.5 * rho * v^2
        q = 0.5 * consts["air_density_kg_m3"] * (v_ms**2)
        ref_area = consts["reference_area_m2"]

        # Aerodynamic Rake: difference between rear and front ride height
        rake_mm = rhr - rhf

        # Underfloor Ground Effect: peak suction at optimal ride height, decaying away
        opt_rh = cfg["ground_effect_ride_height_opt_mm"]
        rh_offset = np.abs(rhf - opt_rh)
        ground_effect_factor = np.exp(-cfg["ground_effect_decay_rate"] * rh_offset)
        rake_benefit = 1.0 + cfg["rake_lift_slope_per_mm"] * np.clip(rake_mm - 5.0, 0.0, 30.0)
        cl_floor = cfg["cl_floor_base"] * ground_effect_factor * rake_benefit

        # Front Wing Lift and Drag
        cl_front = (
            cfg["cl_front_base"]
            + cfg["front_wing_lift_slope_per_deg"] * (fw - 10.0)
            - 0.0008 * ((fw - 25.0) ** 2) * (fw > 25.0)  # stall reduction at high angle
        )
        cd_front = cfg["front_wing_drag_slope_per_deg"] * (fw - 10.0)

        # Rear Wing Lift and Drag
        cl_rear = (
            cfg["cl_rear_base"]
            + cfg["rear_wing_lift_slope_per_deg"] * (rw - 15.0)
            - 0.001 * ((rw - 32.0) ** 2) * (rw > 32.0)
        )
        cd_rear = cfg["rear_wing_drag_slope_per_deg"] * (rw - 15.0)

        # Yaw degradation
        yaw_lift_decay = np.exp(-cfg["yaw_lift_decay_per_deg"] * np.abs(yaw))
        yaw_drag_increase = 1.0 + cfg["yaw_drag_increase_per_deg"] * (np.abs(yaw) ** 1.3)

        # Combined Cl and Cd
        cl_total = (cl_front + cl_rear + cl_floor) * yaw_lift_decay
        # Induced drag: Cd = Cd0 + k * Cl^2
        induced_drag = cfg["induced_drag_factor_k"] * (cl_total**2)
        cd_total = (cfg["cd_base"] + cd_front + cd_rear + induced_drag) * yaw_drag_increase

        # Downforce and Drag in Newtons
        downforce_n = q * ref_area * cl_total
        drag_n = q * ref_area * cd_total
        lift_to_drag = np.where(cd_total > 0.01, cl_total / cd_total, 0.0)

        # Aero Balance (% Front Downforce)
        # Front contributes front wing + ~40% of underfloor suction
        front_downforce_n = q * ref_area * (cl_front + 0.40 * cl_floor) * yaw_lift_decay
        aero_balance_pct = np.where(
            downforce_n > 10.0, (front_downforce_n / downforce_n) * 100.0, 42.0
        )

        return {
            "q_pa": q,
            "cl": cl_total,
            "cd": cd_total,
            "downforce_n": downforce_n,
            "drag_n": drag_n,
            "lift_to_drag": lift_to_drag,
            "aero_balance_pct": aero_balance_pct,
            "cl_front": cl_front,
            "cl_rear": cl_rear,
            "cl_floor": cl_floor,
        }

    def generate_doe_dataset(
        self,
        sample_count: int | None = None,
        random_seed: int | None = None,
        include_noise: bool = True,
    ) -> tuple[pd.DataFrame, SyntheticAeroDatasetMetadata]:
        """
        Generates a space-filling Design of Experiments dataset using Latin Hypercube Sampling.
        Latin Hypercube Sampling ensures that each parameter dimension is stratified into N equal
        probability intervals, giving superior multi-dimensional parameter space coverage compared
        to pseudorandom uniform sampling without clustering artifacts.
        """
        n_samples = sample_count or int(self.doe_config["default_sample_count"])
        seed = random_seed if random_seed is not None else int(self.doe_config["default_random_seed"])

        # Design variables to sample via LHS
        lhs_vars = [
            "front_wing_angle",
            "rear_wing_angle",
            "ride_height_front",
            "ride_height_rear",
            "yaw_angle",
            "vehicle_speed",
            "tyre_grip",
            "mass",
        ]
        d = len(lhs_vars)

        sampler = qmc.LatinHypercube(d=d, seed=seed)
        sample = sampler.random(n=n_samples)

        lower_bounds = [self.parameters[v].minimum for v in lhs_vars]
        upper_bounds = [self.parameters[v].maximum for v in lhs_vars]

        scaled_sample = qmc.scale(sample, lower_bounds, upper_bounds)
        df = pd.DataFrame(scaled_sample, columns=lhs_vars)

        # Round inputs to their defined step resolutions
        for v in lhs_vars:
            step = self.parameters[v].step
            df[v] = np.round(df[v] / step) * step

        # Physics evaluation
        physics = self.evaluate_physics(
            front_wing_angle=df["front_wing_angle"].values,
            rear_wing_angle=df["rear_wing_angle"].values,
            ride_height_front=df["ride_height_front"].values,
            ride_height_rear=df["ride_height_rear"].values,
            yaw_angle=df["yaw_angle"].values,
            vehicle_speed_kph=df["vehicle_speed"].values,
        )

        df["cl"] = physics["cl"]
        df["cd"] = physics["cd"]
        df["downforce_n"] = physics["downforce_n"]
        df["drag_n"] = physics["drag_n"]
        df["lift_to_drag"] = physics["lift_to_drag"]
        df["aero_balance_pct"] = physics["aero_balance_pct"]

        # Controlled noise injection to reflect experimental / measurement variance
        if include_noise:
            rng = np.random.default_rng(seed)
            cl_noise = rng.normal(0.0, float(self.doe_config["noise_std_cl"]), size=n_samples)
            cd_noise = rng.normal(0.0, float(self.doe_config["noise_std_cd"]), size=n_samples)
            bal_noise = rng.normal(
                0.0, float(self.doe_config["noise_std_aero_balance"]) * 100.0, size=n_samples
            )

            df["cl"] = np.clip(df["cl"] + cl_noise, 0.5, 6.0)
            df["cd"] = np.clip(df["cd"] + cd_noise, 0.4, 2.5)
            # Recompute downforce & drag with noisy coefficients
            q_pa = physics["q_pa"]
            ref_area = self.constants["reference_area_m2"]
            df["downforce_n"] = np.round(q_pa * ref_area * df["cl"], 1)
            df["drag_n"] = np.round(q_pa * ref_area * df["cd"], 1)
            df["lift_to_drag"] = np.round(df["cl"] / df["cd"], 3)
            df["aero_balance_pct"] = np.round(
                np.clip(df["aero_balance_pct"] + bal_noise, 32.0, 56.0), 2
            )

        # Deterministic SHA-256 fingerprinting of the dataset
        summary_bytes = df.to_csv(index=False).encode("utf-8")
        dataset_hash = hashlib.sha256(summary_bytes).hexdigest()[:16]

        param_dict = {
            name: {
                "unit": p.unit,
                "minimum": p.minimum,
                "maximum": p.maximum,
                "step": p.step,
                "source": p.source,
            }
            for name, p in self.parameters.items()
        }

        meta = SyntheticAeroDatasetMetadata(
            dataset_version="v6.0.0-synthetic",
            dataset_hash=dataset_hash,
            generator_version="AeroLHSGenerator-1.0",
            sampling_method=self.doe_config["sampling_method"],
            random_seed=seed,
            sample_count=len(df),
            columns=list(df.columns),
            parameter_ranges=param_dict,
        )

        return df, meta
