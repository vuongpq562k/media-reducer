FROM python:3.11-slim
 
# Install ffmpeg
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
 
WORKDIR /app
 
# Install Python deps first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
 
# Copy source
COPY . .
 
EXPOSE ${PORT:-8080}
 
# Cloud Run injects $PORT=8080; fallback for local dev
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --timeout-keep-alive 3600"]
 