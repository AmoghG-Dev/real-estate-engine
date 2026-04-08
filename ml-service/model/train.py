"""
Model Training Pipeline
Trains Linear Regression + Ridge baseline, saves best model + metrics.
"""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split

from .preprocessor import ARTIFACTS_DIR, FEATURE_ORDER, RealEstatePreprocessor

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

DATA_PATH = Path(__file__).parent.parent / "data" / "housing_data.csv"


# ── Metrics helper ─────────────────────────────────────────────────────────────
def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    return {
        "mae":       round(float(mae),  2),
        "rmse":      round(float(rmse), 2),
        "r2":        round(float(r2),   4),
        "mape":      round(float(mape), 2),
    }


# ── Main training routine ──────────────────────────────────────────────────────
def train():
    log.info("Loading dataset …")
    if not DATA_PATH.exists():
        log.info("Dataset not found – generating synthetic data …")
        from ..data.generate_data import generate_housing_data
        generate_housing_data()

    df = pd.read_csv(DATA_PATH)
    log.info(f"Dataset shape: {df.shape}")

    # Preprocess
    preprocessor = RealEstatePreprocessor()
    X, y         = preprocessor.fit_transform(df)
    log.info(f"Feature matrix: {X.shape}")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    # ── Models ────────────────────────────────────────────────────────────────
    models = {
        "LinearRegression": LinearRegression(),
        "Ridge_alpha10":    Ridge(alpha=10),
        "Ridge_alpha100":   Ridge(alpha=100),
    }

    results = {}
    best_r2, best_name, best_model = -np.inf, None, None

    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred  = model.predict(X_test)
        metrics = compute_metrics(y_test, y_pred)

        # 5-fold CV
        cv_scores = cross_val_score(model, X, y, cv=KFold(5, shuffle=True,
                                    random_state=42), scoring="r2")
        metrics["cv_r2_mean"] = round(float(cv_scores.mean()), 4)
        metrics["cv_r2_std"]  = round(float(cv_scores.std()),  4)
        results[name] = metrics
        log.info(f"{name:25s}  R²={metrics['r2']:.4f}  MAE=${metrics['mae']:,.0f}")

        if metrics["r2"] > best_r2:
            best_r2, best_name, best_model = metrics["r2"], name, model

    log.info(f"\nBest model: {best_name}  R²={best_r2:.4f}")

    # ── Feature importance (coefficients) ─────────────────────────────────────
    coefs = best_model.coef_
    importance = {feat: round(float(c), 4) for feat, c in zip(FEATURE_ORDER, coefs)}
    importance_sorted = dict(
        sorted(importance.items(), key=lambda x: abs(x[1]), reverse=True)
    )

    # ── Persist ───────────────────────────────────────────────────────────────
    joblib.dump(best_model, ARTIFACTS_DIR / "model.pkl")

    report = {
        "best_model":         best_name,
        "best_r2":            best_r2,
        "all_results":        results,
        "feature_importance": importance_sorted,
        "train_samples":      int(X_train.shape[0]),
        "test_samples":       int(X_test.shape[0]),
        "n_features":         int(X.shape[1]),
    }
    with open(ARTIFACTS_DIR / "training_report.json", "w") as f:
        json.dump(report, f, indent=2)

    log.info(f"[✓] Artifacts saved to {ARTIFACTS_DIR}")
    return report


if __name__ == "__main__":
    train()
