# ========================================
# BroSync - Python Sandbox
# ========================================
# Minimal, secure Python execution environment.

FROM python:3.12-slim

# Create non-root user for execution
RUN groupadd -r sandbox && useradd -r -g sandbox -u 1000 sandbox

# Remove unnecessary tools
RUN apt-get purge -y --auto-remove && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set working directory
WORKDIR /tmp

# Switch to non-root user
USER sandbox

# Default command (overridden at runtime)
CMD ["python3", "/tmp/solution.py"]
