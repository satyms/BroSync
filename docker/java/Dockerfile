# ========================================
# BroSync - Java Sandbox
# ========================================
# Minimal Java compilation and execution environment.

FROM eclipse-temurin:21-jdk-jammy

# Create non-root user
RUN groupadd -r sandbox && useradd -r -g sandbox -u 1000 sandbox

# Remove unnecessary tools
RUN apt-get purge -y --auto-remove && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /tmp

USER sandbox

CMD ["sh", "-c", "javac /tmp/Solution.java && java -cp /tmp Solution"]
