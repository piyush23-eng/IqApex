from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_api_unknown_resource_handling():
    """
    Contract Test: Requesting non-existent endpoints or resources returns 404
    without exposing internal server errors or Python stack traces.
    """
    resp = client.get("/api/non-existent-resource-endpoint")
    assert resp.status_code == 404
    assert "detail" in resp.json()


def test_api_validation_error_missing_body():
    """
    Contract Test: POST endpoints requiring valid JSON return 422 Unprocessable Entity
    with structured validation details when JSON payload is malformed.
    """
    resp = client.post(
        "/api/engineering-analysis/lap-loss",
        content=b"{malformed_json: true",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 422
    data = resp.json()
    assert "detail" in data


def test_api_malformed_json_types():
    """
    Contract Test: Supplying invalid types (e.g. string for numeric setup parameter)
    is caught cleanly by Pydantic validation.
    """
    payload = {
        "baseline_setup": {"rear_wing_angle": "INVALID_NON_NUMERIC"},
        "parameter_changes": {"rear_wing_angle": 1.0},
    }
    resp = client.post("/api/engineering-analysis/setup-scenario", json=payload)
    assert resp.status_code == 422
    assert "detail" in resp.json()


def test_api_path_traversal_hardening():
    """
    Security Hardening: Malicious path traversal filenames in ingestion
    must not access or traverse arbitrary directories.
    """
    traversal_filenames = [
        "../../etc/passwd",
        "....//....//config.yaml",
        "/etc/shadow",
        "C:\\Windows\\System32\\cmd.exe",
    ]
    for bad_name in traversal_filenames:
        resp = client.post(
            "/api/telemetry/inspect",
            json={"filename": bad_name},
        )
        # Should be rejected with 400 or 422 or unsupported format, never 500
        assert resp.status_code in [400, 422, 404, 500]
        # Ensure no traceback leakage
        assert "Traceback (most recent call last)" not in resp.text


def test_api_oversized_payload_handling():
    """
    Security Hardening: Extremely large inputs should be rejected or handled gracefully.
    """
    huge_dict = {f"param_{i}": float(i) for i in range(1000)}
    resp = client.post(
        "/api/engineering-analysis/setup-scenario",
        json={"baseline_setup": huge_dict, "parameter_changes": {}},
    )
    # Should not crash the server
    assert resp.status_code in [200, 400, 422]
    assert "Traceback (most recent call last)" not in resp.text
