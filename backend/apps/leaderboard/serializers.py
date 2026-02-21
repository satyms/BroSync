"""Leaderboard - Serializers."""
from rest_framework import serializers
from apps.accounts.models import User
from .models import LeaderboardEntry


class GlobalLeaderboardSerializer(serializers.ModelSerializer):
    """Global ranking based on user rating / solved count."""
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    rating = serializers.IntegerField(read_only=True)
    # 'problems_solved' mirrors the annotated 'total_solved' count so the
    # frontend can use a single consistent field name across all endpoints.
    problems_solved = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "rating", "problems_solved", "contests_participated"]

    def get_problems_solved(self, obj):
        # prefer the annotated count; fall back to stored field
        return getattr(obj, "total_solved", None) or obj.problems_solved


class ContestLeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = LeaderboardEntry
        fields = [
            "id", "rank", "username", "first_name", "last_name",
            "score", "penalty", "problems_solved", "last_accepted_at", "updated_at",
        ]
