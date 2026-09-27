from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml


@dataclass
class FeasibleStrategyDefinition:
    strategy_id: str
    name: str
    pit_stops_count: int
    compound_sequence: list[str]
    stint_lengths: list[int]
    pit_laps: list[int]
    is_fia_legal: bool
    summary: str


class StrategyGenerator:
    """
    Deterministically generates physically and regulatorily feasible pit strategies for Monza (53 laps).
    
    Regulatory Reference:
        Source: 2024 FIA Formula One Sporting Regulations, Article 30.5 (Dry weather race tyre usage).
        Rule Represented: During a dry race, each competitor must use at least two different specifications
        of dry-weather tyres (compounds). Hence, strategies must include >= 2 distinct compound types.
        
    Limitations:
        - Wet / Intermediate mandatory rules and discretionary pit exceptions are not modeled.
        - Sprint race formats and parc fermé operational tyre allocations are not represented.
        - Does not represent complete F1 sporting/technical regulations; strictly encodes the 2-compound mandate.
    """

    def __init__(self, config_path: Path | None = None) -> None:
        if config_path is None:
            config_path = Path(__file__).parent / "strategy_config.yaml"

        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

        self.total_laps = int(cfg["race"]["total_laps"])
        self.compounds = cfg["compounds"]

    def generate_strategies(
        self,
        max_stops: int = 2,
        allowed_compounds: list[str] | None = None,
    ) -> list[FeasibleStrategyDefinition]:
        allowed = [c.upper() for c in (allowed_compounds or ["SOFT", "MEDIUM", "HARD"])]
        strategies: list[FeasibleStrategyDefinition] = []

        # 1-STOP STRATEGIES (L1 + L2 = 53)
        if max_stops >= 1:
            for c1 in allowed:
                for c2 in allowed:
                    if c1 == c2:
                        continue  # Must use at least 2 distinct dry compounds
                    max1 = self.compounds[c1]["max_viable_laps"]
                    max2 = self.compounds[c2]["max_viable_laps"]

                    # Pit window range
                    min_pit = max(10, self.total_laps - max2)
                    max_pit = min(max1, self.total_laps - 10)

                    if min_pit <= max_pit:
                        # Pick midpoint balanced pit lap
                        pit_lap = int((min_pit + max_pit) // 2)
                        l1 = pit_lap
                        l2 = self.total_laps - l1

                        strat_id = f"1STOP_{c1[:1]}_{c2[:1]}_{pit_lap}"
                        strategies.append(
                            FeasibleStrategyDefinition(
                                strategy_id=strat_id,
                                name=f"1-Stop: {c1.capitalize()} → {c2.capitalize()}",
                                pit_stops_count=1,
                                compound_sequence=[c1, c2],
                                stint_lengths=[l1, l2],
                                pit_laps=[pit_lap],
                                is_fia_legal=True,
                                summary=f"Start on {c1.capitalize()} ({l1} laps), pit L{pit_lap} for {c2.capitalize()} ({l2} laps)",
                            )
                        )

        # 2-STOP STRATEGIES (L1 + L2 + L3 = 53)
        if max_stops >= 2:
            # Common realistic 2-stop templates
            templates = [
                ("SOFT", "MEDIUM", "MEDIUM"),
                ("SOFT", "HARD", "SOFT"),
                ("MEDIUM", "HARD", "SOFT"),
                ("MEDIUM", "MEDIUM", "HARD"),
                ("SOFT", "SOFT", "MEDIUM"),
            ]
            for c1, c2, c3 in templates:
                if c1 in allowed and c2 in allowed and c3 in allowed and len({c1, c2, c3}) >= 2:
                    # Feasible stint lengths
                    l1 = min(16, self.compounds[c1]["max_viable_laps"] - 2)
                    l2 = min(20, self.compounds[c2]["max_viable_laps"] - 2)
                    l3 = self.total_laps - (l1 + l2)

                    if 8 <= l3 <= self.compounds[c3]["max_viable_laps"]:
                        p1 = l1
                        p2 = l1 + l2
                        strat_id = f"2STOP_{c1[:1]}_{c2[:1]}_{c3[:1]}_{p1}_{p2}"
                        strategies.append(
                            FeasibleStrategyDefinition(
                                strategy_id=strat_id,
                                name=f"2-Stop: {c1.capitalize()} → {c2.capitalize()} → {c3.capitalize()}",
                                pit_stops_count=2,
                                compound_sequence=[c1, c2, c3],
                                stint_lengths=[l1, l2, l3],
                                pit_laps=[p1, p2],
                                is_fia_legal=True,
                                summary=f"{c1.capitalize()} ({l1}L) → {c2.capitalize()} ({l2}L) → {c3.capitalize()} ({l3}L)",
                            )
                        )

        # Deterministic sorting
        strategies.sort(key=lambda s: (s.pit_stops_count, s.name))
        return strategies
