from app.analytics.tyre_model import SyntheticTyreModel


def test_tyre_model_compounds_loading():
    tm = SyntheticTyreModel()
    assert "SOFT" in tm.compounds
    assert "MEDIUM" in tm.compounds
    assert "HARD" in tm.compounds

    soft = tm.compounds["SOFT"]
    hard = tm.compounds["HARD"]
    assert soft.initial_grip > hard.initial_grip
    assert soft.degradation_a > hard.degradation_a


def test_tyre_degradation_monotonicity():
    tm = SyntheticTyreModel()
    # Check that degradation penalty monotonically increases after warmup phase
    s_3 = tm.evaluate_grip("MEDIUM", 3)
    s_15 = tm.evaluate_grip("MEDIUM", 15)
    s_30 = tm.evaluate_grip("MEDIUM", 30)

    assert s_3.effective_grip >= s_15.effective_grip >= s_30.effective_grip
    assert s_3.degradation_penalty_s <= s_15.degradation_penalty_s <= s_30.degradation_penalty_s


def test_thermal_penalty_effect():
    tm = SyntheticTyreModel()
    std_dry = tm.evaluate_grip("SOFT", 15, weather_thermal_mult=1.0)
    hot_dry = tm.evaluate_grip("SOFT", 15, weather_thermal_mult=1.4)

    assert hot_dry.effective_grip < std_dry.effective_grip
    assert hot_dry.thermal_penalty_s > std_dry.thermal_penalty_s
