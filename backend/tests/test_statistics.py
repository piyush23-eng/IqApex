from fastapi.testclient import TestClient

from app.analytics.statistics import StatisticsEngine


def test_descriptive_statistics_and_confidence_interval():
    data = [80.418, 80.520, 80.680, 80.820, 81.040]
    stats = StatisticsEngine.compute_descriptive_stats(data, "lap_time", confidence_level=0.95)

    assert stats.sample_count == 5
    assert stats.mean > 80.4 and stats.mean < 81.1
    assert stats.median == 80.680
    assert stats.std_dev > 0
    assert stats.ci_95_lower < stats.mean < stats.ci_95_upper

    # Prediction interval should be strictly wider than confidence interval of the mean
    pi_width = stats.prediction_interval_upper - stats.prediction_interval_lower
    ci_width = stats.ci_95_upper - stats.ci_95_lower
    assert pi_width > ci_width


def test_outlier_detection_iqr():
    # Regular laps + one huge outlier (82.95s lockup)
    laps = [80.418, 80.520, 80.680, 80.820, 81.040, 82.950]
    ids = ["L1", "L2", "L3", "L4", "L5", "L6-Outlier"]

    report = StatisticsEngine.detect_outliers(laps, observation_ids=ids, method="iqr")
    assert report.total_samples == 6
    assert report.excluded_count >= 1
    assert report.included_count <= 5

    excluded_ids = [e["id"] for e in report.excluded_observations]
    assert "L6-Outlier" in excluded_ids
    assert "Above upper fence" in report.excluded_observations[0]["reason"]


def test_correlation_analysis():
    x = [1.0, 2.0, 3.0, 4.0, 5.0]
    y = [80.4, 80.6, 80.8, 81.0, 81.2]  # Strongly correlated

    corr = StatisticsEngine.compute_correlation(x, y, "tyre_age", "lap_time")
    assert corr.sample_count == 5
    assert corr.pearson_r > 0.99
    assert corr.pearson_p_value < 0.01
    assert corr.is_significant_005 is True


def test_linear_regression_model():
    tyre_ages = [1.0, 2.0, 3.0, 4.0, 5.0]
    lap_times = [80.42, 80.55, 80.69, 80.84, 81.01]  # ~0.14s degradation per lap
    obs_ids = [f"L{i}" for i in range(1, 6)]

    reg = StatisticsEngine.compute_linear_regression(
        x_vals=tyre_ages,
        y_vals=lap_times,
        obs_ids=obs_ids,
        target_metric="lap_time",
        feat_metric="tyre_age",
    )

    assert reg.sample_count == 5
    assert 0.12 <= reg.slope <= 0.16
    assert reg.r_squared > 0.98
    assert reg.ci_95_slope_lower < reg.slope < reg.ci_95_slope_upper
    assert len(reg.residuals) == 5


def test_api_repeated_laps(client: TestClient):
    res = client.get(
        "/api/analysis/statistics/repeated-laps",
        params={"session_id": "demo-session-monza-2026", "metric": "lap_time"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["session_id"] == "demo-session-monza-2026"
    assert data["metric"] == "lap_time"
    assert data["descriptive"]["sample_count"] > 5
    assert data["descriptive"]["ci_95_lower"] > 0
    assert "outliers" in data


def test_api_correlation(client: TestClient):
    res = client.get(
        "/api/analysis/statistics/correlation",
        params={
            "session_id": "demo-session-monza-2026",
            "feature_x": "sector_1",
            "feature_y": "lap_time",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["sample_count"] > 5
    assert "pearson_r" in data
    assert "spearman_rho" in data


def test_api_regression(client: TestClient):
    res = client.get(
        "/api/analysis/statistics/regression",
        params={
            "session_id": "demo-session-monza-2026",
            "driver_id": "drv-16",
            "feature_metric": "tyre_age",
            "target_metric": "lap_time",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["sample_count"] >= 5
    assert data["slope"] > 0  # Lap time increases with tyre age
    assert len(data["residuals"]) > 0


def test_api_sensitivity(client: TestClient):
    res = client.get(
        "/api/analysis/statistics/sensitivity",
        params={"ref_lap_id": "lap-demo-02", "comp_lap_id": "lap-demo-03"},
    )
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 11
    assert items[0]["feature"].endswith("Apex Speed")
