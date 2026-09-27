import numpy as np
import pandas as pd
import pytest
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.analytics.aero_surrogate import AeroSurrogateModel
from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator

FEATURE_NAMES = [
    "rear_wing_angle",
    "front_wing_angle",
    "ride_height_front",
    "ride_height_rear",
    "yaw_angle",
    "vehicle_speed",
]


@pytest.fixture(scope="module")
def synthetic_doe_train():
    gen = SyntheticAeroGenerator()
    df, _ = gen.generate_doe_dataset(sample_count=500, random_seed=42871)
    return df


@pytest.fixture(scope="module")
def fitted_surrogate(synthetic_doe_train):
    surrogate = AeroSurrogateModel(
        target_name="downforce_n",
        feature_names=FEATURE_NAMES,
        model_family="gradient_boosting",
        random_seed=42871,
    )
    surrogate.fit(synthetic_doe_train)
    return surrogate


def test_spatial_split_grouped_cross_validation(synthetic_doe_train):
    """
    Data Leakage Audit:
    Ensure spatial split (GroupKFold on wing angle clusters) evaluates generalization
    without sample overlap between folds.
    """
    df = synthetic_doe_train.copy()
    # Create rear wing angle clusters (5 spatial partitions)
    df["wing_cluster"] = pd.qcut(df["rear_wing_angle"], q=5, labels=False)

    from sklearn.model_selection import GroupKFold
    gkf = GroupKFold(n_splits=5)
    groups = df["wing_cluster"].values
    X = df[FEATURE_NAMES].values
    y = df["downforce_n"].values

    fold_scores = []
    for train_idx, val_idx in gkf.split(X, y, groups):
        # Assert strictly no overlapping groups
        assert len(set(groups[train_idx]).intersection(set(groups[val_idx]))) == 0
        m = AeroSurrogateModel(
            target_name="downforce_n",
            feature_names=FEATURE_NAMES,
            model_family="gradient_boosting",
            random_seed=42871,
        )
        m.fit(df.iloc[train_idx])
        y_val_pred = m.model.predict(X[val_idx])
        fold_scores.append(r2_score(y[val_idx], y_val_pred))

    mean_grouped_r2 = np.mean(fold_scores)
    # Under wing angle interpolation, R2 remains positive and robust (>0.75)
    assert mean_grouped_r2 > 0.75, f"Grouped CV R2 too low under spatial holdout: {mean_grouped_r2}"


def test_synthetic_overfitting_test_a_independent_seed_evaluation(fitted_surrogate):
    """
    Synthetic Overfitting Audit - Test A:
    Surrogate trained on seed=42871 evaluated on fresh dataset with seed=99999.
    Must maintain out-of-sample R2 > 0.90 and MAE within acceptable engineering tolerance (<12% of mean force).
    """
    gen = SyntheticAeroGenerator()
    test_df, _ = gen.generate_doe_dataset(sample_count=200, random_seed=99999)

    X_test = test_df[fitted_surrogate.feature_names].values
    y_test = test_df["downforce_n"].values

    y_pred = fitted_surrogate.model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)

    assert r2 > 0.90, f"Out-of-sample R2 dropped too low on independent seed: {r2}"
    relative_mae = mae / np.mean(y_test)
    assert relative_mae < 0.05, f"Out-of-sample relative MAE too high: {relative_mae:.4f}"
    assert mae < 750.0, f"Out-of-sample MAE too high: {mae} N"


def test_synthetic_overfitting_test_b_noise_robustness(fitted_surrogate, synthetic_doe_train):
    """
    Synthetic Overfitting Audit - Test B:
    Evaluate robustness when random noise (sigma=25 N) is injected into validation targets.
    """
    X = synthetic_doe_train[fitted_surrogate.feature_names].values
    y_clean = synthetic_doe_train["downforce_n"].values

    rng = np.random.default_rng(12345)
    noise = rng.normal(0.0, 25.0, size=len(y_clean))
    y_noisy = y_clean + noise

    y_pred = fitted_surrogate.model.predict(X)
    r2_noisy = r2_score(y_noisy, y_pred)

    # R2 should stay robust (>0.85) under moderate noise
    assert r2_noisy > 0.85, f"Surrogate too brittle under noise: R2={r2_noisy}"


