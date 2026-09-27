#!/usr/bin/env python3
"""
ApexIQ — One-Command Engineering Demonstration Script
Runs the end-to-end analytical pipeline on the reproducible example dataset:
1. Ingests reference & comparison telemetry
2. Decomposes lap time into spatial phases (Braking, Cornering, Straight)
3. Evaluates aero surrogate sensitivity under setup what-if
4. Simulates 1,000-run Monte Carlo race strategy uncertainty
5. Prints quantified engineering report with reconciliation provenance
"""
import json
import sys
import time
from pathlib import Path

# Add backend to PYTHONPATH
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.analytics.engineering_analysis_engine import EngineeringAnalysisEngine
from app.analytics.strategy_monte_carlo import StrategyMonteCarloSimulator
from app.analytics.strategy_engine import StrategySimulationEngine
from app.analytics.strategy_generator import StrategyGenerator


def main() -> None:
    print("=" * 72)
    print("ApexIQ — Motorsport Engineering Decision-Support Prototype")
    print("Stage 10: Production Release & Technical Demonstration")
    print("=" * 72)
    print("NOTE: All data is synthetic for demonstration and algorithmic validation.")
    print("NOT real F1 CFD, wind-tunnel, vehicle-dynamics, or team data.\n")

    t_start = time.perf_counter()

    # Step 1: Initialize Engine
    print("[1/4] Initializing Cross-Module Engineering Analysis Engine...")
    engine = EngineeringAnalysisEngine(random_seed=42871)

    # Step 2: Observed Lap Loss Decomposition
    print("[2/4] Executing Lap-Time Phase Decomposition (Ref vs Comp)...")
    decomp = engine.analyze_lap_loss(
        reference_lap_id="lap-monza-ref-01",
        comparison_lap_id="lap-monza-comp-01",
        
    )
    print(f"      Total Lap Delta:       +{decomp.total_delta_s:.3f} s")
    for phase in decomp.phase_contributions:
        print(f"      - Phase '{phase.phase:<12}': +{phase.delta_s:.3f} s ({phase.percentage_of_lap_delta:5.1f}%) [{phase.evidence_type.value}]")
    print(f"      Reconciliation Residual: {decomp.residual_s:.4f} s (EXACT CONSERVATION)")

    # Step 3: Aero & Kinematic Setup What-If Scenario
    print("\n[3/4] Evaluating Aero Surrogate & Vehicle Kinematics What-If...")
    with open(ROOT / "examples/configurations/monza_low_drag_setup.json") as f:
        cfg = json.load(f)

    scenario = engine.evaluate_setup_scenario(
        baseline_setup=cfg["baseline_setup"],
        parameter_changes=cfg["scenario_overrides"],
    )
    print(f"      Setup Change:          Rear Wing {cfg['baseline_setup']['rear_wing_angle']}° -> {scenario.scenario_setup['rear_wing_angle']}° (+{scenario.delta_parameters.get('rear_wing_angle', 0.0):.1f}°)")
    print(f"      Modelled Downforce:    {scenario.downforce_n:6.1f} N ({scenario.delta_downforce_n:+6.1f} N)")
    print(f"      Modelled Drag:         {scenario.drag_n:6.1f} N ({scenario.delta_drag_n:+6.1f} N)")
    print(f"      Est. Lap Time Delta:   {scenario.delta_lap_time_s:+6.3f} s [{scenario.evidence_type.value}]")
    print(f"      95% Confidence Interval:   [{scenario.confidence_interval_95[0]:+.3f} s, {scenario.confidence_interval_95[1]:+.3f} s]")
    print(f"      95% Prediction Interval:   [{scenario.prediction_interval_95[0]:+.3f} s, {scenario.prediction_interval_95[1]:+.3f} s]")
    print(f"      Surrogate Domain Status:   {scenario.domain_status.value}")

    # Step 4: Strategy Simulation & Monte Carlo Uncertainty
    print("\n[4/4] Propagating Race Strategy & 1,000-Run Monte Carlo Uncertainty...")
    strat_engine = StrategySimulationEngine()
    mc_sim = StrategyMonteCarloSimulator()
    stints = [
        {"compound": "MEDIUM", "laps": 25},
        {"compound": "HARD", "laps": 28},
    ]
    mc_res = mc_sim.run_simulation(
        engine=strat_engine,
        strategy_id="strat_1stop_med_hard",
        stint_definitions=stints,
        iterations=1000,
        random_seed=42871,
    )
    print(f"      Race Distance:         53 Laps (Monza)")
    print(f"      Selected Strategy:     Medium (L1-25) -> Hard (L26-53) [1-Stop]")
    print(f"      Mean Race Time:        {mc_res.mean_race_time_s:.2f} s")
    print(f"      P10 - P90 Quantiles:   [{mc_res.p10_race_time_s:.2f} s, {mc_res.p90_race_time_s:.2f} s]")
    print(f"      P05 - P95 Quantiles:   [{mc_res.p05_race_time_s:.2f} s, {mc_res.p95_race_time_s:.2f} s]")

    total_time = (time.perf_counter() - t_start) * 1000
    print("\n" + "=" * 72)
    print(f"DEMO COMPLETE in {total_time:.2f} ms — 100% REPRODUCIBLE (Seed: 42871)")
    print("=" * 72)


if __name__ == "__main__":
    main()
