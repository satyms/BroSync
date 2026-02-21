"""
Problems - Service Layer
=========================
Business logic for problem management.
"""

import logging

from django.db.models import Q
from django.utils.text import slugify

from .models import Category, Problem, TestCase

logger = logging.getLogger("apps")


class ProblemService:
    """Business logic for problem CRUD operations."""

    @staticmethod
    def list_published(filters: dict = None):
        """Return published problems with optional filtering."""
        qs = Problem.objects.filter(is_published=True).select_related("category")

        if not filters:
            return qs

        if difficulty := filters.get("difficulty"):
            qs = qs.filter(difficulty=difficulty)

        if category := filters.get("category"):
            qs = qs.filter(category__slug=category)

        if search := filters.get("search"):
            qs = qs.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return qs

    @staticmethod
    def get_by_slug(slug: str):
        """Fetch a single published problem with its sample test cases."""
        return Problem.objects.select_related("category", "created_by").get(
            slug=slug, is_published=True,
        )

    @staticmethod
    def create_problem(data: dict, user):
        """Admin: create a new problem."""
        if not data.get("slug"):
            data["slug"] = slugify(data["title"])
        data["created_by"] = user
        return Problem.objects.create(**data)

    @staticmethod
    def add_test_cases(problem, test_cases_data: list):
        """Admin: bulk-add test cases to a problem."""
        objs = [
            TestCase(problem=problem, **tc_data)
            for tc_data in test_cases_data
        ]
        return TestCase.objects.bulk_create(objs)

    @staticmethod
    def list_categories():
        """Return all categories."""
        return Category.objects.all()
