from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_api_vehicle_parameters():
    res = client.get("/api/vehicle-performance/parameters")
    assert res.status_code == 200
    data = res.json()
    assert "parameters" in data
    assert len(data["parameters"]) >= 8
    assert data["provenance_label"] == "Synthetic engineering dataset"


def test_api_evaluate_configuration():
    payload = {
        "front_wing_angle": 18.0,
        "rear_wing_angle": 24.0,
        "ride_height_front": 32.0,
        "ride_height_rear": 42.0,
        "yaw_angle": 1.5,
        "vehicle_speed": 250.0,
        "tyre_grip": 1.75,
        "mass": 810.0,
    }
    res = client.post("/api/vehicle-performance/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["downforce_n"] > 5000.0
    assert data["drag_n"] > 1500.0
    assert data["domain_status"] in ["INTERPOLATION", "EXTRAPOLATION"]
    assert "Synthetic aerodynamic surrogate" in data["disclaimer"]


def test_api_pareto_frontier():
    res = client.get("/api/vehicle-performance/pareto-frontier?max_points=50")
    assert res.status_code == 200
    data = res.json()
    assert data["total_evaluated"] == 50
    assert len(data["pareto_frontier"]) > 0


def test_api_track_simulation():
    payload = {
        "front_wing_angle": 18.0,
        "rear_wing_angle": 24.0,
        "ride_height_front": 32.0,
        "ride_height_rear": 42.0,
        "yaw_angle": 1.5,
        "vehicle_speed": 250.0,
        "tyre_grip": 1.75,
        "mass": 810.0,
    }
    res = client.post("/api/vehicle-performance/track-simulation", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["corners"]) == 11
    assert len(data["straights"]) == 5
    assert data["modeled_lap_time_s"] > 70.0
