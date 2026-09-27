from pathlib import Path

from fastapi.testclient import TestClient

DATA_DIR = Path(__file__).parent / "data"
CSV_FILE = DATA_DIR / "synthetic_telemetry.csv"
PARQUET_FILE = DATA_DIR / "synthetic_telemetry.parquet"


def test_api_inspect_csv(client: TestClient):
    with open(CSV_FILE, "rb") as f:
        res = client.post(
            "/api/telemetry/inspect",
            files={"file": ("synthetic_telemetry.csv", f, "text/csv")},
        )
    assert res.status_code == 200
    data = res.json()
    assert data["file_format"] == "CSV"
    assert data["row_count"] == 500
    assert len(data["core_channels_found"]) == 10
    assert len(data["core_channels_missing"]) == 0
    assert data["estimated_sampling_frequency"] is not None


def test_api_inspect_parquet(client: TestClient):
    with open(PARQUET_FILE, "rb") as f:
        res = client.post(
            "/api/telemetry/inspect",
            files={
                "file": ("synthetic_telemetry.parquet", f, "application/octet-stream")
            },
        )
    assert res.status_code == 200
    data = res.json()
    assert data["file_format"] == "Parquet"
    assert data["row_count"] == 500
    assert len(data["core_channels_found"]) == 10


def test_api_inspect_empty_file_fails(client: TestClient):
    res = client.post(
        "/api/telemetry/inspect", files={"file": ("empty.csv", b"", "text/csv")}
    )
    assert res.status_code == 400


def test_api_ingest_csv_end_to_end(client: TestClient):
    with open(CSV_FILE, "rb") as f:
        res = client.post(
            "/api/telemetry/ingest",
            files={"file": ("synthetic_telemetry.csv", f, "text/csv")},
            data={
                "session_id": "demo-session-monza-2026",
                "run_id": "run-03-soft-stint",
                "lap_id": "lap-test-ingest-01",
                "lap_number": 5,
                "lap_time": 65.0,
                "resample_step": 1.0,
            },
        )
    assert res.status_code == 200
    data = res.json()
    assert data["lap_id"] == "lap-test-ingest-01"
    assert data["raw_points"] == 500
    assert data["resampled_points"] == 3501  # 0 to 3500m at 1m resolution
    assert data["quality"]["status"] == "PASS"
    assert data["quality"]["quality_score"] >= 95.0
    assert data["lineage"]["pipeline_version"] == "2.0.0"
    assert "source_hash" in data["lineage"]

    # Verify query endpoints on newly ingested lap
    res_meta = client.get("/api/telemetry/lap-test-ingest-01/metadata")
    assert res_meta.status_code == 200
    meta = res_meta.json()
    assert meta["lineage"]["pipeline_version"] == "2.0.0"

    res_ch = client.get("/api/telemetry/lap-test-ingest-01/channels")
    assert res_ch.status_code == 200
    assert "speed" in res_ch.json()["channels"]


def test_api_telemetry_compare(client: TestClient):
    # Compare the two pre-seeded demo laps (Hamilton vs Leclerc)
    res = client.post(
        "/api/telemetry/compare",
        json={
            "reference_lap_id": "lap-demo-02",
            "comparison_lap_id": "lap-demo-03",
            "distance_step": 1.0,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["reference_lap_id"] == "lap-demo-02"
    assert data["comparison_lap_id"] == "lap-demo-03"
    assert len(data["distance"]) > 5000
    assert len(data["speed_delta"]) == len(data["distance"])
    assert len(data["time_delta"]) == len(data["distance"])
    # Time delta starts at 0.0
    assert data["time_delta"][0] == 0.0
    # Leclerc lap was slower (80.624 vs 80.418), so final time_delta is positive (+0.206s)
    assert data["time_delta"][-1] > 0.15


def test_api_telemetry_aligned(client: TestClient):
    res = client.get("/api/telemetry/lap-demo-02/aligned?distance_step=1.0")
    assert res.status_code == 200
    data = res.json()
    assert data["downsampled"] is True
    # Track is ~5793 meters, so ~5794 points at 1m
    assert 5700 < data["returned_points"] < 5850
