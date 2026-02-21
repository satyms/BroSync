"""
BroSync - WSGI Configuration
=============================
Standard WSGI config for traditional HTTP requests (used by Gunicorn).
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

application = get_wsgi_application()
