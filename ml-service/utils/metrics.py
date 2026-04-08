"""
Reusable metrics utilities – called by train.py and exposed via the API.
"""

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def regression_report(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Return a concise regression metrics dictionary."""
    mae  = mean_absolute_error(y_true, y_pred)
    mse  = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2   = r2_score(y_true, y_pred)
    mape = float(np.mean(np.abs((y_true - y_pred) / np.where(y_true != 0, y_true, 1))) * 100)

    return {
        "mae":      round(float(mae),  2),
        "mse":      round(float(mse),  2),
        "rmse":     round(float(rmse), 2),
        "r2":       round(float(r2),   6),
        "mape_pct": round(mape,        4),
    }


def explained_variance(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Explained variance score (complement to R²)."""
    residual_var  = np.var(y_true - y_pred)
    total_var     = np.var(y_true)
    return float(1 - residual_var / total_var) if total_var != 0 else 0.0


def price_accuracy_within(
    y_true: np.ndarray, y_pred: np.ndarray, threshold_pct: float = 10.0
) -> float:
    """% of predictions within `threshold_pct` % of the true value."""
    pct_errors = np.abs((y_true - y_pred) / y_true) * 100
    return float(np.mean(pct_errors <= threshold_pct) * 100)
