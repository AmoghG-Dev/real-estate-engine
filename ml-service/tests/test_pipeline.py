"""
Tests for the ML pipeline – run with:  pytest ml-service/tests/ -v
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd
import pytest

from data.generate_data import generate_housing_data
from model.preprocessor import RealEstatePreprocessor, FEATURE_ORDER
from utils.validation   import validate_property, VALID_NEIGHBORHOODS
from utils.metrics      import regression_report, price_accuracy_within


# ── Data generation ────────────────────────────────────────────────────────────
class TestDataGeneration:
    def test_generates_correct_number_of_rows(self):
        df = generate_housing_data(n_samples=200, random_seed=1)
        assert len(df) == 200

    def test_required_columns_present(self):
        df = generate_housing_data(n_samples=100, random_seed=2)
        required = ["neighborhood", "square_feet", "bedrooms", "bathrooms", "price"]
        for col in required:
            assert col in df.columns, f"Missing column: {col}"

    def test_price_is_positive(self):
        df = generate_housing_data(n_samples=200, random_seed=3)
        assert (df["price"] > 0).all()

    def test_neighborhood_values_valid(self):
        df = generate_housing_data(n_samples=300, random_seed=4)
        assert set(df["neighborhood"].unique()).issubset(set(VALID_NEIGHBORHOODS))


# ── Preprocessor ──────────────────────────────────────────────────────────────
class TestPreprocessor:
    @pytest.fixture(scope="class")
    def fitted_preprocessor_and_data(self):
        df   = generate_housing_data(n_samples=500, random_seed=42)
        prep = RealEstatePreprocessor()
        X, y = prep.fit_transform(df)
        return prep, X, y

    def test_feature_count(self, fitted_preprocessor_and_data):
        _, X, _ = fitted_preprocessor_and_data
        assert X.shape[1] == len(FEATURE_ORDER)

    def test_no_nan_after_fit(self, fitted_preprocessor_and_data):
        _, X, _ = fitted_preprocessor_and_data
        assert not np.isnan(X).any()

    def test_transform_single_record(self, fitted_preprocessor_and_data):
        prep, _, _ = fitted_preprocessor_and_data
        record = {
            "neighborhood": "Downtown", "square_feet": 2000,
            "bedrooms": 3, "bathrooms": 2, "age_years": 5,
            "garage_spaces": 1, "lot_size": 8000, "floors": 2,
            "has_pool": 1, "has_fireplace": 0, "has_basement": 1, "renovated": 1,
            "school_rating": 8, "crime_index": 3, "walk_score": 75,
        }
        vec = prep.transform(record)
        assert vec.shape == (1, len(FEATURE_ORDER))
        assert not np.isnan(vec).any()


# ── Validation ────────────────────────────────────────────────────────────────
class TestValidation:
    def test_valid_payload_passes(self):
        errors = validate_property({
            "neighborhood": "Midtown", "square_feet": 1800,
            "bedrooms": 3, "bathrooms": 2,
        })
        assert errors == []

    def test_missing_required_field(self):
        errors = validate_property({"neighborhood": "Midtown", "square_feet": 1800})
        assert any("bedrooms" in e for e in errors)

    def test_invalid_neighborhood(self):
        errors = validate_property({
            "neighborhood": "Mars", "square_feet": 1800,
            "bedrooms": 3, "bathrooms": 2,
        })
        assert any("neighborhood" in e for e in errors)

    def test_out_of_range_value(self):
        errors = validate_property({
            "neighborhood": "Midtown", "square_feet": 999999,
            "bedrooms": 3, "bathrooms": 2,
        })
        assert any("square_feet" in e for e in errors)


# ── Metrics ───────────────────────────────────────────────────────────────────
class TestMetrics:
    def test_perfect_prediction(self):
        y = np.array([100_000, 200_000, 300_000])
        m = regression_report(y, y)
        assert m["mae"]  == 0.0
        assert m["rmse"] == 0.0
        assert m["r2"]   == 1.0

    def test_mape_calculation(self):
        y_true = np.array([100_000, 200_000])
        y_pred = np.array([110_000, 180_000])
        m = regression_report(y_true, y_pred)
        assert m["mape_pct"] > 0

    def test_accuracy_within_threshold(self):
        y_true = np.array([100_000.0, 200_000.0, 300_000.0])
        y_pred = np.array([105_000.0, 198_000.0, 315_000.0])
        acc = price_accuracy_within(y_true, y_pred, threshold_pct=10.0)
        assert 0 <= acc <= 100
