from app.analytics.aero_quality import AeroDatasetQualityAuditor
from app.analytics.aero_surrogate import AeroSurrogateModel
from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator


def test_aero_surrogate_models_training_and_metrics():
    gen = SyntheticAeroGenerator()
    df, meta = gen.generate_doe_dataset(sample_count=200, random_seed=42871)
    clean_df, _ = AeroDatasetQualityAuditor.audit_dataset(df)

    feature_cols = [
        "front_wing_angle",
        "rear_wing_angle",
        "ride_height_front",
        "ride_height_rear",
        "yaw_angle",
        "vehicle_speed",
    ]

    # Test Gradient Boosting
    gbr = AeroSurrogateModel("downforce_n", feature_cols, model_family="gradient_boosting")
    metadata = gbr.fit(clean_df, dataset_hash=meta.dataset_hash)
    assert metadata.metrics.r_squared > 0.90
    assert metadata.metrics.cv_rmse > 0.0
    assert gbr.is_fitted

    # Test Prediction within observed domain (Interpolation)
    pred_interp = gbr.predict_single({
        "front_wing_angle": 18.0,
        "rear_wing_angle": 24.0,
        "ride_height_front": 32.0,
        "ride_height_rear": 42.0,
        "yaw_angle": 1.5,
        "vehicle_speed": 250.0,
    })
    assert pred_interp.domain_status == "INTERPOLATION"
    assert pred_interp.pi_95_lower < pred_interp.prediction < pred_interp.pi_95_upper

    # Test Extrapolation detection
    pred_extrap = gbr.predict_single({
        "front_wing_angle": 45.0,  # Well beyond 35 deg maximum
        "rear_wing_angle": 24.0,
        "ride_height_front": 32.0,
        "ride_height_rear": 42.0,
        "yaw_angle": 1.5,
        "vehicle_speed": 250.0,
    })
    assert pred_extrap.domain_status == "EXTRAPOLATION"
    assert pred_extrap.distance_from_domain > 0.0
