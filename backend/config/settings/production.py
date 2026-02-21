"""
BroSync - Production Settings
==============================
Hardened settings for production deployment.
"""

from .base import *  # noqa: F401,F403

# ========================================
# DEBUG (Must be False)
# ========================================

DEBUG = False

# ========================================
# SECURITY
# ========================================

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

# Signed cookies
SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"

# ========================================
# CORS (Strict in production)
# ========================================

CORS_ALLOW_ALL_ORIGINS = False

# ========================================
# DATABASE CONNECTION POOLING
# ========================================

DATABASES["default"]["CONN_MAX_AGE"] = 600  # noqa: F405
DATABASES["default"]["OPTIONS"]["sslmode"] = "require"  # noqa: F405

# ========================================
# STATIC FILES
# ========================================

STATICFILES_STORAGE = "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"

# ========================================
# LOGGING (Production level)
# ========================================

LOGGING["loggers"]["django"]["level"] = "WARNING"  # noqa: F405
LOGGING["loggers"]["apps"]["level"] = "INFO"  # noqa: F405
LOGGING["loggers"]["core"]["level"] = "INFO"  # noqa: F405

# ========================================
# EMAIL (Real SMTP)
# ========================================

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

# ========================================
# CACHES (Longer TTL in production)
# ========================================

CACHES["default"]["TIMEOUT"] = 600  # noqa: F405
