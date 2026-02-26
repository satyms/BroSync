"""Proctor App Configuration."""
from django.apps import AppConfig


class ProctorConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.proctor"
    verbose_name = "Proctoring"
