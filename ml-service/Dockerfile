# ml-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-train the model at build time so the container starts fast
RUN python -c "from data.generate_data import generate_housing_data; generate_housing_data()" && \
    python -c "from model.train import train; train()"

EXPOSE 5001
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "120"]
