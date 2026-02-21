"""
Submissions - Models
=====================
Tracks code submissions, their status, and execution results.
"""

import uuid

from django.db import models


class Submission(models.Model):
    """A user's code submission for a problem."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        ACCEPTED = "accepted", "Accepted"
        WRONG_ANSWER = "wrong_answer", "Wrong Answer"
        TIME_LIMIT = "time_limit", "Time Limit Exceeded"
        MEMORY_LIMIT = "memory_limit", "Memory Limit Exceeded"
        RUNTIME_ERROR = "runtime_error", "Runtime Error"
        COMPILATION_ERROR = "compilation_error", "Compilation Error"
        INTERNAL_ERROR = "internal_error", "Internal Error"

    class Language(models.TextChoices):
        PYTHON = "python", "Python"
        CPP = "cpp", "C++"
        JAVA = "java", "Java"
        JAVASCRIPT = "javascript", "JavaScript"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="submissions", db_index=True,
    )
    problem = models.ForeignKey(
        "problems.Problem", on_delete=models.CASCADE, related_name="submissions",
    )
    contest = models.ForeignKey(
        "contests.Contest", on_delete=models.SET_NULL, null=True, blank=True, related_name="submissions",
    )
    language = models.CharField(max_length=15, choices=Language.choices)
    code = models.TextField(help_text="User's submitted source code.")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True,
    )
    # Execution results
    execution_time_ms = models.PositiveIntegerField(null=True, blank=True)
    memory_used_kb = models.PositiveIntegerField(null=True, blank=True)
    test_cases_passed = models.PositiveIntegerField(default=0)
    total_test_cases = models.PositiveIntegerField(default=0)
    error_output = models.TextField(blank=True, default="")
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    judged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "submissions_submission"
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["user", "problem"], name="idx_sub_user_problem"),
            models.Index(fields=["status", "submitted_at"], name="idx_sub_status_time"),
            models.Index(fields=["contest", "user"], name="idx_sub_contest_user"),
        ]

    def __str__(self):
        return f"Submission {self.id} [{self.status}] by {self.user}"
