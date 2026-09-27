from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_api_get_parameters():
    res = client.get("/api/optimization/parameters")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8
    names = [p["name"] for p in data]
    assert "corner_exit_speed" in names
    assert "corner_minimum_speed" in names
    assert "braking_point" in names


def test_api_get_response_curve():
    res = client.get(
        "/api/optimization/response-curve",
        params={
            "session_id": "demo-session-monza-2026",
            "corner_id": "T9",
            "parameter_name": "corner_exit_speed",
            "target_name": "corner_time",
            "baseline_value": 181.2,
            "scenario_value": 183.0,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["parameter_name"] == "corner_exit_speed"
    assert data["target_name"] == "corner_time"
    assert data["domain_status"] in ["INTERPOLATION", "EXTRAPOLATION"]
    assert len(data["points"]) == 60
    assert len(data["observed_data"]) > 0
    assert data["model_metadata"]["pipeline_version"] == "5.0.0"


def test_api_get_response_surface_2d():
    res = client.get(
        "/api/optimization/response-surface-2d",
        params={
            "session_id": "demo-session-monza-2026",
            "corner_id": "T9",
            "feature_x1": "corner_minimum_speed",
            "feature_x2": "corner_exit_speed",
            "target_name": "corner_time",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["feature_x1"] == "corner_minimum_speed"
    assert data["feature_x2"] == "corner_exit_speed"
    assert len(data["x1_values"]) == 25
    assert len(data["z_matrix"]) == 25


def test_api_get_parameter_sweep():
    res = client.get(
        "/api/optimization/sweep",
        params={
            "session_id": "demo-session-monza-2026",
            "corner_id": "T9",
            "parameter_name": "corner_exit_speed",
            "baseline_value": 181.2,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["parameter_name"] == "corner_exit_speed"
    assert len(data["points"]) > 5
    assert data["result_type"] == "MODELLED"


def test_api_post_monte_carlo():
    payload = {
        "parameter_name": "corner_exit_speed",
        "target_name": "corner_time",
        "baseline_value": 181.2,
        "scenario_mean": 183.0,
        "scenario_std": 0.8,
        "iterations": 1000,
        "simulation_seed": 42871,
        "include_residual_variance": True,
        "session_id": "demo-session-monza-2026",
        "corner_id": "T9",
    }
    res = client.post("/api/optimization/monte-carlo", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["simulation_seed"] == 42871
    assert data["iterations"] == 1000
    assert data["p05_delta"] < data["p95_delta"]
    assert len(data["bins"]) == 25
    assert data["result_type"] == "MODELLED"


def test_api_post_constrained_optimization():
    payload = {
        "parameter_name": "corner_exit_speed",
        "target_name": "corner_time",
        "baseline_value": 181.2,
        "allow_extrapolation": False,
        "robust_penalty_lambda": 1.0,
        "session_id": "demo-session-monza-2026",
        "corner_id": "T9",
    }
    res = client.post("/api/optimization/optimize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["result_type"] == "OPTIMIZED"
    assert len(data["scenarios"]) == 3
    types = [s["scenario_type"] for s in data["scenarios"]]
    assert "NOMINAL" in types
    assert "CONSERVATIVE" in types
    assert "ROBUST" in types


def test_api_get_sensitivity_matrix():
    res = client.get("/api/sensitivity/matrix?session_id=demo-session-monza-2026")
    assert res.status_code == 200
    data = res.json()
    assert data["circuit"] == "Autodromo Nazionale Monza"
    assert len(data["items"]) >= 33  # 11 corners * 3 parameters
    assert data["items"][0]["result_type"] == "MODELLED"
