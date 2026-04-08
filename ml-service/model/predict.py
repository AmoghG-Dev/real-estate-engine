"""
Prediction Engine
Loads trained model + preprocessor and serves real-time valuations.
"""

import json
import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from .preprocessor import ARTIFACTS_DIR, FEATURE_ORDER, RealEstatePreprocessor

log = logging.getLogger(__name__)

NEIGHBORHOODS = [
    "Downtown", "East_Side", "Historic", "Industrial",
    "Midtown", "Suburbs_North", "Suburbs_South", "West_End",
]


class PredictionEngine:
    _instance: "PredictionEngine | None" = None

    def __init__(self):
        self.model        = None
        self.preprocessor = None
        self.report       = {}
        self._loaded      = False

    # Singleton
    @classmethod
    def get(cls) -> "PredictionEngine":
        if cls._instance is None:
            cls._instance = cls()
            cls._instance._load()
        return cls._instance

    def _load(self):
        model_path = ARTIFACTS_DIR / "model.pkl"
        if not model_path.exists():
            log.info("No trained model found – running training pipeline …")
            from .train import train
            train()

        self.model        = joblib.load(model_path)
        self.preprocessor = RealEstatePreprocessor.load()

        report_path = ARTIFACTS_DIR / "training_report.json"
        if report_path.exists():
            with open(report_path) as f:
                self.report = json.load(f)

        self._loaded = True
        log.info("[✓] Prediction engine ready.")

    # ── Core valuation ─────────────────────────────────────────────────────────
    def predict(self, property_data: dict) -> dict[str, Any]:
        if not self._loaded:
            self._load()

        X         = self.preprocessor.transform(property_data)
        predicted = float(self.model.predict(X)[0])
        predicted = max(predicted, 50_000)

        confidence_interval = self._confidence_interval(predicted)
        feature_impacts     = self._feature_impacts(property_data)
        market_position     = self._market_position(predicted)

        return {
            "estimated_value":    round(predicted),
            "confidence_interval": confidence_interval,
            "feature_impacts":    feature_impacts,
            "market_position":    market_position,
            "model_accuracy":     self.report.get("best_r2"),
        }

    # ── Confidence interval (±8 % heuristic for linear model) ─────────────────
    @staticmethod
    def _confidence_interval(price: float, margin: float = 0.08) -> dict:
        return {
            "low":  round(price * (1 - margin)),
            "high": round(price * (1 + margin)),
        }

    # ── Feature impact breakdown ───────────────────────────────────────────────
    def _feature_impacts(self, data: dict) -> list[dict]:
        importance = self.report.get("feature_importance", {})
        impacts    = []

        mapping = {
            "square_feet":   ("Square Footage",    data.get("square_feet", 0) / 100),
            "bedrooms":      ("Bedrooms",           data.get("bedrooms", 0)),
            "bathrooms":     ("Bathrooms",          data.get("bathrooms", 0)),
            "school_rating": ("School Rating",      data.get("school_rating", 5)),
            "age_years":     ("Property Age",       data.get("age_years", 0)),
            "has_pool":      ("Pool",               data.get("has_pool", 0)),
            "renovated":     ("Renovation Status",  data.get("renovated", 0)),
            "walk_score":    ("Walk Score",         data.get("walk_score", 50) / 10),
        }

        for feat_key, (label, value) in mapping.items():
            coef = importance.get(feat_key, 0)
            if abs(coef) > 0:
                impact = round(coef * value)
                impacts.append({"feature": label, "impact": impact, "coefficient": coef})

        return sorted(impacts, key=lambda x: abs(x["impact"]), reverse=True)[:8]

    # ── Market position ─────────────────────────────────────────────────────────
    @staticmethod
    def _market_position(price: float) -> dict:
        tiers = [
            (200_000,  "Budget",         "Below average market value"),
            (400_000,  "Affordable",     "Below median market value"),
            (600_000,  "Mid-Market",     "Near median market value"),
            (800_000,  "Premium",        "Above median market value"),
            (1_200_000,"Luxury",         "Top-tier market segment"),
            (float("inf"), "Ultra-Luxury", "Elite / ultra-premium segment"),
        ]
        for threshold, tier, desc in tiers:
            if price <= threshold:
                return {"tier": tier, "description": desc, "price": round(price)}
        return {"tier": "Ultra-Luxury", "description": "Elite / ultra-premium segment"}

    # ── Market trends (simulated time-series) ─────────────────────────────────
    @staticmethod
    def market_trends(neighborhood: str | None = None) -> list[dict]:
        import random
        random.seed(42)
        base  = 450_000 if not neighborhood else {
            "Downtown": 900_000, "Historic": 720_000, "Midtown": 640_000,
            "West_End": 560_000, "Suburbs_North": 490_000, "Suburbs_South": 430_000,
            "East_Side": 390_000, "Industrial": 270_000,
        }.get(neighborhood, 450_000)

        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        price  = base
        trend  = []
        for i, m in enumerate(months):
            change = random.uniform(-0.015, 0.028)
            price  = price * (1 + change)
            trend.append({"month": m, "avg_price": round(price),
                           "volume": random.randint(40, 180)})
        return trend

    # ── Comparables ───────────────────────────────────────────────────────────
    @staticmethod
    def comparables(neighborhood: str, price: float) -> list[dict]:
        import random
        random.seed(7)
        comps = []
        for i in range(5):
            offset     = random.uniform(-0.15, 0.15)
            comp_price = round(price * (1 + offset))
            comps.append({
                "address":     f"{random.randint(100,9999)} {random.choice(['Maple','Oak','Pine','Cedar','Elm'])} St",
                "neighborhood": neighborhood,
                "price":       comp_price,
                "sqft":        random.randint(1200, 3500),
                "bedrooms":    random.randint(2, 5),
                "days_on_market": random.randint(7, 90),
            })
        return comps
