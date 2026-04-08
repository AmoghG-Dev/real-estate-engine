"""
Data Preprocessor
Handles cleaning, encoding, scaling, and outlier removal for training & inference.
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer

CATEGORICAL_COLS = ["neighborhood"]
NUMERIC_COLS = [
    "square_feet", "bedrooms", "bathrooms", "age_years",
    "garage_spaces", "lot_size", "floors", "school_rating",
    "crime_index", "walk_score",
]
BINARY_COLS = ["has_pool", "has_fireplace", "has_basement", "renovated"]

FEATURE_ORDER = NUMERIC_COLS + BINARY_COLS + [f"neighborhood_{n}" for n in [
    "Downtown", "East_Side", "Historic", "Industrial",
    "Midtown", "Suburbs_North", "Suburbs_South", "West_End",
]]

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)


class RealEstatePreprocessor:
    def __init__(self):
        self.scaler       = StandardScaler()
        self.imputer      = SimpleImputer(strategy="median")
        self.label_encoders: dict[str, LabelEncoder] = {}
        self.fitted       = False

    # ── Outlier removal (IQR) ──────────────────────────────────────────────────
    @staticmethod
    def remove_outliers(df: pd.DataFrame, col: str, k: float = 3.0) -> pd.DataFrame:
        q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        iqr     = q3 - q1
        return df[(df[col] >= q1 - k * iqr) & (df[col] <= q3 + k * iqr)]

    # ── Fit + transform (training) ─────────────────────────────────────────────
    def fit_transform(self, df: pd.DataFrame):
        df = df.copy()

        # Outlier removal on target
        df = self.remove_outliers(df, "price")
        y  = df["price"].values

        # One-hot encode neighborhoods
        df = pd.get_dummies(df, columns=CATEGORICAL_COLS, prefix=CATEGORICAL_COLS)

        # Ensure all expected columns exist (fill missing dummies with 0)
        for col in FEATURE_ORDER:
            if col not in df.columns:
                df[col] = 0
        df = df[FEATURE_ORDER]

        # Impute then scale numeric features only
        numeric_idx   = list(range(len(NUMERIC_COLS)))
        df_array      = df.values.astype(float)
        df_array[:, numeric_idx] = self.imputer.fit_transform(df_array[:, numeric_idx])
        df_array[:, numeric_idx] = self.scaler.fit_transform(df_array[:, numeric_idx])

        self.fitted = True
        self._save()
        return df_array, y

    # ── Transform only (inference) ─────────────────────────────────────────────
    def transform(self, record: dict) -> np.ndarray:
        """Accept a raw property dict and return a scaled feature vector."""
        row = {col: 0 for col in FEATURE_ORDER}

        # Numeric + binary
        for col in NUMERIC_COLS + BINARY_COLS:
            if col in record:
                row[col] = float(record[col])

        # Neighborhood one-hot
        nb_key = f"neighborhood_{record.get('neighborhood', '')}"
        if nb_key in row:
            row[nb_key] = 1.0

        arr = np.array([[row[c] for c in FEATURE_ORDER]], dtype=float)
        numeric_idx = list(range(len(NUMERIC_COLS)))
        arr[:, numeric_idx] = self.scaler.transform(arr[:, numeric_idx])
        return arr

    # ── Persistence ────────────────────────────────────────────────────────────
    def _save(self):
        joblib.dump(self.scaler,  ARTIFACTS_DIR / "scaler.pkl")
        joblib.dump(self.imputer, ARTIFACTS_DIR / "imputer.pkl")

    @classmethod
    def load(cls) -> "RealEstatePreprocessor":
        obj         = cls()
        obj.scaler  = joblib.load(ARTIFACTS_DIR / "scaler.pkl")
        obj.imputer = joblib.load(ARTIFACTS_DIR / "imputer.pkl")
        obj.fitted  = True
        return obj
