"""
BroSync - Config Package Init
===============================
Ensures Celery app is loaded when Django starts.
"""

from celery_app import app as celery_app

__all__ = ("celery_app",)
