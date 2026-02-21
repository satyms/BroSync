"""
Leaderboard - Models
=====================
Persistent leaderboard entries synced from Redis.
"""

import uuid

from django.db import models


class LeaderboardEntry(models.Model):
    """Persistent snapshot of a user's score on a contest leaderboard."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contest = models.ForeignKey(
        "contests.Contest", on_delete=models.CASCADE, related_name="leaderboard_entries",
    )
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="leaderboard_entries",
    )
    rank = models.PositiveIntegerField(default=0, db_index=True)
    score = models.IntegerField(default=0)
    penalty = models.IntegerField(default=0)
    problems_solved = models.PositiveIntegerField(default=0)
    last_accepted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "leaderboard_entry"
        unique_together = ("contest", "user")
        ordering = ["rank"]
        indexes = [
            models.Index(fields=["contest", "rank"], name="idx_lb_contest_rank"),
        ]

    def __str__(self):
        return f"#{self.rank} {self.user.username} ({self.score} pts)"
