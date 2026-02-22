"""
Battles - Models
=================
Core data models for the real-time Code Battle System.

Flow:
  1. User A sends a BattleRequest → opponent notified via WS
  2. Opponent accepts → Battle created, problems assigned
  3. Both users join /ws/battles/<id>/ → timer starts
  4. Submissions scored in real-time → winner calculated on timeout
"""

import uuid

from django.db import models
from django.utils import timezone


# ─────────────────────────────────────────────────────────────────────────────
# Battle Request
# ─────────────────────────────────────────────────────────────────────────────

class BattleRequest(models.Model):
    """
    A challenge sent from one user (challenger) to another (opponent).
    Lives until accepted, rejected, cancelled, or expired.
    """

    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        ACCEPTED  = "accepted",  "Accepted"
        REJECTED  = "rejected",  "Rejected"
        CANCELLED = "cancelled", "Cancelled"
        EXPIRED   = "expired",   "Expired"

    class Difficulty(models.TextChoices):
        EASY   = "easy",   "Easy"
        MEDIUM = "medium", "Medium"
        HARD   = "hard",   "Hard"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Who challenged whom
    challenger = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="sent_battle_requests",
    )
    opponent = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="received_battle_requests",
    )

    difficulty = models.CharField(
        max_length=10,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    # Auto-expire after this timestamp (set to now + 5 minutes on creation)
    expires_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "battles_battle_request"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["challenger", "status"]),
            models.Index(fields=["opponent", "status"]),
        ]

    def __str__(self):
        return f"BattleRequest {self.challenger} → {self.opponent} [{self.status}]"

    def is_expired(self):
        """Check whether this request has passed its expiry time."""
        return timezone.now() > self.expires_at

    def save(self, *args, **kwargs):
        # Set expiry to 5 minutes from now on first create
        if not self.pk and not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=5)
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────────────
# Battle (active match)
# ─────────────────────────────────────────────────────────────────────────────

class Battle(models.Model):
    """
    A live coding battle between two users.
    Created when a BattleRequest is accepted.
    """

    class Status(models.TextChoices):
        WAITING   = "waiting",   "Waiting"    # created, waiting both to connect
        ACTIVE    = "active",    "Active"     # both connected, timer running
        COMPLETED = "completed", "Completed"  # time up or all problems solved
        CANCELLED = "cancelled", "Cancelled"  # one user disconnected early

    DURATION_MINUTES = 30  # global battle timer

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Link back to the request that spawned this battle
    battle_request = models.OneToOneField(
        BattleRequest,
        on_delete=models.SET_NULL,
        null=True,
        related_name="battle",
    )

    challenger = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="battles_as_challenger",
    )
    opponent = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="battles_as_opponent",
    )

    # 5 randomly-selected problems at the chosen difficulty
    problems = models.ManyToManyField(
        "problems.Problem",
        related_name="battles",
        blank=True,
    )

    difficulty = models.CharField(
        max_length=10,
        choices=BattleRequest.Difficulty.choices,
        default=BattleRequest.Difficulty.MEDIUM,
        db_index=True,
    )

    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.WAITING,
        db_index=True,
    )

    winner = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="battle_wins",
    )

    # Timestamps
    started_at = models.DateTimeField(null=True, blank=True)  # when both connected
    ends_at    = models.DateTimeField(null=True, blank=True)  # started_at + 30 min
    ended_at   = models.DateTimeField(null=True, blank=True)  # actual end time
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "battles_battle"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["challenger", "status"]),
            models.Index(fields=["opponent", "status"]),
        ]

    def __str__(self):
        return f"Battle {self.id} [{self.status}] {self.challenger} vs {self.opponent}"

    def seconds_remaining(self):
        """Seconds left on the battle clock. Returns 0 if not started or ended."""
        if self.status != self.Status.ACTIVE or not self.ends_at:
            return 0
        delta = (self.ends_at - timezone.now()).total_seconds()
        return max(0, int(delta))


# ─────────────────────────────────────────────────────────────────────────────
# Battle Participant (per-user scoreboard row)
# ─────────────────────────────────────────────────────────────────────────────

class BattleParticipant(models.Model):
    """
    Tracks a single user's live score within a battle.
    One row per user per battle (always 2 rows per battle).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    battle = models.ForeignKey(
        Battle,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="battle_participations",
    )

    score           = models.PositiveIntegerField(default=0)
    problems_solved = models.PositiveSmallIntegerField(default=0)

    # True once the user's WS connection is established
    is_connected = models.BooleanField(default=False)

    joined_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "battles_participant"
        unique_together = [("battle", "user")]

    def __str__(self):
        return f"{self.user.username} in Battle {self.battle_id} | score={self.score}"


# ─────────────────────────────────────────────────────────────────────────────
# Battle Submission
# ─────────────────────────────────────────────────────────────────────────────

class BattleSubmission(models.Model):
    """
    A code submission made during a battle.
    Scoring: first accepted = +10 pts, second = +5 pts, later = +0 pts.
    """

    class Status(models.TextChoices):
        ACCEPTED       = "accepted",        "Accepted"
        WRONG_ANSWER   = "wrong_answer",    "Wrong Answer"
        TIME_LIMIT     = "time_limit",      "Time Limit Exceeded"
        RUNTIME_ERROR  = "runtime_error",   "Runtime Error"
        COMPILE_ERROR  = "compile_error",   "Compile Error"
        PENDING        = "pending",         "Pending"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    battle  = models.ForeignKey(
        Battle,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    user    = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="battle_submissions",
    )
    problem = models.ForeignKey(
        "problems.Problem",
        on_delete=models.CASCADE,
        related_name="battle_submissions",
    )

    code     = models.TextField()
    language = models.CharField(max_length=20)  # python, cpp, java, javascript

    status         = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    points_earned  = models.PositiveSmallIntegerField(default=0)  # 10, 5, or 0
    error_output   = models.TextField(blank=True, default="")

    execution_time_ms = models.PositiveIntegerField(null=True, blank=True)
    memory_used_kb    = models.PositiveIntegerField(null=True, blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "battles_submission"
        ordering = ["submitted_at"]
        indexes = [
            models.Index(fields=["battle", "user", "problem"]),
            models.Index(fields=["battle", "status"]),
        ]

    def __str__(self):
        return f"BattleSub {self.user.username} | {self.problem.title[:30]} | {self.status}"
