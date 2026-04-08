"""
Flask REST API – Real Estate ML Service
Production-ready: dynamic PORT, open CORS, auto-bootstrap for Render.
"""

import logging
import os
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS

from model.predict import NEIGHBORHOODS, PredictionEngine
engine = PredictionEngine.get()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Auth (simple API-key guard) ────────────────────────────────────────────────
ML_API_KEY = os.getenv("ML_API_KEY", "dev-secret-key")

def require_key(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        key = request.headers.get("X-API-Key") or request.args.get("api_key")
        if key != ML_API_KEY:
            return jsonify({"error": "Unauthorised"}), 401
        return fn(*args, **kwargs)
    return wrapper


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "ml-service"})


# ── Predict ────────────────────────────────────────────────────────────────────
@app.post("/predict")
@require_key
def predict():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Empty request body"}), 400

    required = ["neighborhood", "square_feet", "bedrooms", "bathrooms"]
    missing  = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 422

    try:
        result = engine.predict(data)
        return jsonify(result)
    except Exception as exc:
        log.exception("Prediction error")
        return jsonify({"error": str(exc)}), 500


# ── Market trends ──────────────────────────────────────────────────────────────
@app.get("/market/trends")
@require_key
def market_trends():
    neighborhood = request.args.get("neighborhood")
    trends       = engine.market_trends(neighborhood)
    return jsonify({"neighborhood": neighborhood or "All", "trends": trends})


# ── Comparables ────────────────────────────────────────────────────────────────
@app.get("/market/comparables")
@require_key
def comparables():
    neighborhood = request.args.get("neighborhood", "Midtown")
    price        = float(request.args.get("price", 500_000))
    comps        = engine.comparables(neighborhood, price)
    return jsonify({"comparables": comps})


# ── Feature importance ─────────────────────────────────────────────────────────
@app.get("/model/importance")
@require_key
def feature_importance():
    return jsonify({
        "feature_importance": engine.report.get("feature_importance", {}),
        "model_metrics":      engine.report.get("all_results", {}),
        "best_model":         engine.report.get("best_model"),
    })


# ── Neighborhoods ──────────────────────────────────────────────────────────────
@app.get("/neighborhoods")
def neighborhoods():
    return jsonify({"neighborhoods": NEIGHBORHOODS})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    log.info(f"ML service running on :{port}")
    app.run(host="0.0.0.0", port=port)


# def _bootstrap():
#     from pathlib import Path
#     model_path = Path(__file__).parent / "model" / "artifacts" / "model.pkl"
#     if not model_path.exists():
#         log.info("No trained model — bootstrapping...")
#         from data.generate_data import generate_housing_data
#         generate_housing_data()
#         from model.train import train
#         train()

# # Bootstrap runs at import time so gunicorn workers also train on first deploy
# _bootstrap()
