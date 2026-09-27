from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler


@dataclass
class SurrogateMetrics:
    mae: float
    rmse: float
    r_squared: float
    cv_rmse: float
    sample_count: int
    residual_mean: float
    residual_std: float


@dataclass
class VehicleModelMetadata:
    model_id: str
    target: str
    model_type: str
    features: list[str]
    training_dataset: str
    validation_dataset: str
    metrics: SurrogateMetrics
    training_timestamp: str
    model_version: str
    dataset_hash: str
    model_hash: str
    observed_domain: dict[str, tuple[float, float]]
    random_seed: int
    scientific_label: str = "Synthetic engineering surrogate model"


@dataclass
class SurrogatePrediction:
    prediction: float
    pi_95_lower: float
    pi_95_upper: float
    standard_error: float
    domain_status: Literal["INTERPOLATION", "EXTRAPOLATION"]
    distance_from_domain: float


class AeroSurrogateModel:
    """
    Surrogate Model trained on synthetic aerodynamic DoE dataset.
    Supports Linear, Polynomial, Random Forest, and Gradient Boosting.
    Includes region-based structured cross-validation to prevent data leakage.
    """

    def __init__(
        self,
        target_name: str,
        feature_names: list[str],
        model_family: Literal["linear", "polynomial", "random_forest", "gradient_boosting"] = "gradient_boosting",
        random_seed: int = 42871,
    ) -> None:
        self.target_name = target_name
        self.feature_names = feature_names
        self.model_family = model_family
        self.random_seed = random_seed
        self.is_fitted: bool = False
        self.observed_domain: dict[str, tuple[float, float]] = {}
        self.metadata: VehicleModelMetadata | None = None
        self.residual_std: float = 0.0

        if model_family == "linear":
            self.model = Pipeline([("scaler", StandardScaler()), ("regressor", LinearRegression())])
        elif model_family == "polynomial":
            self.model = Pipeline([
                ("poly", PolynomialFeatures(degree=2, include_bias=False)),
                ("scaler", StandardScaler()),
                ("regressor", LinearRegression()),
            ])
        elif model_family == "random_forest":
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=12,
                min_samples_split=4,
                random_state=random_seed,
                n_jobs=-1,
            )
        elif model_family == "gradient_boosting":
            self.model = HistGradientBoostingRegressor(
                max_iter=120,
                max_depth=8,
                min_samples_leaf=5,
                random_state=random_seed,
            )
        else:
            raise ValueError(f"Unsupported model family: {model_family}")

    def fit(self, df: pd.DataFrame, dataset_hash: str = "synthetic-hash") -> VehicleModelMetadata:
        X = df[self.feature_names].values
        y = df[self.target_name].values
        n_samples = len(X)

        # Store observed bounding box for extrapolation checks
        for idx, feat in enumerate(self.feature_names):
            self.observed_domain[feat] = (float(np.min(X[:, idx])), float(np.max(X[:, idx])))

        # Structured regional validation (stratified/spatial grouping to avoid leakage)
        # We split by speed or wing angle bins rather than random rows
        sort_idx = np.argsort(X[:, 0])  # Sort by front wing or first feature
        kf = KFold(n_splits=5, shuffle=False)
        cv_rmses = []
        for train_idx, val_idx in kf.split(X[sort_idx]):
            m_cv = self._create_clone()
            m_cv.fit(X[sort_idx][train_idx], y[sort_idx][train_idx])
            y_pred_val = m_cv.predict(X[sort_idx][val_idx])
            cv_rmses.append(np.sqrt(mean_squared_error(y[sort_idx][val_idx], y_pred_val)))
        avg_cv_rmse = float(np.mean(cv_rmses))

        # Fit final model on full dataset
        self.model.fit(X, y)
        y_pred = self.model.predict(X)

        mae = float(mean_absolute_error(y, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y, y_pred)))
        r2 = float(r2_score(y, y_pred))
        residuals = y - y_pred
        res_mean = float(np.mean(residuals))
        self.residual_std = float(np.std(residuals, ddof=1)) if n_samples > 1 else 1.0

        metrics = SurrogateMetrics(
            mae=round(mae, 4),
            rmse=round(rmse, 4),
            r_squared=round(r2, 4),
            cv_rmse=round(avg_cv_rmse, 4),
            sample_count=n_samples,
            residual_mean=round(res_mean, 4),
            residual_std=round(self.residual_std, 4),
        )

        model_sig = f"{self.target_name}_{self.model_family}_{self.feature_names}_{rmse:.4f}"
        model_hash = hashlib.sha256(model_sig.encode()).hexdigest()[:16]

        self.metadata = VehicleModelMetadata(
            model_id=f"aero_surrogate_{self.target_name}_{self.model_family}",
            target=self.target_name,
            model_type=self.model_family,
            features=self.feature_names,
            training_dataset="synthetic_aero_v6.0.0",
            validation_dataset="structured_spatial_kfold_cv5",
            metrics=metrics,
            training_timestamp=datetime.now(timezone.utc).isoformat(),
            model_version="6.0.0-synthetic",
            dataset_hash=dataset_hash,
            model_hash=model_hash,
            observed_domain=self.observed_domain,
            random_seed=self.random_seed,
        )
        self.is_fitted = True
        return self.metadata

    def predict_single(self, feature_values: dict[str, float]) -> SurrogatePrediction:
        """
        Predicts scalar output with analytical 95% Prediction Interval (PI)
        and domain extrapolation detection.
        """
        if not self.is_fitted or self.metadata is None:
            raise RuntimeError("Model must be fitted before predict_single")

        x_vec = np.array([[feature_values[f] for f in self.feature_names]])
        pred = float(self.model.predict(x_vec)[0])

        # Extrapolation check
        dist_out = 0.0
        is_extrap = False
        for f in self.feature_names:
            val = feature_values[f]
            f_min, f_max = self.observed_domain[f]
            if val < f_min:
                dist_out += (f_min - val) / max(f_max - f_min, 1.0)
                is_extrap = True
            elif val > f_max:
                dist_out += (val - f_max) / max(f_max - f_min, 1.0)
                is_extrap = True

        # 95% Prediction interval (including residual dispersion + extrapolation penalty)
        uncertainty_multiplier = 1.96 * (1.0 + 2.0 * dist_out)
        pi_half_width = uncertainty_multiplier * self.residual_std

        return SurrogatePrediction(
            prediction=round(pred, 3),
            pi_95_lower=round(pred - pi_half_width, 3),
            pi_95_upper=round(pred + pi_half_width, 3),
            standard_error=round(self.residual_std * (1.0 + dist_out), 3),
            domain_status="EXTRAPOLATION" if is_extrap else "INTERPOLATION",
            distance_from_domain=round(dist_out, 3),
        )

    def _create_clone(self) -> Any:
        if self.model_family == "linear":
            return Pipeline([("scaler", StandardScaler()), ("regressor", LinearRegression())])
        elif self.model_family == "polynomial":
            return Pipeline([
                ("poly", PolynomialFeatures(degree=2, include_bias=False)),
                ("scaler", StandardScaler()),
                ("regressor", LinearRegression()),
            ])
        elif self.model_family == "random_forest":
            return RandomForestRegressor(
                n_estimators=50, max_depth=10, random_state=self.random_seed, n_jobs=-1
            )
        elif self.model_family == "gradient_boosting":
            return HistGradientBoostingRegressor(
                max_iter=80, max_depth=6, random_state=self.random_seed
            )
        return LinearRegression()
