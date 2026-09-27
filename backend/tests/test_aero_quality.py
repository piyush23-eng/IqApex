from app.analytics.aero_quality import AeroDatasetQualityAuditor
from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator


def test_aero_quality_audit_clean_data():
    gen = SyntheticAeroGenerator()
    df, _meta = gen.generate_doe_dataset(sample_count=300, random_seed=42871)
    
    _clean_df, report = AeroDatasetQualityAuditor.audit_dataset(df)
    assert report.total_configurations == 300
    assert report.retained_configurations > 280
    assert report.quality_score > 90.0
    assert report.label == "Synthetic engineering dataset quality audit"
    assert "downforce_n" in report.valid_domain_bounds


def test_aero_quality_rejection_of_unphysical_records():
    gen = SyntheticAeroGenerator()
    df, _ = gen.generate_doe_dataset(sample_count=50, random_seed=42871)
    
    # Inject bad values
    df.loc[0, "cl"] = -0.5
    df.loc[1, "drag_n"] = -10.0
    df.loc[2, "lift_to_drag"] = 9.5
    df.loc[3, "aero_balance_pct"] = 15.0

    _, report = AeroDatasetQualityAuditor.audit_dataset(df)
    assert report.rejected_configurations >= 4
    assert report.rejection_reasons["negative_or_zero_downforce"] >= 1
    assert report.rejection_reasons["negative_or_zero_drag"] >= 1
    assert report.rejection_reasons["unphysical_lift_drag_ratio"] >= 1
    assert report.rejection_reasons["unphysical_aero_balance"] >= 1
