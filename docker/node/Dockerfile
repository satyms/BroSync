# ========================================
# BroSync - Node.js Sandbox
# ========================================
# Minimal Node.js execution environment.

FROM node:20-slim

# Create non-root user
RUN groupadd -r sandbox && useradd -r -g sandbox -u 1000 sandbox

# Remove unnecessary tools
RUN apt-get purge -y --auto-remove && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /tmp

USER sandbox

CMD ["node", "/tmp/solution.js"]
