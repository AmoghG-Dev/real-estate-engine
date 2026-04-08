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
CMD ["sh", "-c", "gunicorn -w 2 -t 120 -b 0.0.0.0:$PORT app:app"]
