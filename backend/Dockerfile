FROM python:3.10-slim

WORKDIR /workspace

# Install OS libraries required for OpenCV and system compile
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port
EXPOSE 8000

# Pre-train ML models on startup (or reload)
RUN python app/train_models.py

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
