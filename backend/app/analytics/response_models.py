from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

import numpy as np
from scipy import stats
from scipy.interpolate import UnivariateSpline
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold, KFold
from sklearn.preprocessing import PolynomialFeatures


@dataclass
class ModelMetrics:
    mae: float
    rmse: float
    r_squared: float
    cv_rmse: float
    sample_count: int
    residual_mean: float
    residual_std: float
    shapiro_p_value: float | None


@dataclass
class ModelMetadata:
    model_id: str
    model_type: Literal["linear", "polynomial", "spline", "interaction"]
    features: list[str]
    target: str
    training_dataset: str
    validation_methodology: str
    training_timestamp: str
    pipeline_version: str
    metrics: ModelMetrics
    observed_domain: dict[str, tuple[float, float]]
    model_hash: str
    training_data_type: str = "Synthetic demonstration dataset"


@dataclass
class PredictionWithInterval:
    prediction: float
    ci_95_lower: float
    ci_95_upper: float
    pi_95_lower: float
    pi_95_upper: float
    standard_error: float
    prediction_error: float


class BaseResponseModel:
    """Base class for all performance response models."""

    def __init__(self, target_name: str, feature_names: list[str]) -> None:
        self.target_name = target_name
        self.feature_names = feature_names
        self.metadata: ModelMetadata | None = None
        self.is_fitted: bool = False
        self.observed_domain: dict[str, tuple[float, float]] = {}
        self.residuals: np.ndarray = np.array([])
        self.residual_std: float = 0.0
        self.n_samples: int = 0
        self.n_params: int = 0
        self.xtx_inv: np.ndarray | None = None

    def predict(self, x: np.ndarray) -> np.ndarray:
        raise NotImplementedError

    def predict_with_intervals(self, x_val: float | np.ndarray) -> PredictionWithInterval:
        raise NotImplementedError

    def is_in_observed_domain(self, feature_val: float, feature_idx: int = 0) -> bool:
        feat_name = self.feature_names[feature_idx]
        if feat_name not in self.observed_domain:
            return False
        d_min, d_max = self.observed_domain[feat_name]
        return d_min <= feature_val <= d_max

    def distance_from_observed_domain(self, feature_val: float, feature_idx: int = 0) -> float:
        feat_name = self.feature_names[feature_idx]
        if feat_name not in self.observed_domain:
            return 0.0
        d_min, d_max = self.observed_domain[feat_name]
        if feature_val < d_min:
            return d_min - feature_val
        elif feature_val > d_max:
            return feature_val - d_max
        return 0.0


