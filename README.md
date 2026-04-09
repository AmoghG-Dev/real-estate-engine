# 🏡 EstateIQ — Real Estate Valuation Engine & Market Predictor

A full-stack predictive analytics platform that forecasts property market values using
machine learning. Built with Python / Scikit-learn on the backend, a Node.js API gateway,
and a React.js frontend.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│         (Property Form · Valuation Results · Market Charts)     │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP / REST  (port 3000 → 4000)
┌────────────────────────────▼────────────────────────────────────┐
│                    Node.js API Gateway                          │
│          Express · Rate-limiting · Validation · Logging         │
└────────────────────────────┬────────────────────────────────────┘
                             │  Internal HTTP  (port 4000 → 5001)
┌────────────────────────────▼────────────────────────────────────┐
│                    Python ML Service                            │
│    Flask · Scikit-learn · Pandas · Linear Regression Model      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
real-estate-engine/
│
├── ml-service/                     # Python ML microservice
│   ├── app.py                      # Flask REST API (port 5001)
│   ├── requirements.txt
│   ├── Dockerfile
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   └── generate_data.py        # Synthetic housing dataset generator
│   │
│   ├── model/
│   │   ├── __init__.py
│   │   ├── preprocessor.py         # Cleaning · encoding · scaling
│   │   ├── train.py                # Model training pipeline + CV
│   │   ├── predict.py              # PredictionEngine (singleton)
│   │   └── artifacts/              # ← saved after training (git-ignored)
│   │       ├── model.pkl
│   │       ├── scaler.pkl
│   │       ├── imputer.pkl
│   │       └── training_report.json
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validation.py           # Input validation helpers
│   │   └── metrics.py              # MAE · RMSE · R² · MAPE helpers
│   │
│   └── tests/
│       ├── __init__.py
│       └── test_pipeline.py        # pytest unit tests
│
├── server/                         # Node.js API Gateway
│   ├── index.js                    # Express app entry point (port 4000)
│   ├── package.json
│   ├── Dockerfile
│   │
│   ├── config/
│   │   └── index.js                # Centralised config / env vars
│   │
│   ├── middleware/
│   │   ├── logger.js               # Winston logger
│   │   └── errorHandler.js         # 404 + global error handler
│   │
│   ├── routes/
│   │   ├── valuation.js            # POST /api/valuation, GET /neighborhoods
│   │   └── market.js               # GET /api/market/trends|comparables|importance
│   │
│   ├── controllers/
│   │   ├── valuationController.js  # Proxies predict requests to ML service
│   │   └── marketController.js     # Proxies market data requests
│   │
│   └── __tests__/
│       └── valuation.test.js       # Jest + Supertest API tests
│
├── frontend/                       # React.js SPA
│   ├── package.json
│   ├── Dockerfile                  # Multi-stage: build → nginx
│   ├── nginx.conf
│   │
│   ├── public/
│   │   └── index.html
│   │
│   └── src/
│       ├── index.js                # ReactDOM entry point
│       ├── App.jsx                 # Root component (tabs · layout)
│       │
│       ├── components/
│       │   ├── PropertyForm.jsx         # Slider/toggle form
│       │   ├── PropertyForm.module.css
│       │   ├── ValuationResult.jsx      # Hero price + feature impact bars
│       │   ├── ValuationResult.module.css
│       │   ├── MarketChart.jsx          # Vanilla-SVG price trend chart
│       │   ├── MarketChart.module.css
│       │   ├── ComparablesList.jsx      # Comparable sales table
│       │   └── ComparablesList.module.css
│       │
│       ├── hooks/
│       │   ├── useValuation.js     # Form state + submit logic
│       │   └── useMarket.js        # Market data fetching
│       │
│       ├── services/
│       │   └── api.js              # Typed fetch wrappers for all endpoints
│       │
│       └── styles/
│           ├── global.css          # CSS variables · fonts · reset
│           └── App.module.css      # Root layout · sidebar · tabs
│
├── docker-compose.yml              # Orchestrates all three services
├── .env.example                    # Environment variable template
└── .gitignore
```

---

## Machine Learning Pipeline

### 1. Data Generation (`data/generate_data.py`)
- Generates 5,000 synthetic property records with realistic price distributions
- 8 neighbourhood tiers (Downtown → Industrial) each with a calibrated base price
- 15 features: square footage, bedrooms, bathrooms, age, garage, lot size, amenities, school rating, crime index, walk score
- Gaussian noise (±7%) applied to prices for realism

### 2. Preprocessing (`model/preprocessor.py`)
| Step | Technique |
|------|-----------|
| Outlier removal | IQR method (k = 3.0) on target price |
| Missing values | Median imputation via `SimpleImputer` |
| Categorical encoding | One-hot encoding for neighbourhood |
| Feature scaling | `StandardScaler` on numeric columns only |

### 3. Model Training (`model/train.py`)
- Three candidate models: `LinearRegression`, `Ridge(α=10)`, `Ridge(α=100)`
- 5-Fold Cross-Validation for robust evaluation
- Best model selected by R² on held-out test set (80/20 split)
- All metrics, feature coefficients, and artefacts persisted to `model/artifacts/`

### 4. Prediction (`model/predict.py`)
- Singleton `PredictionEngine` — loaded once at startup
- Returns: estimated value, ±8 % confidence interval, top-8 feature impacts, market tier, comparable sales

---

## API Reference

### ML Service (Flask — port 5001)
All routes require `X-API-Key` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Health check |
| `POST` | `/predict` | Run valuation model |
| `GET`  | `/market/trends?neighborhood=` | 12-month price trend |
| `GET`  | `/market/comparables?neighborhood=&price=` | Comparable sales |
| `GET`  | `/model/importance` | Feature importance + metrics |
| `GET`  | `/neighborhoods` | Valid neighbourhood list |

### API Gateway (Node.js — port 4000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Gateway health |
| `POST` | `/api/valuation` | Validated valuation request |
| `GET`  | `/api/valuation/neighborhoods` | Neighbourhood list |
| `GET`  | `/api/market/trends` | Market trends |
| `GET`  | `/api/market/comparables` | Comparable sales |
| `GET`  | `/api/market/feature-importance` | Model explainability |

### Valuation Request Body
```json
{
  "neighborhood":  "Midtown",
  "square_feet":   1800,
  "bedrooms":      3,
  "bathrooms":     2,
  "age_years":     10,
  "garage_spaces": 1,
  "lot_size":      7500,
  "floors":        1,
  "has_pool":      0,
  "has_fireplace": 0,
  "has_basement":  1,
  "renovated":     0,
  "school_rating": 7.0,
  "crime_index":   4.0,
  "walk_score":    65
}
```

### Valuation Response
```json
{
  "success": true,
  "requestId": "a1b2c3d4-...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "input": { "...": "..." },
  "result": {
    "estimated_value": 542000,
    "confidence_interval": { "low": 498640, "high": 585360 },
    "feature_impacts": [
      { "feature": "Square Footage", "impact": 332400, "coefficient": 185.2 },
      { "feature": "School Rating",  "impact": 66500,  "coefficient": 9500 }
    ],
    "market_position": {
      "tier": "Mid-Market",
      "description": "Near median market value",
      "price": 542000
    },
    "model_accuracy": 0.9312
  }
}
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker + Docker Compose (optional)

### Option A — Docker Compose (recommended)
```bash
git clone <repo-url>
cd real-estate-engine
cp .env.example .env
docker-compose up --build
```
- Frontend → http://localhost:3000
- API Gateway → http://localhost:4000
- ML Service → http://localhost:5001

### Option B — Manual Dev Setup

**ML Service**
```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -c "from data.generate_data import generate_housing_data; generate_housing_data()"
python -c "from model.train import train; train()"
python app.py
```

**API Gateway**
```bash
cd server
npm install
node index.js
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

---

## Testing

**Python (pytest)**
```bash
cd ml-service
pytest tests/ -v --tb=short
```

**Node.js (Jest)**
```bash
cd server
npm test
```

---

## Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| ML    | Python 3.11, Scikit-learn 1.5 | Model training & inference |
| ML    | Pandas 2.2, NumPy 1.26 | Data preprocessing |
| ML    | Flask 3.0, Gunicorn | REST API for ML model |
| API   | Node.js 20, Express 4 | API Gateway & routing |
| API   | express-validator, helmet, morgan | Validation, security, logging |
| UI    | React 18, CSS Modules | Component-based SPA |
| Infra | Docker, Docker Compose, Nginx | Containerisation & serving |

Live on :- https://frontend-service-black.vercel.app/
