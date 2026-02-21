# ========================================
# BroSync - Backend Dockerfile
# ========================================
# Multi-stage Django application container.

FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Create non-root user for running the app
RUN groupadd -r django && useradd -r -g django django && \
    chown -R django:django /app

USER django

# Expose port
EXPOSE 8000

# Default command (overridden in docker-compose)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
