#!/bin/bash
# render-start.sh — used as the Render start command for the ML service
# Trains the model on first deploy, then starts gunicorn on Render's dynamic $PORT

set -e

echo "[render-start] Checking for trained model..."
python -c "
from pathlib import Path
p = Path('model/artifacts/model.pkl')
if not p.exists():
    print('[render-start] No model — generating data and training...')
    from data.generate_data import generate_housing_data
    generate_housing_data()
    from model.train import train
    train()
    print('[render-start] Training complete.')
else:
    print('[render-start] Model found, skipping training.')
"

echo "[render-start] Starting gunicorn on port ${PORT:-5001}..."
exec gunicorn app:app \
  --bind "0.0.0.0:${PORT:-5001}" \
  --workers 2 \
  --timeout 120 \
  --log-level info
