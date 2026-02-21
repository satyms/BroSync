"""
Problems - Serializers
=======================
DRF serializers for categories, problems, and test cases.
"""

from rest_framework import serializers

from .models import Category, Problem, TestCase


# ========================================
# CATEGORY SERIALIZERS
# ========================================

class CategorySerializer(serializers.ModelSerializer):
    """Category list/detail serializer."""
    problem_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "problem_count"]
        read_only_fields = ["id", "slug"]

    def get_problem_count(self, obj):
        return obj.problems.filter(is_published=True).count()


class CategoryCreateSerializer(serializers.ModelSerializer):
    """Admin-only: create/update a category."""

    class Meta:
        model = Category
        fields = ["name", "slug", "description"]


# ========================================
# TEST CASE SERIALIZERS
# ========================================

class TestCaseSampleSerializer(serializers.ModelSerializer):
    """Public: only sample test cases visible to users."""

    class Meta:
        model = TestCase
        fields = ["id", "input_data", "expected_output", "order"]


class TestCaseAdminSerializer(serializers.ModelSerializer):
    """Admin-only: full test case management."""

    class Meta:
        model = TestCase
        fields = ["id", "problem", "input_data", "expected_output", "is_sample", "order"]
        read_only_fields = ["id"]


# ========================================
# PROBLEM SERIALIZERS
# ========================================

class ProblemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for problem listing pages."""
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    acceptance_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id", "title", "slug", "difficulty", "category", "category_name",
            "is_published", "total_submissions", "accepted_submissions",
            "acceptance_rate", "created_at",
        ]


class ProblemDetailSerializer(serializers.ModelSerializer):
    """Full problem detail with sample test cases."""
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    acceptance_rate = serializers.FloatField(read_only=True)
    sample_test_cases = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True, default=None,
    )

    class Meta:
        model = Problem
        fields = [
            "id", "title", "slug", "description", "input_format", "output_format",
            "constraints", "difficulty", "category", "category_name",
            "time_limit_ms", "memory_limit_mb", "is_published",
            "total_submissions", "accepted_submissions", "acceptance_rate",
            "created_by", "created_by_username", "sample_test_cases",
            "created_at", "updated_at",
        ]

    def get_sample_test_cases(self, obj):
        samples = obj.test_cases.filter(is_sample=True).order_by("order")
        return TestCaseSampleSerializer(samples, many=True).data


class ProblemCreateSerializer(serializers.ModelSerializer):
    """Admin-only: create/update a problem."""

    class Meta:
        model = Problem
        fields = [
            "title", "slug", "description", "input_format", "output_format",
            "constraints", "difficulty", "category", "time_limit_ms",
            "memory_limit_mb", "is_published",
        ]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class RunCodeSerializer(serializers.Serializer):
    """Validate quick-run (playground) requests — run code without submitting."""
    language = serializers.ChoiceField(choices=["python", "cpp", "java", "javascript"])
    code = serializers.CharField(max_length=50000)
    stdin = serializers.CharField(required=False, default="", allow_blank=True, max_length=10000)