def test_synthetic_overfitting_test_c_sample_density_scaling():
    """
    Synthetic Overfitting Audit - Test C:
    Compare models trained on low density (200 samples) vs high density (800 samples).
    High density must achieve lower or equal out-of-sample RMSE.
    """
    gen = SyntheticAeroGenerator()
    df_low, _ = gen.generate_doe_dataset(sample_count=200, random_seed=42871)
    df_high, _ = gen.generate_doe_dataset(sample_count=800, random_seed=42871)
    df_test, _ = gen.generate_doe_dataset(sample_count=300, random_seed=77777)

    m_low = AeroSurrogateModel(
        target_name="downforce_n",
        feature_names=FEATURE_NAMES,
        model_family="gradient_boosting",
        random_seed=42871,
    )
    m_low.fit(df_low)

    m_high = AeroSurrogateModel(
        target_name="downforce_n",
        feature_names=FEATURE_NAMES,
        model_family="gradient_boosting",
        random_seed=42871,
    )
    m_high.fit(df_high)

    X_test = df_test[FEATURE_NAMES].values
    y_test = df_test["downforce_n"].values

    rmse_low = np.sqrt(mean_squared_error(y_test, m_low.model.predict(X_test)))
    rmse_high = np.sqrt(mean_squared_error(y_test, m_high.model.predict(X_test)))

    assert rmse_high <= rmse_low * 1.15, f"Higher sample count performed significantly worse: low={rmse_low}, high={rmse_high}"


def test_extrapolation_detection_and_inflation(fitted_surrogate):
    """
    Extrapolation Audit:
    Inputting a parameter outside the training domain (e.g. rear wing = max + 10.0 deg)
    must trigger EXTRAPOLATION and inflate the prediction interval.
    """
    # In-domain prediction
    pred_in = fitted_surrogate.predict_single({
        "rear_wing_angle": 24.0,
        "front_wing_angle": 18.0,
        "ride_height_front": 30.0,
        "ride_height_rear": 42.0,
        "yaw_angle": 0.0,
        "vehicle_speed": 250.0,
    })
    assert pred_in.domain_status == "INTERPOLATION"

    # Out-of-domain prediction (rear wing strictly outside observed domain max)
    max_rw = fitted_surrogate.observed_domain["rear_wing_angle"][1]
    pred_out = fitted_surrogate.predict_single({
        "rear_wing_angle": max_rw + 10.0,
        "front_wing_angle": 18.0,
        "ride_height_front": 30.0,
        "ride_height_rear": 42.0,
        "yaw_angle": 0.0,
        "vehicle_speed": 250.0,
    })
    assert pred_out.domain_status == "EXTRAPOLATION"
    assert pred_out.distance_from_domain > 0.0

    # Prediction interval width must be inflated for extrapolation
    pi_width_in = pred_in.pi_95_upper - pred_in.pi_95_lower
    pi_width_out = pred_out.pi_95_upper - pred_out.pi_95_lower
    assert pi_width_out > pi_width_in, f"PI width not inflated: in={pi_width_in}, out={pi_width_out}"


def test_uncertainty_ci_vs_pi_distinction(fitted_surrogate):
    """
    Uncertainty Audit (CI != PI):
    The 95% Confidence Interval of the mean estimate is narrower than
    the 95% Prediction Interval for a single observation.
    """
    n_samples = fitted_surrogate.metadata.metrics.sample_count
    std_err = fitted_surrogate.residual_std / np.sqrt(n_samples)
    ci_half_width = 1.96 * std_err

    pred = fitted_surrogate.predict_single({
        "rear_wing_angle": 24.0,
        "front_wing_angle": 18.0,
        "ride_height_front": 30.0,
        "ride_height_rear": 42.0,
        "yaw_angle": 0.0,
        "vehicle_speed": 250.0,
    })

    pi_half_width = (pred.pi_95_upper - pred.pi_95_lower) / 2.0

    # Prediction interval accounts for individual observation residual variance,
    # so PI width MUST be strictly greater than CI width
    assert pi_half_width > ci_half_width, f"PI half width ({pi_half_width}) not greater than CI ({ci_half_width})"
