from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import ClassVar, Literal

import yaml


@dataclass(frozen=True)
class ParameterDefinition:
    name: str
    unit: str
    minimum: float
    maximum: float
    step: float
    source: Literal["telemetry", "metadata", "session", "proxy"]
    allowed_perturbation: tuple[float, float]
    description: str

    def clamp(self, value: float) -> float:
        """Clamps value to physical parameter boundaries."""
        return max(self.minimum, min(self.maximum, value))

    def is_in_physical_range(self, value: float) -> bool:
        """Checks if value is within absolute physical limits."""
        return self.minimum <= value <= self.maximum

    def is_in_allowed_perturbation(self, baseline: float, target: float) -> bool:
        """Checks if target is within configured perturbation limits from baseline."""
        delta = target - baseline
        return self.allowed_perturbation[0] <= delta <= self.allowed_perturbation[1]


class ParameterRegistry:
    """
    Central registry for vehicle performance parameters.
    Prevents hardcoding of physical limits and perturbation steps inside algorithms.
    """

    _instance: ParameterRegistry | None = None
    _parameters: ClassVar[dict[str, ParameterDefinition]] = {}

    def __init__(self, config_path: Path | None = None) -> None:
        if config_path is None:
            config_path = Path(__file__).parent / "parameter_registry.yaml"

        if not config_path.exists():
            raise FileNotFoundError(f"Parameter registry configuration not found at {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            raw_data = yaml.safe_load(f)

        self._parameters = {}
        for p in raw_data.get("parameters", []):
            defn = ParameterDefinition(
                name=p["name"],
                unit=p["unit"],
                minimum=float(p["minimum"]),
                maximum=float(p["maximum"]),
                step=float(p["step"]),
                source=p["source"],
                allowed_perturbation=(
                    float(p["allowed_perturbation"][0]),
                    float(p["allowed_perturbation"][1]),
                ),
                description=p["description"],
            )
            self._parameters[defn.name] = defn

    @classmethod
    def get_instance(cls, config_path: Path | None = None) -> ParameterRegistry:
        if cls._instance is None:
            cls._instance = ParameterRegistry(config_path)
        return cls._instance

    def get(self, name: str) -> ParameterDefinition:
        if name not in self._parameters:
            raise KeyError(f"Parameter '{name}' not found in registry. Registered: {list(self._parameters.keys())}")
        return self._parameters[name]

    def list_parameters(
        self, source_filter: str | None = None
    ) -> list[ParameterDefinition]:
        params = list(self._parameters.values())
        if source_filter:
            params = [p for p in params if p.source == source_filter]
        return params

    def has_parameter(self, name: str) -> bool:
        return name in self._parameters
