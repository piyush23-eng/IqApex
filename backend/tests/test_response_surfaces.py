import numpy as np

from app.analytics.response_models import InteractionResponseModel, LinearResponseModel
from app.analytics.response_surfaces import ResponseSurfaceEngine


def test_response_curve_interpolation_and_extrapolation():
    x = np.array([179.0, 180.0, 181.0, 182.0, 183.0, 184.0])
    y = np.array([4.26, 4.24, 4.22, 4.20, 4.18, 4.16])
    lap_ids = [f"lap-0{i}" for i in range(1, 7)]

    model = LinearResponseModel(target_name="corner_time", feature_name="corner_exit_speed")
    model.fit(x, y)

    # 1. In-domain scenario: 182.0 (interpolation)
    curve_interp = ResponseSurfaceEngine.generate_curve(
        model=model,
        observed_x=x,
        observed_y=y,
        lap_ids=lap_ids,
        baseline_x=181.0,
        scenario_x=182.0,
    )

    assert curve_interp.domain_status == "INTERPOLATION"
    assert curve_interp.extrapolation_warning is None
    assert curve_interp.predicted_delta < 0.0  # Faster exit reduces time
    assert len(curve_interp.points) == 60
    assert len(curve_interp.observed_data) == 6

    # 2. Out-of-domain scenario: 190.0 (extrapolation)
    curve_extrap = ResponseSurfaceEngine.generate_curve(
        model=model,
        observed_x=x,
        observed_y=y,
        lap_ids=lap_ids,
        baseline_x=181.0,
        scenario_x=190.0,
    )

    assert curve_extrap.domain_status == "EXTRAPOLATION"
    assert curve_extrap.extrapolation_warning is not None
    assert "EXTRAPOLATION WARNING" in curve_extrap.extrapolation_warning
    assert "190.00" in curve_extrap.extrapolation_warning


def test_response_surface_2d():
    x1 = np.array([140.0, 142.0, 144.0, 140.0, 142.0, 144.0])
    x2 = np.array([180.0, 180.0, 180.0, 184.0, 184.0, 184.0])
    y = np.array([4.32, 4.28, 4.24, 4.25, 4.21, 4.17])
    lap_ids = [f"lap-0{i}" for i in range(1, 7)]

    model = InteractionResponseModel(
        target_name="corner_time", feature_names=["corner_minimum_speed", "corner_exit_speed"]
    )
    model.fit(x1, x2, y)

    surf = ResponseSurfaceEngine.generate_surface_2d(
        model=model,
        obs_x1=x1,
        obs_x2=x2,
        obs_y=y,
        lap_ids=lap_ids,
        grid_size=15,
    )

    assert len(surf.x1_values) == 15
    assert len(surf.x2_values) == 15
    assert len(surf.z_matrix) == 15
    assert len(surf.z_matrix[0]) == 15
    assert len(surf.interpolation_mask) == 15
    assert len(surf.observed_scatter) == 6
