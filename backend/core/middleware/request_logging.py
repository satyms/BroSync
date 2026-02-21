"""
Request Logging Middleware
==========================
Logs all incoming HTTP requests with timing and response status.
Sensitive data (passwords, tokens) is automatically filtered.
"""

import logging
import time

logger = logging.getLogger("core")


class RequestLoggingMiddleware:
    """Middleware to log HTTP requests with execution time."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Record start time
        start_time = time.monotonic()

        # Process the request
        response = self.get_response(request)

        # Calculate duration
        duration_ms = (time.monotonic() - start_time) * 1000

        # Log the request (excluding sensitive paths)
        if not self._is_sensitive_path(request.path):
            logger.info(
                "HTTP %s %s → %d (%.1fms) [user=%s]",
                request.method,
                request.path,
                response.status_code,
                duration_ms,
                getattr(request.user, "username", "anonymous"),
            )

        return response

    @staticmethod
    def _is_sensitive_path(path: str) -> bool:
        """Check if the path contains sensitive endpoints (avoid logging bodies)."""
        sensitive_segments = ["/auth/login", "/auth/register", "/auth/token"]
        return any(segment in path for segment in sensitive_segments)
