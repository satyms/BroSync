# ========================================
# BroSync - C++ Sandbox
# ========================================
# Minimal C++ compilation and execution environment.

FROM gcc:13-bookworm

# Create non-root user
RUN groupadd -r sandbox && useradd -r -g sandbox -u 1000 sandbox

# Remove unnecessary tools
RUN apt-get purge -y --auto-remove && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /tmp

USER sandbox

CMD ["sh", "-c", "g++ -o /tmp/solution /tmp/solution.cpp && /tmp/solution"]
