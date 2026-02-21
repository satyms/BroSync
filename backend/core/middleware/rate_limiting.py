"""
Rate Limiting Middleware
========================
Global rate limiter for API abuse prevention.
Uses Django's cache framework (backed by Redis) for distributed counting.
"""

import logging
import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger("core")

# Paths that get stricter rate limiting
STRICT_RATE_PATHS = ["/api/v1/submissions/", "/api/v1/contests/"]


class RateLimitMiddleware:
    """
    Simple sliding-window rate limiter middleware.
    Falls back gracefully if Redis is unavailable.
    """

    # Default: 120 requests per minute
    DEFAULT_RATE = 120
    DEFAULT_WINDOW = 60  # seconds

    # Strict: 10 requests per minute (for submissions)
    STRICT_RATE = 10
    STRICT_WINDOW = 60

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only rate-limit POST/PUT/PATCH/DELETE
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return self.get_response(request)

        client_key = self._get_client_key(request)
        is_strict = self._is_strict_path(request.path)
        rate = self.STRICT_RATE if is_strict else self.DEFAULT_RATE
        window = self.STRICT_WINDOW if is_strict else self.DEFAULT_WINDOW

        try:
            if self._is_rate_limited(client_key, rate, window):
                logger.warning(
                    "Rate limit exceeded for %s on %s", client_key, request.path
                )
                return JsonResponse(
                    {
                        "success": False,
                        "error": {
                            "code": "RATE_LIMITED",
                            "message": "Too many requests. Please slow down.",
                        },
                    },
                    status=429,
                )
        except Exception:
            # If cache is down, allow the request through
            logger.warning("Rate limit cache unavailable — allowing request.")

        return self.get_response(request)

    @staticmethod
    def _get_client_key(request) -> str:
        """Build a cache key from user ID or IP address."""
        if hasattr(request, "user") and request.user.is_authenticated:
            return f"ratelimit:user:{request.user.id}"
        # Fallback to IP
        ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
        if not ip:
            ip = request.META.get("REMOTE_ADDR", "unknown")
        return f"ratelimit:ip:{ip}"

    @staticmethod
    def _is_strict_path(path: str) -> bool:
        """Check if the path needs stricter rate limiting."""
        return any(path.startswith(p) for p in STRICT_RATE_PATHS)

    @staticmethod
    def _is_rate_limited(key: str, rate: int, window: int) -> bool:
        """Sliding window counter using Redis INCR + EXPIRE."""
        current_window = int(time.time() // window)
        cache_key = f"{key}:{current_window}"
        count = cache.get(cache_key, 0)

        if count >= rate:
            return True

        # Increment counter
        new_count = cache.incr(cache_key)
        if new_count == 1:
            cache.expire(cache_key, window)
        return False
