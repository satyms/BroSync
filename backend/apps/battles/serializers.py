"""
Battles - Serializers
======================
DRF serializers for the battle system REST API.
"""

from rest_framework import serializers
from apps.accounts.models import User
from .models import Battle, BattleParticipant, BattleRequest, BattleSubmission


class UserMiniSerializer(serializers.ModelSerializer):
    """Lightweight user info embedded in battle responses."""

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "rating"]


class BattleRequestSerializer(serializers.ModelSerializer):
    """Full detail of a battle request (challenger → opponent)."""

    challenger = UserMiniSerializer(read_only=True)
    opponent   = UserMiniSerializer(read_only=True)

    class Meta:
        model = BattleRequest
        fields = [
            "id", "challenger", "opponent",
            "difficulty", "status",
            "expires_at", "created_at",
        ]
        read_only_fields = fields


class SendBattleRequestSerializer(serializers.Serializer):
    """Validate the payload for sending a challenge."""

    opponent_username = serializers.CharField(max_length=30)
    difficulty = serializers.ChoiceField(
        choices=BattleRequest.Difficulty.choices,
        default=BattleRequest.Difficulty.MEDIUM,
    )

    def validate_opponent_username(self, value):
        try:
            user = User.objects.get(username=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")
        # Store the resolved User obj for the view
        self.context["opponent"] = user
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.username == attrs["opponent_username"]:
            raise serializers.ValidationError("You cannot challenge yourself.")
        return attrs


class RespondBattleRequestSerializer(serializers.Serializer):
    """Accept or reject a pending battle request."""

    accepted = serializers.BooleanField()


class BattleParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")

    class Meta:
        model = BattleParticipant
        fields = ["username", "score", "problems_solved", "is_connected"]


class BattleListSerializer(serializers.ModelSerializer):
    """Compact battle info for listing."""

    challenger = UserMiniSerializer(read_only=True)
    opponent   = UserMiniSerializer(read_only=True)
    winner     = UserMiniSerializer(read_only=True)

    class Meta:
        model = Battle
        fields = [
            "id", "challenger", "opponent", "winner",
            "difficulty", "status",
            "started_at", "ended_at", "created_at",
        ]


class BattleDetailSerializer(serializers.ModelSerializer):
    """Full battle info including problems and live scores."""

    challenger   = UserMiniSerializer(read_only=True)
    opponent     = UserMiniSerializer(read_only=True)
    winner       = UserMiniSerializer(read_only=True)
    participants = BattleParticipantSerializer(many=True, read_only=True)
    problems     = serializers.SerializerMethodField()
    seconds_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Battle
        fields = [
            "id", "challenger", "opponent", "winner",
            "difficulty", "status",
            "problems", "participants",
            "seconds_remaining",
            "started_at", "ends_at", "ended_at", "created_at",
        ]

    def get_problems(self, obj):
        return [
            {
                "id": str(p.id),
                "title": p.title,
                "slug": p.slug,
                "difficulty": p.difficulty,
            }
            for p in obj.problems.all()
        ]

    def get_seconds_remaining(self, obj):
        return obj.seconds_remaining()


class BattleSubmitSerializer(serializers.Serializer):
    """Payload for submitting code in a battle (via REST)."""

    problem_id = serializers.UUIDField()
    code       = serializers.CharField()
    language   = serializers.ChoiceField(
        choices=["python", "cpp", "java", "javascript"]
    )


class BattleSubmissionResultSerializer(serializers.ModelSerializer):
    """What gets returned after a submission is judged."""

    problem_title = serializers.CharField(source="problem.title")
    username      = serializers.CharField(source="user.username")

    class Meta:
        model = BattleSubmission
        fields = [
            "id", "username", "problem_title",
            "language", "status", "points_earned",
            "execution_time_ms", "submitted_at",
        ]
