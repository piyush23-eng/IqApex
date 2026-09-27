from fastapi.testclient import TestClient

from app.analytics.corner_analysis import MONZA_CORNERS
from app.analytics.decomposition import LapTimeDecomposer
from app.analytics.reference_selector import ReferenceSelector
from app.analytics.segmentation import LapSegmenter
from app.services.telemetry_store import store
from app.telemetry.resampling import DistanceResampler


def test_lap_segmenter_physical_phases():
    ref_df = store.get_lap_dataframe("lap-demo-02")
    assert ref_df is not None

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)
    segments = LapSegmenter.segment_lap(res_ref, MONZA_CORNERS)

    assert len(segments) > 0
    categories = {s.category for s in segments}
    assert "braking" in categories
    assert "cornering" in categories
    assert "acceleration" in categories
    assert "straight" in categories

    # Verify contiguous distance coverage
    assert segments[0].start_distance == 0.0
    for i in range(len(segments) - 1):
        assert segments[i].end_distance <= segments[i + 1].start_distance + 1.5


def test_lap_time_decomposer_reconciliation():
    ref_lap = store.laps["lap-demo-02"]
    comp_lap = store.laps["lap-demo-03"]
    ref_df = store.get_lap_dataframe("lap-demo-02")
    comp_df = store.get_lap_dataframe("lap-demo-03")
    assert ref_df is not None and comp_df is not None

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)
    res_comp = DistanceResampler.resample(comp_df, distance_step=1.0)

    result = LapTimeDecomposer.decompose(
        ref_df=res_ref,
        comp_df=res_comp,
        ref_lap=ref_lap,
        comp_lap=comp_lap,
        corners=MONZA_CORNERS,
    )

    expected_total = round(comp_lap.lap_time - ref_lap.lap_time, 4)
    assert result.total_lap_delta == expected_total

    # Reconcile sum of components + residual == total_delta
    summed = (
        result.braking_delta
        + result.cornering_delta
        + result.acceleration_delta
        + result.straight_delta
        + result.residual
    )
    assert round(summed, 4) == expected_total


def test_explicit_residual_reporting():
    ref_lap = store.laps["lap-demo-02"]
    comp_lap = store.laps["lap-demo-03"]
    ref_df = store.get_lap_dataframe("lap-demo-02")
    comp_df = store.get_lap_dataframe("lap-demo-03")
    assert ref_df is not None and comp_df is not None

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)
    res_comp = DistanceResampler.resample(comp_df, distance_step=1.0)

    result = LapTimeDecomposer.decompose(res_ref, res_comp, ref_lap, comp_lap)
    assert isinstance(result.residual, float)
    # Residual should be realistic and non-hidden
    assert abs(result.residual) < 0.20


def test_corner_time_growth():
    ref_lap = store.laps["lap-demo-02"]
    comp_lap = store.laps["lap-demo-03"]
    ref_df = store.get_lap_dataframe("lap-demo-02")
    comp_df = store.get_lap_dataframe("lap-demo-03")
    assert ref_df is not None and comp_df is not None

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)
    res_comp = DistanceResampler.resample(comp_df, distance_step=1.0)

    result = LapTimeDecomposer.decompose(res_ref, res_comp, ref_lap, comp_lap)
    assert len(result.corners_growth) == 11

    t1 = result.corners_growth[0]
    assert t1.corner_id == "T1"
    # Growth entry->apex + apex->exit == total corner delta
    growth_sum = round(t1.entry_to_apex_growth + t1.apex_to_exit_growth, 4)
    assert growth_sum == t1.total_corner_delta


def test_sector_decomposition():
    ref_lap = store.laps["lap-demo-02"]
    comp_lap = store.laps["lap-demo-03"]
    ref_df = store.get_lap_dataframe("lap-demo-02")
    comp_df = store.get_lap_dataframe("lap-demo-03")
    assert ref_df is not None and comp_df is not None

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)
    res_comp = DistanceResampler.resample(comp_df, distance_step=1.0)

    result = LapTimeDecomposer.decompose(res_ref, res_comp, ref_lap, comp_lap)
    assert len(result.sectors) == 3
    s1 = result.sectors[0]
    assert s1.sector == 1
    assert "T1" in s1.corner_contributions


def test_waterfall_steps():
    ref_lap = store.laps["lap-demo-02"]
    comp_lap = store.laps["lap-demo-03"]
    ref_df = store.get_lap_dataframe("lap-demo-02")
    comp_df = store.get_lap_dataframe("lap-demo-03")
    assert ref_df is not None and comp_df is not None

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)
    res_comp = DistanceResampler.resample(comp_df, distance_step=1.0)

    result = LapTimeDecomposer.decompose(res_ref, res_comp, ref_lap, comp_lap)
    assert len(result.waterfall_steps) >= 12
    assert result.waterfall_steps[0].category == "baseline"
    assert result.waterfall_steps[-1].category == "total"
    assert result.waterfall_steps[-1].end_time == result.total_lap_delta


def test_zero_delta_edge_case():
    ref_lap = store.laps["lap-demo-02"]
    ref_df = store.get_lap_dataframe("lap-demo-02")
    assert ref_df is not None

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)

    # Compare lap with itself (zero delta)
    result = LapTimeDecomposer.decompose(res_ref, res_ref, ref_lap, ref_lap)
    assert result.total_lap_delta == 0.0
    assert result.residual == 0.0
    # No NaN percentages
    for p in result.phases:
        assert p.percentage_of_total is None or not isinstance(p.percentage_of_total, str)


def test_api_decomposition_endpoint(client: TestClient):
    res = client.get(
        "/api/analysis/decomposition",
        params={"comp_lap_id": "lap-demo-03", "ref_lap_id": "lap-demo-02"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["reference_lap_id"] == "lap-demo-02"
    assert data["comparison_lap_id"] == "lap-demo-03"
    assert data["total_lap_delta"] == round(80.624 - 80.418, 4)
    assert "braking_delta" in data
    assert "cornering_delta" in data
    assert "residual" in data
    assert len(data["phases"]) > 0
    assert len(data["waterfall_steps"]) > 0
    assert data["provenance"]["methodology"] is not None


def test_reference_selection_methods():
    # 1. Selected Lap
    lap_sel, audit = ReferenceSelector.resolve_reference(
        method="selected_lap", selected_lap_id="lap-demo-02"
    )
    assert lap_sel.lap_id == "lap-demo-02"
    assert audit["method"] == "selected_lap"

    # 2. Session Best Valid
    lap_best, _audit_best = ReferenceSelector.resolve_reference(
        method="session_best_valid", session_id="demo-session-monza-2026"
    )
    assert lap_best.valid is True
    # Fastest lap in session is lap-demo-02 (80.418s)
    assert lap_best.lap_time <= 80.42

    # 3. Median Valid
    lap_med, audit_med = ReferenceSelector.resolve_reference(
        method="median_valid", session_id="demo-session-monza-2026"
    )
    assert lap_med.valid is True
    assert audit_med["valid_laps_count"] > 1
