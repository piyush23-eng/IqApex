from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_api_strategy_config():
    res = client.get("/api/strategy/config")
    assert res.status_code == 200
    data = res.json()
    assert "race" in data
    assert data["race"]["total_laps"] == 53
    assert "pit_stop" in data


def test_api_strategy_generate():
    res = client.get("/api/strategy/generate?max_stops=2")
    assert res.status_code == 200
    data = res.json()
    assert data["total_strategies"] >= 5
    assert data["circuit"] == "Autodromo Nazionale Monza"


def test_api_strategy_simulate_race():
    payload = {
        "strategy_id": "TEST_1STOP_MH",
        "stints": [
            {"compound": "MEDIUM", "laps": 25},
            {"compound": "HARD", "laps": 28},
        ],
        "weather": "DRY",
        "safety_car": "GREEN",
        "traffic": "LIGHT_TRAFFIC",
    }
    res = client.post("/api/strategy/simulate-race", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_race_time_s"] > 4000.0
    assert len(data["laps"]) == 53
    assert len(data["stints"]) == 2


def test_api_strategy_monte_carlo():
    payload = {
        "strategy_id": "TEST_1STOP_MH",
        "stints": [
            {"compound": "MEDIUM", "laps": 25},
            {"compound": "HARD", "laps": 28},
        ],
        "iterations": 100,
        "simulation_seed": 42871,
    }
    res = client.post("/api/strategy/monte-carlo", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["iterations"] == 100
    assert data["p05_race_time_s"] < data["p95_race_time_s"]
