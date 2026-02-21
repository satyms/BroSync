"""
Notifications - Models
=======================
Persistent notification storage for users.
"""

import uuid

from django.db import models


class Notification(models.Model):
    """Stores notifications for users (submission results, contest alerts, etc.)."""

    class NotificationType(models.TextChoices):
        SUBMISSION_RESULT = "submission_result", "Submission Result"
        CONTEST_START = "contest_start", "Contest Started"
        CONTEST_END = "contest_end", "Contest Ended"
        SYSTEM = "system", "System"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications",
    )
    notification_type = models.CharField(
        max_length=20, choices=NotificationType.choices, db_index=True,
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"], name="idx_notif_user_read"),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.user.username}"
