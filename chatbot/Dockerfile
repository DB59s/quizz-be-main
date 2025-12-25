# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (minimal)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimizations
# Use pip cache and install only CPU version of PyTorch
RUN pip install --upgrade pip && \
    pip install torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/chromadb data/input

# Expose API port (default 9009, can be overridden by API_PORT env var)
EXPOSE 9009

# Create healthcheck script that uses API_PORT env var
RUN echo '#!/bin/sh\ncurl -f http://localhost:${API_PORT:-9009}/health || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Health check - uses healthcheck script
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD /healthcheck.sh

# Run the API service - uses API_PORT env var from docker-compose
CMD sh -c "python -m uvicorn api_service.main:app --host 0.0.0.0 --port ${API_PORT:-9009}"

