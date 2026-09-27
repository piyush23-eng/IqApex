from fastapi.testclient import TestClient

from app.analytics.corner_analysis import (
    MONZA_CORNERS,
    CornerKinematicsCalculator,
    get_circuit_corners,
)
from app.services.telemetry_store import store
from app.telemetry.resampling import DistanceResampler


def test_monza_corner_definitions():
    corners = get_circuit_corners("Autodromo Nazionale Monza")
    assert len(corners) == 11
    assert corners[0].corner_id == "T1"
    assert corners[0].turn_number == 1
    assert corners[0].entry_distance < corners[0].apex_distance < corners[0].exit_distance
    assert corners[-1].corner_id == "T11"


def test_corner_kinematics_computation():
    ref_df = store.get_lap_dataframe("lap-demo-02")
    comp_df = store.get_lap_dataframe("lap-demo-03")
    assert ref_df is not None and comp_df is not None

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)
    res_comp = DistanceResampler.resample(comp_df, distance_step=1.0)

    metrics = CornerKinematicsCalculator.compute_corner_metrics(res_ref, res_comp, MONZA_CORNERS)
    assert len(metrics) == 11

    t1 = metrics[0]
    assert t1.corner_id == "T1"
    assert t1.ref_min_speed > 0
    assert t1.comp_min_speed > 0
    assert t1.ref_entry_speed > t1.ref_min_speed
    assert t1.entry_distance <= t1.ref_apex_distance <= t1.exit_distance


def test_sector_comparisons():
    sectors = CornerKinematicsCalculator.compute_sector_comparisons(
        ref_s1=26.754,
        ref_s2=27.112,
        ref_s3=26.552,
        comp_s1=26.820,
        comp_s2=27.194,
        comp_s3=26.610,
    )
    assert len(sectors) == 3
    assert sectors[0].sector == 1
    assert sectors[0].delta == round(26.820 - 26.754, 3)
    assert sectors[1].delta == round(27.194 - 27.112, 3)
    assert sectors[2].delta == round(26.610 - 26.552, 3)


def test_api_get_corners(client: TestClient):
    res = client.get("/api/analysis/corners/monza")
    assert res.status_code == 200
    corners = res.json()
    assert len(corners) == 11
    assert corners[0]["corner_id"] == "T1"


def test_api_comparison_summary(client: TestClient):
    res = client.get(
        "/api/analysis/compare/summary",
        params={"ref_lap_id": "lap-demo-02", "comp_lap_id": "lap-demo-03"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["reference_lap_id"] == "lap-demo-02"
    assert data["comparison_lap_id"] == "lap-demo-03"
    assert data["data_label"] == "Synthetic demonstration dataset"
    assert data["reference_driver"]["name"] == "L. Hamilton"
    assert data["comparison_driver"]["name"] == "C. Leclerc"
    assert data["lap_time_delta"] == round(80.624 - 80.418, 4)
    assert len(data["sectors"]) == 3
    assert len(data["corners"]) == 11


def test_api_corner_comparison_sorting(client: TestClient):
    # Sort by time_delta desc
    res = client.get(
        "/api/analysis/compare/corners",
        params={
            "ref_lap_id": "lap-demo-02",
            "comp_lap_id": "lap-demo-03",
            "sort_by": "time_delta",
            "sort_order": "desc",
        },
    )
    assert res.status_code == 200
    corners = res.json()
    assert len(corners) == 11
    # Check that it's sorted descending by abs(corner_time_delta)
    deltas = [abs(c["corner_time_delta"]) for c in corners]
    assert deltas == sorted(deltas, reverse=True)


def test_api_aligned_channels(client: TestClient):
    res = client.get(
        "/api/analysis/compare/aligned-channels",
        params={"ref_lap_id": "lap-demo-02", "comp_lap_id": "lap-demo-03", "distance_step": 2.0},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["point_count"] > 1000
    assert len(data["distance"]) == data["point_count"]
    assert len(data["ref_speed"]) == data["point_count"]
    assert len(data["comp_speed"]) == data["point_count"]
    assert len(data["time_delta"]) == data["point_count"]
    assert len(data["speed_delta"]) == data["point_count"]
    assert len(data["ref_throttle"]) == data["point_count"]
    assert len(data["comp_brake"]) == data["point_count"]


def test_api_comparison_not_found(client: TestClient):
    res = client.get(
        "/api/analysis/compare/summary",
        params={"ref_lap_id": "lap-nonexistent", "comp_lap_id": "lap-demo-03"},
    )
    assert res.status_code == 404
