"""
Problems - Models
==================
Problem definitions with categories, difficulty levels, and test cases.
"""

import uuid

from django.db import models


class Category(models.Model):
    """Category for organizing problems (e.g., Arrays, DP, Graphs)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "problems_category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Problem(models.Model):
    """A coding problem with description, constraints, and test cases."""

    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(help_text="Problem statement (supports HTML).")
    input_format = models.TextField(blank=True, default="")
    output_format = models.TextField(blank=True, default="")
    constraints = models.TextField(blank=True, default="")
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.EASY, db_index=True,
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="problems",
    )
    time_limit_ms = models.PositiveIntegerField(default=2000, help_text="Time limit in milliseconds.")
    memory_limit_mb = models.PositiveIntegerField(default=256, help_text="Memory limit in MB.")
    is_published = models.BooleanField(default=False, db_index=True)
    total_submissions = models.PositiveIntegerField(default=0)
    accepted_submissions = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_problems",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "problems_problem"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["difficulty", "is_published"], name="idx_problem_diff_pub"),
            models.Index(fields=["slug"], name="idx_problem_slug"),
        ]

    def __str__(self):
        return f"[{self.difficulty}] {self.title}"

    @property
    def acceptance_rate(self):
        if self.total_submissions == 0:
            return 0.0
        return round((self.accepted_submissions / self.total_submissions) * 100, 2)


class TestCase(models.Model):
    """Input/output test case for a problem."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name="test_cases")
    input_data = models.TextField(help_text="Input for the test case.")
    expected_output = models.TextField(help_text="Expected output.")
    is_sample = models.BooleanField(default=False, help_text="Visible to users as a sample.")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "problems_testcase"
        ordering = ["order"]

    def __str__(self):
        return f"TestCase #{self.order} for {self.problem.title}"
