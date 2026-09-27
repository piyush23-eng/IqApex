import numpy as np

from app.analytics.response_models import (
    InteractionResponseModel,
    LinearResponseModel,
    ModelSelector,
    PolynomialResponseModel,
    SplineResponseModel,
)


def test_linear_response_model_fit_and_intervals():
    x = np.array([178.0, 179.5, 181.0, 182.5, 184.0, 185.5])
    # Corner time decreases with higher exit speed
    y = np.array([4.28, 4.25, 4.22, 4.20, 4.17, 4.15])
    groups = np.array(["r1", "r1", "r1", "r2", "r2", "r2"])

    model = LinearResponseModel(target_name="corner_time", feature_name="corner_exit_speed")
    metrics = model.fit(x, y, groups=groups)

    assert metrics.r_squared > 0.90
    assert metrics.rmse < 0.05
    assert model.slope < 0.0  # Speed gain reduces transit time

    # Interval checks at x=181.0
    pred = model.predict_with_intervals(181.0)
    assert 4.18 < pred.prediction < 4.24
    assert pred.ci_95_lower < pred.prediction < pred.ci_95_upper
    assert pred.pi_95_lower < pred.prediction < pred.pi_95_upper

    # Prediction interval must be strictly wider than Confidence interval for the mean
    pi_width = pred.pi_95_upper - pred.pi_95_lower
    ci_width = pred.ci_95_upper - pred.ci_95_lower
    assert pi_width > ci_width

    # Metadata check
    assert model.metadata is not None
    assert model.metadata.model_type == "linear"
    assert model.metadata.pipeline_version == "5.0.0"
    assert len(model.metadata.model_hash) == 16


def test_polynomial_response_model():
    x = np.array([175.0, 177.0, 179.0, 181.0, 183.0, 185.0, 187.0])
    y = 4.20 - 0.015 * (x - 180.0) + 0.001 * (x - 180.0) ** 2
    groups = np.array(["r1", "r1", "r1", "r2", "r2", "r2", "r2"])

    poly = PolynomialResponseModel(
        target_name="corner_time", feature_name="corner_exit_speed", degree=2
    )
    metrics = poly.fit(x, y, groups=groups)

    assert metrics.r_squared > 0.85
    assert poly.is_fitted is True

    pred = poly.predict_with_intervals(181.0)
    assert pred.prediction > 0.0
    assert pred.pi_95_upper > pred.ci_95_upper


def test_spline_response_model():
    x = np.array([175.0, 177.0, 179.0, 181.0, 183.0, 185.0])
    y = np.array([4.30, 4.26, 4.22, 4.19, 4.16, 4.14])

    spline = SplineResponseModel(target_name="corner_time", feature_name="corner_exit_speed", k=2)
    metrics = spline.fit(x, y)

    assert metrics.rmse < 0.05
    pred = spline.predict_with_intervals(180.0)
    assert 4.15 < pred.prediction < 4.25


def test_interaction_response_model():
    x1 = np.array([140.0, 142.0, 144.0, 140.0, 142.0, 144.0])
    x2 = np.array([180.0, 180.0, 180.0, 184.0, 184.0, 184.0])
    y = 4.30 - 0.008 * (x1 - 140.0) - 0.012 * (x2 - 180.0)
    groups = np.array(["r1", "r1", "r1", "r2", "r2", "r2"])

    inter = InteractionResponseModel(
        target_name="corner_time", feature_names=["corner_minimum_speed", "corner_exit_speed"]
    )
    metrics = inter.fit(x1, x2, y, groups=groups)

    assert metrics.r_squared > 0.95
    pred = inter.predict_point(141.0, 182.0)
    assert pred.prediction < 4.30
    assert pred.pi_95_upper > pred.ci_95_upper


def test_model_selector_grouped_cv():
    rng = np.random.default_rng(42871)
    x = np.linspace(175.0, 185.0, 12)
    y = 4.25 - 0.012 * (x - 175.0) + rng.normal(0, 0.005, 12)
    groups = np.array(["r1"] * 6 + ["r2"] * 6)

    best_model, meta_list = ModelSelector.fit_and_select(
        x=x,
        y=y,
        target_name="corner_time",
        feature_name="corner_exit_speed",
        groups=groups,
    )

    assert best_model.is_fitted is True
    assert len(meta_list) >= 2
    assert best_model.metadata is not None
    assert "GroupKFold" in best_model.metadata.validation_methodology
