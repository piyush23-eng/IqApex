from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_export_lap_telemetry_csv():
    # Test valid lap export
    res = client.get("/api/telemetry/lap-demo-02/export/csv")
    assert res.status_code == 200
    assert "text/plain" in res.headers["content-type"]
    
    csv_text = res.text
    lines = csv_text.strip().split("\n")
    assert len(lines) > 100
    
    header = lines[0].split(",")
    assert "timestamp" in header
    assert "speed" in header
    assert "distance" in header


def test_export_nonexistent_lap():
    res = client.get("/api/telemetry/non-existent-lap-999/export/csv")
    assert res.status_code == 404
