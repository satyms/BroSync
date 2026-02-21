"""
Submissions - Serializers
==========================
DRF serializers for code submissions.
"""

from rest_framework import serializers

from .models import Submission


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Create a submission. User provides problem, language, code.
    Optionally pass contest for contest submissions.
    """

    class Meta:
        model = Submission
        fields = ["problem", "language", "code", "contest"]
        extra_kwargs = {
            "contest": {"required": False, "allow_null": True},
        }

    def validate_code(self, value):
        if not value.strip():
            raise serializers.ValidationError("Code cannot be empty.")
        if len(value) > 50000:
            raise serializers.ValidationError("Code exceeds maximum length (50,000 chars).")
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class SubmissionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for submission lists."""
    username = serializers.CharField(source="user.username", read_only=True)
    problem_title = serializers.CharField(source="problem.title", read_only=True)
    problem_slug = serializers.CharField(source="problem.slug", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id", "username", "problem", "problem_title", "problem_slug",
            "language", "status", "execution_time_ms", "memory_used_kb",
            "test_cases_passed", "total_test_cases", "submitted_at",
        ]


class SubmissionDetailSerializer(serializers.ModelSerializer):
    """Full submission detail including code and error output."""
    username = serializers.CharField(source="user.username", read_only=True)
    problem_title = serializers.CharField(source="problem.title", read_only=True)
    problem_slug = serializers.CharField(source="problem.slug", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id", "user", "username", "problem", "problem_title", "problem_slug",
            "contest", "language", "code", "status",
            "execution_time_ms", "memory_used_kb",
            "test_cases_passed", "total_test_cases",
            "error_output", "submitted_at", "judged_at",
        ]
