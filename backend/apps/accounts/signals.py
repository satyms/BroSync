"""
Accounts - Signals
===================
Signal handlers for user-related events.
"""

import logging

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger("apps")
User = get_user_model()


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """
    Post-save signal for User model.
    Logs new user creation. Can be extended for welcome emails, etc.
    """
    if created:
        logger.info(
            "New user created: username=%s, role=%s",
            instance.username,
            instance.role,
        )
