"""
Accounts App Configuration
===========================
"""

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuration for the accounts (auth/users) app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    verbose_name = "Accounts & Authentication"

    def ready(self):
        """Import signal handlers when the app is ready."""
        import apps.accounts.signals  # noqa: F401
