"""Contests - Serializers."""
from django.utils import timezone
from rest_framework import serializers

from apps.problems.models import Problem
from .models import Contest, ContestParticipation, ContestProblem


class ContestProblemSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="problem.id", read_only=True)
    title = serializers.CharField(source="problem.title", read_only=True)
    slug = serializers.SlugField(source="problem.slug", read_only=True)
    difficulty = serializers.CharField(source="problem.difficulty", read_only=True)

    class Meta:
        model = ContestProblem
        fields = ["id", "title", "slug", "difficulty", "order", "points"]


class ContestListSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()
    duration_minutes = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)

    class Meta:
        model = Contest
        fields = [
            "id", "title", "slug", "description", "status", "visibility",
            "start_time", "end_time", "duration_minutes", "is_active",
            "participant_count", "max_participants", "penalty_time_minutes",
            "created_by_username", "created_at",
        ]

    def get_participant_count(self, obj):
        return obj.participations.count()


class ContestDetailSerializer(ContestListSerializer):
    problems = ContestProblemSerializer(
        source="contestproblem_set", many=True, read_only=True
    )
    user_joined = serializers.SerializerMethodField()

    class Meta(ContestListSerializer.Meta):
        fields = ContestListSerializer.Meta.fields + ["problems", "user_joined", "join_code"]

    def get_user_joined(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.participations.filter(user=request.user).exists()


class ContestParticipationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = ContestParticipation
        fields = [
            "id", "username", "first_name", "last_name",
            "score", "penalty", "problems_solved", "joined_at",
        ]
