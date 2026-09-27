from fastapi.testclient import TestClient


def test_health_check(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "environment" in data
    assert "version" in data


def test_list_sessions(client: TestClient) -> None:
    response = client.get("/api/sessions")
    assert response.status_code == 200
    sessions = response.json()
    assert isinstance(sessions, list)
    assert len(sessions) > 0
    first = sessions[0]
    assert "session_id" in first
    assert "circuit" in first
    assert "track_temperature" in first


def test_get_session_by_id(client: TestClient) -> None:
    # Query demo session
    response = client.get("/api/sessions/demo-session-monza-2026")
    assert response.status_code == 200
    data = response.json()
    assert data["session"]["circuit"] == "Autodromo Nazionale Monza"
    assert data["data_label"] == "Synthetic demonstration dataset"
    assert len(data["drivers"]) >= 2
    assert len(data["runs"]) >= 1

    # Query non-existent session
    response_404 = client.get("/api/sessions/unknown-session-99")
    assert response_404.status_code == 404


def test_get_run_by_id(client: TestClient) -> None:
    response = client.get("/api/runs/run-03-soft-stint")
    assert response.status_code == 200
    data = response.json()
    assert data["run"]["compound"] == "SOFT (C4)"
    assert data["driver"]["name"] == "L. Hamilton"
    assert len(data["laps"]) >= 1


def test_get_lap_by_id(client: TestClient) -> None:
    response = client.get("/api/laps/lap-demo-02")
    assert response.status_code == 200
    data = response.json()
    assert data["lap"]["lap_number"] == 2
    assert data["telemetry_available"] is True
    assert data["data_quality"]["status"] == "PASS"


def test_get_telemetry_with_downsample(client: TestClient) -> None:
    # Full points
    res_full = client.get("/api/telemetry/lap-demo-02")
    assert res_full.status_code == 200
    full_data = res_full.json()
    assert full_data["data_label"] == "Synthetic demonstration dataset"
    raw_count = full_data["total_raw_points"]
    assert raw_count > 100
    assert full_data["downsampled"] is False

    # Downsampled
    res_down = client.get("/api/telemetry/lap-demo-02?downsample=100")
    assert res_down.status_code == 200
    down_data = res_down.json()
    assert down_data["downsampled"] is True
    assert down_data["returned_points"] <= 100
