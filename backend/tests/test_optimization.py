import numpy as np

from app.analytics.optimization_engine import ConstrainedOptimizationEngine
from app.analytics.parameters import ParameterRegistry
from app.analytics.response_models import PolynomialResponseModel
from app.analytics.sensitivity_engine import SensitivityEngine


def test_constrained_optimization_scenarios():
    registry = ParameterRegistry.get_instance()
    param_def = registry.get("corner_exit_speed")

    x = np.array([178.0, 179.5, 181.0, 182.5, 184.0, 185.5])
    # Quadratic response where optimum is within bounds
    y = 4.25 - 0.02 * (x - 180.0) + 0.005 * (x - 180.0) ** 2
    model = PolynomialResponseModel(
        target_name="corner_time", feature_name="corner_exit_speed", degree=2
    )
    model.fit(x, y)

    res = ConstrainedOptimizationEngine.optimize_1d(
        model=model,
        param_def=param_def,
        baseline_val=181.2,
        allow_extrapolation=False,
        robust_penalty_lambda=1.0,
    )

    assert res.result_type == "OPTIMIZED"
    assert len(res.scenarios) == 3

    nominal = res.scenarios[0]
    conservative = res.scenarios[1]
    robust = res.scenarios[2]

    assert nominal.scenario_type == "NOMINAL"
    assert conservative.scenario_type == "CONSERVATIVE"
    assert robust.scenario_type == "ROBUST"

    # All scenarios must satisfy constraints
    assert nominal.constraints_satisfied is True
    assert conservative.constraints_satisfied is True
    assert robust.constraints_satisfied is True

    # Parameter values must be within configured bounds
    assert res.configured_bounds[0] <= nominal.parameter_value <= res.configured_bounds[1]
    assert res.configured_bounds[0] <= conservative.parameter_value <= res.configured_bounds[1]


def test_sensitivity_and_parameter_sweep():
    registry = ParameterRegistry.get_instance()
    param_def = registry.get("corner_exit_speed")

    x = np.array([178.0, 180.0, 182.0, 184.0, 186.0])
    y = 4.25 - 0.015 * (x - 180.0)
    model = PolynomialResponseModel(
        target_name="corner_time", feature_name="corner_exit_speed", degree=2
    )
    model.fit(x, y)

    # Local sensitivity
    sens = SensitivityEngine.compute_local_sensitivity(model, baseline_val=181.2)
    assert sens.result_type == "MODELLED"
    assert sens.local_derivative < 0.0  # Negative slope

    # Sweep
    sweep = SensitivityEngine.compute_sweep(model, param_def, baseline_val=181.2)
    assert sweep.result_type == "MODELLED"
    assert len(sweep.points) > 5
    assert sweep.points[0].parameter_value < sweep.points[-1].parameter_value