class LinearResponseModel(BaseResponseModel):
    """Ordinary Least Squares linear response model: Y = β0 + β1*X + ε."""

    def __init__(self, target_name: str, feature_name: str) -> None:
        super().__init__(target_name, [feature_name])
        self.model = LinearRegression()
        self.slope: float = 0.0
        self.intercept: float = 0.0

    def fit(
        self,
        x: np.ndarray,
        y: np.ndarray,
        groups: np.ndarray | None = None,
        dataset_name: str = "demo-session-monza-2026",
    ) -> ModelMetrics:
        x_2d = x.reshape(-1, 1)
        self.n_samples = len(x)
        self.n_params = 2
        self.observed_domain[self.feature_names[0]] = (float(np.min(x)), float(np.max(x)))

        self.model.fit(x_2d, y)
        self.slope = float(self.model.coef_[0])
        self.intercept = float(self.model.intercept_)

        # In-sample metrics
        y_pred = self.model.predict(x_2d)
        self.residuals = y - y_pred
        self.residual_std = float(
            np.sqrt(np.sum(self.residuals**2) / max(1, self.n_samples - self.n_params))
        )

        mae = float(mean_absolute_error(y, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y, y_pred)))
        r2 = float(r2_score(y, y_pred))

        # Design matrix X design with intercept
        X_mat = np.column_stack([np.ones_like(x), x])
        try:
            self.xtx_inv = np.linalg.pinv(X_mat.T @ X_mat)
        except (np.linalg.LinAlgError, ValueError):
            self.xtx_inv = np.eye(2) * 1e-4

        # Grouped cross-validation (by stint/run)
        cv_rmse = self._compute_grouped_cv(x_2d, y, groups)

        shapiro_p = None
        if len(self.residuals) >= 3:
            try:
                shapiro_p = float(stats.shapiro(self.residuals)[1])
            except (ValueError, RuntimeError):
                shapiro_p = None

        metrics = ModelMetrics(
            mae=mae,
            rmse=rmse,
            r_squared=r2,
            cv_rmse=cv_rmse,
            sample_count=self.n_samples,
            residual_mean=float(np.mean(self.residuals)),
            residual_std=self.residual_std,
            shapiro_p_value=shapiro_p,
        )

        model_hash = hashlib.sha256(
            f"linear-{self.intercept:.5f}-{self.slope:.5f}-{self.n_samples}".encode()
        ).hexdigest()[:16]

        self.metadata = ModelMetadata(
            model_id=f"resp-linear-{self.feature_names[0]}-{self.target_name}",
            model_type="linear",
            features=self.feature_names,
            target=self.target_name,
            training_dataset=dataset_name,
            validation_methodology="GroupKFold (grouped by run/stint)" if groups is not None else "KFold",
            training_timestamp=datetime.now(timezone.utc).isoformat(),
            pipeline_version="5.0.0",
            metrics=metrics,
            observed_domain=self.observed_domain,
            model_hash=model_hash,
        )

        self.is_fitted = True
        return metrics

    def _compute_grouped_cv(
        self, x_2d: np.ndarray, y: np.ndarray, groups: np.ndarray | None
    ) -> float:
        if groups is not None and len(np.unique(groups)) >= 2:
            n_splits = min(3, len(np.unique(groups)))
            gkf = GroupKFold(n_splits=n_splits)
            split_gen = gkf.split(x_2d, y, groups)
        else:
            n_splits = min(3, max(2, len(x_2d) // 2))
            kf = KFold(n_splits=n_splits, shuffle=True, random_state=42871)
            split_gen = kf.split(x_2d)

        errors = []
        for train_idx, val_idx in split_gen:
            m = LinearRegression()
            m.fit(x_2d[train_idx], y[train_idx])
            pred = m.predict(x_2d[val_idx])
            errors.extend((y[val_idx] - pred) ** 2)

        return float(np.sqrt(np.mean(errors))) if errors else 0.0

    def predict(self, x: np.ndarray) -> np.ndarray:
        return self.model.predict(x.reshape(-1, 1))

    def predict_with_intervals(self, x_val: float | np.ndarray) -> PredictionWithInterval:
        x_arr = np.array([x_val]).flatten()
        pred = float(self.predict(x_arr)[0])

        x_vec = np.array([1.0, float(x_val)])
        dof = max(1, self.n_samples - self.n_params)
        t_crit = float(stats.t.ppf(0.975, df=dof))

        if self.xtx_inv is not None:
            leverage = float(x_vec @ self.xtx_inv @ x_vec.T)
        else:
            leverage = 1.0 / max(1, self.n_samples)

        se_mean = float(self.residual_std * np.sqrt(max(1e-9, leverage)))
        se_pred = float(self.residual_std * np.sqrt(max(1e-9, 1.0 + leverage)))

        return PredictionWithInterval(
            prediction=pred,
            ci_95_lower=pred - t_crit * se_mean,
            ci_95_upper=pred + t_crit * se_mean,
            pi_95_lower=pred - t_crit * se_pred,
            pi_95_upper=pred + t_crit * se_pred,
            standard_error=se_mean,
            prediction_error=se_pred,
        )


class PolynomialResponseModel(BaseResponseModel):
    """Polynomial response model: Y = β0 + β1*X + β2*X^2 (+ β3*X^3)."""

    def __init__(self, target_name: str, feature_name: str, degree: int = 2) -> None:
        super().__init__(target_name, [feature_name])
        self.degree = degree
        self.poly = PolynomialFeatures(degree=degree, include_bias=True)
        self.model = LinearRegression(fit_intercept=False)
        self.coefficients: np.ndarray = np.array([])

    def fit(
        self,
        x: np.ndarray,
        y: np.ndarray,
        groups: np.ndarray | None = None,
        dataset_name: str = "demo-session-monza-2026",
    ) -> ModelMetrics:
        x_2d = x.reshape(-1, 1)
        self.n_samples = len(x)
        self.n_params = self.degree + 1
        self.observed_domain[self.feature_names[0]] = (float(np.min(x)), float(np.max(x)))

        X_poly = self.poly.fit_transform(x_2d)
        self.model.fit(X_poly, y)
        self.coefficients = self.model.coef_

        y_pred = self.model.predict(X_poly)
        self.residuals = y - y_pred
        self.residual_std = float(
            np.sqrt(np.sum(self.residuals**2) / max(1, self.n_samples - self.n_params))
        )

        mae = float(mean_absolute_error(y, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y, y_pred)))
        r2 = float(r2_score(y, y_pred))

        try:
            self.xtx_inv = np.linalg.pinv(X_poly.T @ X_poly)
        except (np.linalg.LinAlgError, ValueError):
            self.xtx_inv = np.eye(self.n_params) * 1e-4

        cv_rmse = self._compute_grouped_cv(x_2d, y, groups)

        shapiro_p = None
        if len(self.residuals) >= 3:
            try:
                shapiro_p = float(stats.shapiro(self.residuals)[1])
            except (ValueError, RuntimeError):
                shapiro_p = None

        metrics = ModelMetrics(
            mae=mae,
            rmse=rmse,
            r_squared=r2,
            cv_rmse=cv_rmse,
            sample_count=self.n_samples,
            residual_mean=float(np.mean(self.residuals)),
            residual_std=self.residual_std,
            shapiro_p_value=shapiro_p,
        )

        model_hash = hashlib.sha256(
            f"poly{self.degree}-{'-'.join(f'{c:.4f}' for c in self.coefficients)}".encode()
        ).hexdigest()[:16]

        self.metadata = ModelMetadata(
            model_id=f"resp-poly{self.degree}-{self.feature_names[0]}-{self.target_name}",
            model_type="polynomial",
            features=self.feature_names,
            target=self.target_name,
            training_dataset=dataset_name,
            validation_methodology="GroupKFold (grouped by run/stint)" if groups is not None else "KFold",
            training_timestamp=datetime.now(timezone.utc).isoformat(),
            pipeline_version="5.0.0",
            metrics=metrics,
            observed_domain=self.observed_domain,
            model_hash=model_hash,
        )

        self.is_fitted = True
        return metrics

    def _compute_grouped_cv(
        self, x_2d: np.ndarray, y: np.ndarray, groups: np.ndarray | None
    ) -> float:
        if groups is not None and len(np.unique(groups)) >= 2:
            n_splits = min(3, len(np.unique(groups)))
            gkf = GroupKFold(n_splits=n_splits)
            split_gen = gkf.split(x_2d, y, groups)
        else:
            n_splits = min(3, max(2, len(x_2d) // 2))
            kf = KFold(n_splits=n_splits, shuffle=True, random_state=42871)
            split_gen = kf.split(x_2d)

        errors = []
        for train_idx, val_idx in split_gen:
            poly = PolynomialFeatures(degree=self.degree, include_bias=True)
            X_train = poly.fit_transform(x_2d[train_idx])
            X_val = poly.transform(x_2d[val_idx])
            m = LinearRegression(fit_intercept=False)
            m.fit(X_train, y[train_idx])
            pred = m.predict(X_val)
            errors.extend((y[val_idx] - pred) ** 2)

        return float(np.sqrt(np.mean(errors))) if errors else 0.0

    def predict(self, x: np.ndarray) -> np.ndarray:
        X_poly = self.poly.transform(x.reshape(-1, 1))
        return self.model.predict(X_poly)

    def predict_with_intervals(self, x_val: float | np.ndarray) -> PredictionWithInterval:
        x_arr = np.array([x_val]).flatten()
        pred = float(self.predict(x_arr)[0])

        x_vec = self.poly.transform(np.array([[float(x_val)]]))[0]
        dof = max(1, self.n_samples - self.n_params)
        t_crit = float(stats.t.ppf(0.975, df=dof))

        if self.xtx_inv is not None:
            leverage = float(x_vec @ self.xtx_inv @ x_vec.T)
        else:
            leverage = 1.0 / max(1, self.n_samples)

        se_mean = float(self.residual_std * np.sqrt(max(1e-9, leverage)))
        se_pred = float(self.residual_std * np.sqrt(max(1e-9, 1.0 + leverage)))

        return PredictionWithInterval(
            prediction=pred,
            ci_95_lower=pred - t_crit * se_mean,
            ci_95_upper=pred + t_crit * se_mean,
            pi_95_lower=pred - t_crit * se_pred,
            pi_95_upper=pred + t_crit * se_pred,
            standard_error=se_mean,
            prediction_error=se_pred,
        )


class SplineResponseModel(BaseResponseModel):
    """Univariate spline response model."""

    def __init__(self, target_name: str, feature_name: str, k: int = 3, s: float | None = None) -> None:
        super().__init__(target_name, [feature_name])
        self.k = k
        self.s = s
        self.spline: UnivariateSpline | None = None

    def fit(
        self,
        x: np.ndarray,
        y: np.ndarray,
        groups: np.ndarray | None = None,
        dataset_name: str = "demo-session-monza-2026",
    ) -> ModelMetrics:
        # Sort values by X for spline fitting
        sort_idx = np.argsort(x)
        x_sorted = x[sort_idx]
        y_sorted = y[sort_idx]

        self.n_samples = len(x)
        self.observed_domain[self.feature_names[0]] = (float(np.min(x)), float(np.max(x)))

        k_fit = min(self.k, max(1, len(np.unique(x_sorted)) - 1))
        self.n_params = k_fit + 1

        self.spline = UnivariateSpline(x_sorted, y_sorted, k=k_fit, s=self.s)

        y_pred = np.array([float(self.spline(xi)) for xi in x])
        self.residuals = y - y_pred
        self.residual_std = float(
            np.sqrt(np.sum(self.residuals**2) / max(1, self.n_samples - self.n_params))
        )

        mae = float(mean_absolute_error(y, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y, y_pred)))
        r2 = float(r2_score(y, y_pred))

        # CV score
        cv_rmse = self._compute_grouped_cv(x, y, groups, k_fit)

        metrics = ModelMetrics(
            mae=mae,
            rmse=rmse,
            r_squared=r2,
            cv_rmse=cv_rmse,
            sample_count=self.n_samples,
            residual_mean=float(np.mean(self.residuals)),
            residual_std=self.residual_std,
            shapiro_p_value=None,
        )

        model_hash = hashlib.sha256(
            f"spline-k{k_fit}-{rmse:.4f}-{self.n_samples}".encode()
        ).hexdigest()[:16]

        self.metadata = ModelMetadata(
            model_id=f"resp-spline-{self.feature_names[0]}-{self.target_name}",
            model_type="spline",
            features=self.feature_names,
            target=self.target_name,
            training_dataset=dataset_name,
            validation_methodology="GroupKFold (grouped by run/stint)" if groups is not None else "KFold",
            training_timestamp=datetime.now(timezone.utc).isoformat(),
            pipeline_version="5.0.0",
            metrics=metrics,
            observed_domain=self.observed_domain,
            model_hash=model_hash,
        )

        self.is_fitted = True
        return metrics

    def _compute_grouped_cv(
        self, x: np.ndarray, y: np.ndarray, groups: np.ndarray | None, k_fit: int
    ) -> float:
        if groups is not None and len(np.unique(groups)) >= 2:
            n_splits = min(3, len(np.unique(groups)))
            gkf = GroupKFold(n_splits=n_splits)
            split_gen = gkf.split(x.reshape(-1, 1), y, groups)
        else:
            n_splits = min(3, max(2, len(x) // 2))
            kf = KFold(n_splits=n_splits, shuffle=True, random_state=42871)
            split_gen = kf.split(x)

        errors = []
        for train_idx, val_idx in split_gen:
            x_tr, y_tr = x[train_idx], y[train_idx]
            s_idx = np.argsort(x_tr)
            try:
                sp = UnivariateSpline(x_tr[s_idx], y_tr[s_idx], k=min(k_fit, max(1, len(np.unique(x_tr)) - 1)))
                pred = np.array([float(sp(xi)) for xi in x[val_idx]])
                errors.extend((y[val_idx] - pred) ** 2)
            except (ValueError, RuntimeError):
                continue

        return float(np.sqrt(np.mean(errors))) if errors else 0.0

    def predict(self, x: np.ndarray) -> np.ndarray:
        if self.spline is None:
            return np.zeros_like(x)
        return np.array([float(self.spline(xi)) for xi in x])

    def predict_with_intervals(self, x_val: float | np.ndarray) -> PredictionWithInterval:
        val = float(x_val)
        pred = float(self.spline(val)) if self.spline else 0.0

        dof = max(1, self.n_samples - self.n_params)
        t_crit = float(stats.t.ppf(0.975, df=dof))

        # Approximation of standard error based on spline knots density
        se_mean = float(self.residual_std / np.sqrt(max(1, self.n_samples)))
        se_pred = float(self.residual_std * np.sqrt(1.0 + 1.0 / max(1, self.n_samples)))

        return PredictionWithInterval(
            prediction=pred,
            ci_95_lower=pred - t_crit * se_mean,
            ci_95_upper=pred + t_crit * se_mean,
            pi_95_lower=pred - t_crit * se_pred,
            pi_95_upper=pred + t_crit * se_pred,
            standard_error=se_mean,
            prediction_error=se_pred,
        )


class InteractionResponseModel(BaseResponseModel):
    """
    Two-variable interaction model:
    Y = β0 + β1*X1 + β2*X2 + β3*(X1*X2) + ε
    """

    def __init__(self, target_name: str, feature_names: list[str]) -> None:
        if len(feature_names) != 2:
            raise ValueError("InteractionResponseModel requires exactly two features")
        super().__init__(target_name, feature_names)
        self.model = LinearRegression(fit_intercept=True)
        self.coef_: np.ndarray = np.array([])
        self.intercept_: float = 0.0

    def fit(
        self,
        x1: np.ndarray,
        x2: np.ndarray,
        y: np.ndarray,
        groups: np.ndarray | None = None,
        dataset_name: str = "demo-session-monza-2026",
    ) -> ModelMetrics:
        self.n_samples = len(y)
        self.n_params = 4

        self.observed_domain[self.feature_names[0]] = (float(np.min(x1)), float(np.max(x1)))
        self.observed_domain[self.feature_names[1]] = (float(np.min(x2)), float(np.max(x2)))

        interaction = x1 * x2
        X_mat = np.column_stack([x1, x2, interaction])

        self.model.fit(X_mat, y)
        self.coef_ = self.model.coef_
        self.intercept_ = float(self.model.intercept_)

        y_pred = self.model.predict(X_mat)
        self.residuals = y - y_pred
        self.residual_std = float(
            np.sqrt(np.sum(self.residuals**2) / max(1, self.n_samples - self.n_params))
        )

        mae = float(mean_absolute_error(y, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y, y_pred)))
        r2 = float(r2_score(y, y_pred))

        X_design = np.column_stack([np.ones_like(x1), X_mat])
        try:
            self.xtx_inv = np.linalg.pinv(X_design.T @ X_design)
        except (np.linalg.LinAlgError, ValueError):
            self.xtx_inv = np.eye(4) * 1e-4

        cv_rmse = self._compute_grouped_cv(X_mat, y, groups)

        metrics = ModelMetrics(
            mae=mae,
            rmse=rmse,
            r_squared=r2,
            cv_rmse=cv_rmse,
            sample_count=self.n_samples,
            residual_mean=float(np.mean(self.residuals)),
            residual_std=self.residual_std,
            shapiro_p_value=None,
        )

        model_hash = hashlib.sha256(
            f"interaction-{self.intercept_:.4f}-{'-'.join(f'{c:.4f}' for c in self.coef_)}".encode()
        ).hexdigest()[:16]

        self.metadata = ModelMetadata(
            model_id=f"resp-inter-{self.feature_names[0]}-{self.feature_names[1]}-{self.target_name}",
            model_type="interaction",
            features=self.feature_names,
            target=self.target_name,
            training_dataset=dataset_name,
            validation_methodology="GroupKFold (grouped by run/stint)" if groups is not None else "KFold",
            training_timestamp=datetime.now(timezone.utc).isoformat(),
            pipeline_version="5.0.0",
            metrics=metrics,
            observed_domain=self.observed_domain,
            model_hash=model_hash,
        )

        self.is_fitted = True
        return metrics

    def _compute_grouped_cv(
        self, X_mat: np.ndarray, y: np.ndarray, groups: np.ndarray | None
    ) -> float:
        if groups is not None and len(np.unique(groups)) >= 2:
            n_splits = min(3, len(np.unique(groups)))
            gkf = GroupKFold(n_splits=n_splits)
            split_gen = gkf.split(X_mat, y, groups)
        else:
            n_splits = min(3, max(2, len(X_mat) // 2))
            kf = KFold(n_splits=n_splits, shuffle=True, random_state=42871)
            split_gen = kf.split(X_mat)

        errors = []
        for train_idx, val_idx in split_gen:
            m = LinearRegression(fit_intercept=True)
            m.fit(X_mat[train_idx], y[train_idx])
            pred = m.predict(X_mat[val_idx])
            errors.extend((y[val_idx] - pred) ** 2)

        return float(np.sqrt(np.mean(errors))) if errors else 0.0

    def predict(self, x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        interaction = x1 * x2
        X_mat = np.column_stack([x1, x2, interaction])
        return self.model.predict(X_mat)

    def predict_point(self, x1_val: float, x2_val: float) -> PredictionWithInterval:
        x_vec = np.array([1.0, float(x1_val), float(x2_val), float(x1_val * x2_val)])
        pred = float(self.model.predict(x_vec[1:].reshape(1, -1))[0])

        dof = max(1, self.n_samples - self.n_params)
        t_crit = float(stats.t.ppf(0.975, df=dof))

        if self.xtx_inv is not None:
            leverage = float(x_vec @ self.xtx_inv @ x_vec.T)
        else:
            leverage = 1.0 / max(1, self.n_samples)

        se_mean = float(self.residual_std * np.sqrt(max(1e-9, leverage)))
        se_pred = float(self.residual_std * np.sqrt(max(1e-9, 1.0 + leverage)))

        return PredictionWithInterval(
            prediction=pred,
            ci_95_lower=pred - t_crit * se_mean,
            ci_95_upper=pred + t_crit * se_mean,
            pi_95_lower=pred - t_crit * se_pred,
            pi_95_upper=pred + t_crit * se_pred,
            standard_error=se_mean,
            prediction_error=se_pred,
        )


class ModelSelector:
    """
    Evaluates candidate models (linear, polynomial, spline) using Grouped CV
    and selects the best out-of-sample model (prioritizing validation RMSE over training R²).
    """

    @classmethod
    def fit_and_select(
        cls,
        x: np.ndarray,
        y: np.ndarray,
        target_name: str,
        feature_name: str,
        groups: np.ndarray | None = None,
        dataset_name: str = "demo-session-monza-2026",
    ) -> tuple[BaseResponseModel, list[ModelMetadata]]:
        candidates: list[BaseResponseModel] = [
            LinearResponseModel(target_name, feature_name),
            PolynomialResponseModel(target_name, feature_name, degree=2),
            SplineResponseModel(target_name, feature_name, k=2),
        ]

        evaluated_meta: list[ModelMetadata] = []
        best_model: BaseResponseModel | None = None
        best_cv_rmse = float("inf")

        for cand in candidates:
            try:
                metrics = cand.fit(x, y, groups=groups, dataset_name=dataset_name)
                if cand.metadata:
                    evaluated_meta.append(cand.metadata)

                # Prioritize out-of-sample validation RMSE
                score = metrics.cv_rmse if metrics.cv_rmse > 1e-6 else metrics.rmse
                if score < best_cv_rmse:
                    best_cv_rmse = score
                    best_model = cand
            except (ValueError, RuntimeError, np.linalg.LinAlgError):
                # Ignore candidates that failed numerical convergence
                continue

        if best_model is None:
            # Fallback to linear
            linear = LinearResponseModel(target_name, feature_name)
            linear.fit(x, y, groups=groups, dataset_name=dataset_name)
            return linear, [linear.metadata] if linear.metadata else []

        return best_model, evaluated_meta
