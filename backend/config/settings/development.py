"""
BroSync - Development Settings
==============================
Settings for local development. NEVER use in production.
"""

from .base import *  # noqa: F401,F403

# ========================================
# DEBUG MODE
# ========================================

DEBUG = True

# ========================================
# ALLOWED HOSTS
# ========================================

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# ========================================
# DATABASE (can use SQLite for quick dev)
# ========================================

# Using SQLite for local development (no PostgreSQL needed)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ========================================
# EMAIL BACKEND (Console for dev)
# ========================================

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ========================================
# CORS (Allow all in dev)
# ========================================

CORS_ALLOW_ALL_ORIGINS = True

# ========================================
# SECURITY (Relaxed for dev)
# ========================================

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# ========================================
# CACHES (Local memory for dev)
# ========================================

# In-memory cache (no Redis needed for local dev)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# In-memory Channel Layers (no Redis needed for local dev)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# ========================================
# REST FRAMEWORK (Add browsable API)
# ========================================

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)

# Relaxed throttling for dev
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "anon": "1000/minute",
    "user": "5000/minute",
    "submission": "100/minute",
}

# ========================================
# LOGGING (More verbose in dev)
# ========================================

LOGGING["loggers"]["apps"]["level"] = "DEBUG"  # noqa: F405
LOGGING["loggers"]["django"]["level"] = "WARNING"  # noqa: F405

# ========================================
# SANDBOX (Local subprocess instead of Docker)
# ========================================

SANDBOX_BACKEND = "local"

# ========================================
# CELERY (Eager execution for dev - no worker needed)
# ========================================

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
