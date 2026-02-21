"""
Contests - Models
==================
Contest management with timer-based contests, participation, and penalty system.
"""

import random
import string
import uuid

from django.db import models
from django.utils import timezone


def _generate_join_code():
    """Generate a random 8-char alphanumeric join code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class Contest(models.Model):
    """A timed coding contest."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        UPCOMING = "upcoming", "Upcoming"
        ACTIVE = "active", "Active"
        ENDED = "ended", "Ended"

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT, db_index=True,
    )
    problems = models.ManyToManyField(
        "problems.Problem", through="ContestProblem", related_name="contests",
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_contests",
    )
    penalty_time_minutes = models.PositiveIntegerField(
        default=20, help_text="Penalty time in minutes for a wrong submission.",
    )
    max_participants = models.PositiveIntegerField(default=0, help_text="0 = unlimited.")
    visibility = models.CharField(
        max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC, db_index=True,
    )
    join_code = models.CharField(
        max_length=12, blank=True, default="",
        help_text="Unique code for joining private contests.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contests_contest"
        ordering = ["-start_time"]
        indexes = [
            models.Index(fields=["status", "start_time"], name="idx_contest_status_start"),
        ]

    def __str__(self):
        return self.title

    def generate_join_code(self):
        """Regenerate a unique join code for this contest."""
        self.join_code = _generate_join_code()
        self.save(update_fields=["join_code"])
        return self.join_code

    @property
    def is_active(self):
        now = timezone.now()
        return self.start_time <= now <= self.end_time

    @property
    def duration_minutes(self):
        return int((self.end_time - self.start_time).total_seconds() / 60)


class ContestProblem(models.Model):
    """Through-model linking problems to contests with ordering and points."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contest = models.ForeignKey(Contest, on_delete=models.CASCADE)
    problem = models.ForeignKey("problems.Problem", on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField(default=0)
    points = models.PositiveIntegerField(default=100)

    class Meta:
        db_table = "contests_contest_problem"
        ordering = ["order"]
        unique_together = ("contest", "problem")

    def __str__(self):
        return f"{self.contest.title} - Q{self.order}"


class ContestParticipation(models.Model):
    """Tracks a user's participation in a contest."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contest = models.ForeignKey(
        Contest, on_delete=models.CASCADE, related_name="participations",
    )
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="contest_participations",
    )
    score = models.IntegerField(default=0)
    penalty = models.IntegerField(default=0, help_text="Total penalty time in minutes.")
    problems_solved = models.PositiveIntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "contests_participation"
        unique_together = ("contest", "user")
        ordering = ["-score", "penalty"]
        indexes = [
            models.Index(fields=["contest", "-score", "penalty"], name="idx_participation_rank"),
        ]

    def __str__(self):
        return f"{self.user.username} in {self.contest.title}"
