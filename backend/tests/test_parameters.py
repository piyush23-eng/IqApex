from app.analytics.parameters import ParameterRegistry


def test_parameter_registry_loading():
    registry = ParameterRegistry.get_instance()
    assert registry.has_parameter("corner_exit_speed")
    assert registry.has_parameter("corner_minimum_speed")
    assert registry.has_parameter("braking_point")
    assert registry.has_parameter("tyre_age")
    assert registry.has_parameter("track_temperature")

    param = registry.get("corner_exit_speed")
    assert param.unit == "km/h"
    assert param.minimum == 60.0
    assert param.maximum == 360.0
    assert param.step == 0.5
    assert param.allowed_perturbation == (-5.0, 5.0)


def test_parameter_clamping_and_ranges():
    registry = ParameterRegistry.get_instance()
    param = registry.get("corner_exit_speed")

    assert param.clamp(185.0) == 185.0
    assert param.clamp(500.0) == 360.0
    assert param.clamp(10.0) == 60.0

    assert param.is_in_physical_range(200.0) is True
    assert param.is_in_physical_range(500.0) is False

    # Allowed perturbation: ±5 km/h
    assert param.is_in_allowed_perturbation(baseline=180.0, target=183.0) is True
    assert param.is_in_allowed_perturbation(baseline=180.0, target=190.0) is False


def test_list_parameters_with_filter():
    registry = ParameterRegistry.get_instance()
    all_params = registry.list_parameters()
    assert len(all_params) >= 8

    telemetry_params = registry.list_parameters(source_filter="telemetry")
    assert len(telemetry_params) >= 5
    assert all(p.source == "telemetry" for p in telemetry_params)
