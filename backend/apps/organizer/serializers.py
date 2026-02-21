"""
Organizer - Serializers
========================
Handles CRUD for contests, problems, and organizer profile management.
"""

from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from apps.contests.models import Contest, ContestParticipation, ContestProblem
from apps.problems.models import Category, Problem, TestCase

from .models import OrganizerProfile

User = get_user_model()


# ──────────────────────────────────────────────────────────────────────────────
# Organizer Profile
# ──────────────────────────────────────────────────────────────────────────────


class OrganizerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = OrganizerProfile
        fields = [
            "id", "username", "email", "role",
            "org_name", "org_type", "description",
            "website", "logo_url", "location", "is_verified",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_verified", "created_at", "updated_at"]


class OrganizerSetupSerializer(serializers.Serializer):
    """Registers the authenticated user as an organizer."""
    org_name = serializers.CharField(max_length=200)
    org_type = serializers.ChoiceField(choices=OrganizerProfile.OrgType.choices)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    website = serializers.URLField(required=False, allow_blank=True, default="")
    logo_url = serializers.URLField(required=False, allow_blank=True, default="")
    location = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")

    def create(self, validated_data):
        user = self.context["request"].user
        # Update user role
        user.role = "organizer"
        user.save(update_fields=["role"])
        # Create or update organizer profile
        profile, _ = OrganizerProfile.objects.update_or_create(
            user=user, defaults=validated_data
        )
        return profile


# ──────────────────────────────────────────────────────────────────────────────
# Test Cases
# ──────────────────────────────────────────────────────────────────────────────


class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ["id", "input_data", "expected_output", "is_sample", "order"]
        read_only_fields = ["id"]


# ──────────────────────────────────────────────────────────────────────────────
# Problem Management
# ──────────────────────────────────────────────────────────────────────────────


class OrgProblemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing problems in organizer view."""
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    acceptance_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id", "title", "slug", "difficulty", "category_name",
            "is_published", "total_submissions", "accepted_submissions",
            "acceptance_rate", "time_limit_ms", "memory_limit_mb",
            "created_at",
        ]


class OrgProblemDetailSerializer(serializers.ModelSerializer):
    """Full serializer for creating / editing problems (with test cases)."""
    test_cases = TestCaseSerializer(many=True, required=False)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    acceptance_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id", "title", "slug", "difficulty",
            "description", "input_format", "output_format", "constraints",
            "category_id", "category_name",
            "time_limit_ms", "memory_limit_mb",
            "is_published",
            "total_submissions", "accepted_submissions", "acceptance_rate",
            "test_cases",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "total_submissions", "accepted_submissions",
            "acceptance_rate", "created_at", "updated_at",
        ]

    def _save_test_cases(self, problem, test_cases_data):
        # Clear old test cases and re-create (simple replace strategy)
        if test_cases_data is not None:
            problem.test_cases.all().delete()
            for tc in test_cases_data:
                TestCase.objects.create(problem=problem, **tc)

    def create(self, validated_data):
        test_cases_data = validated_data.pop("test_cases", [])
        category_id = validated_data.pop("category_id", None)

        # Auto-generate slug from title
        base_slug = slugify(validated_data["title"])
        slug = base_slug
        counter = 1
        while Problem.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data["slug"] = slug

        if category_id:
            try:
                validated_data["category"] = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                pass

        validated_data["created_by"] = self.context["request"].user
        problem = Problem.objects.create(**validated_data)
        self._save_test_cases(problem, test_cases_data)
        return problem

    def update(self, instance, validated_data):
        test_cases_data = validated_data.pop("test_cases", None)
        category_id = validated_data.pop("category_id", None)

        if category_id:
            try:
                validated_data["category"] = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                pass

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        self._save_test_cases(instance, test_cases_data)
        return instance


# ──────────────────────────────────────────────────────────────────────────────
# Contest Management
# ──────────────────────────────────────────────────────────────────────────────


class ContestProblemInlineSerializer(serializers.ModelSerializer):
    """Problem info as nested inside a contest."""
    problem_id = serializers.UUIDField(source="problem.id", read_only=True)
    title = serializers.CharField(source="problem.title", read_only=True)
    slug = serializers.CharField(source="problem.slug", read_only=True)
    difficulty = serializers.CharField(source="problem.difficulty", read_only=True)

    class Meta:
        model = ContestProblem
        fields = ["id", "problem_id", "title", "slug", "difficulty", "order", "points"]


class OrgContestListSerializer(serializers.ModelSerializer):
    """Lightweight contest serializer for organizer list view."""
    participant_count = serializers.SerializerMethodField()
    problem_count = serializers.SerializerMethodField()
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Contest
        fields = [
            "id", "title", "slug", "status", "visibility",
            "start_time", "end_time", "duration_minutes",
            "participant_count", "problem_count", "join_code",
            "created_at",
        ]

    def get_participant_count(self, obj):
        return obj.participations.count()

    def get_problem_count(self, obj):
        return obj.problems.count()


class OrgContestDetailSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for creating/editing contests."""
    contest_problems = ContestProblemInlineSerializer(
        source="contestproblem_set", many=True, read_only=True
    )
    participant_count = serializers.SerializerMethodField()
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Contest
        fields = [
            "id", "title", "slug", "description", "status", "visibility",
            "start_time", "end_time", "duration_minutes",
            "penalty_time_minutes", "max_participants",
            "join_code", "contest_problems", "participant_count",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "join_code", "contest_problems",
            "participant_count", "duration_minutes", "created_at", "updated_at",
        ]

    def get_participant_count(self, obj):
        return obj.participations.count()

    def create(self, validated_data):
        base_slug = slugify(validated_data["title"])
        slug = base_slug
        counter = 1
        while Contest.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data["slug"] = slug
        validated_data["created_by"] = self.context["request"].user

        # Auto-generate join code for private contests
        if validated_data.get("visibility") == Contest.Visibility.PRIVATE:
            from apps.contests.models import _generate_join_code
            validated_data["join_code"] = _generate_join_code()

        return Contest.objects.create(**validated_data)

    def update(self, instance, validated_data):
        # If switching to private, ensure join_code exists
        new_visibility = validated_data.get("visibility", instance.visibility)
        if new_visibility == Contest.Visibility.PRIVATE and not instance.join_code:
            from apps.contests.models import _generate_join_code
            instance.join_code = _generate_join_code()

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


class AddProblemToContestSerializer(serializers.Serializer):
    """Payload for adding/updating a problem in a contest."""
    problem_id = serializers.UUIDField()
    order = serializers.IntegerField(default=0, min_value=0)
    points = serializers.IntegerField(default=100, min_value=0)


# ──────────────────────────────────────────────────────────────────────────────
# Participants
# ──────────────────────────────────────────────────────────────────────────────


class ParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    avatar_url = serializers.URLField(source="user.avatar_url", read_only=True)
    rating = serializers.IntegerField(source="user.rating", read_only=True)
    is_disqualified = serializers.BooleanField(default=False, read_only=True)

    class Meta:
        model = ContestParticipation
        fields = [
            "id", "username", "email", "full_name", "avatar_url", "rating",
            "score", "penalty", "problems_solved", "joined_at", "is_disqualified",
        ]


# ──────────────────────────────────────────────────────────────────────────────
# Dashboard Analytics
# ──────────────────────────────────────────────────────────────────────────────


class OrgDashboardStatsSerializer(serializers.Serializer):
    total_contests = serializers.IntegerField()
    active_contests = serializers.IntegerField()
    upcoming_contests = serializers.IntegerField()
    ended_contests = serializers.IntegerField()
    total_problems = serializers.IntegerField()
    published_problems = serializers.IntegerField()
    total_participants = serializers.IntegerField()
    participation_growth = serializers.ListField(child=serializers.DictField())
    difficulty_distribution = serializers.DictField()
    contest_performance = serializers.ListField(child=serializers.DictField())
