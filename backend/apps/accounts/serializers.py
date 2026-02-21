"""
Accounts - Serializers
=======================
Handles validation, serialization, and deserialization for auth endpoints.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from core.utils.sanitizers import sanitize_plain_text, validate_username

User = get_user_model()


# ========================================
# JWT Token Serializers
# ========================================


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user info in the token claims.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["username"] = user.username
        token["email"] = user.email
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user info to response body
        data["user"] = UserProfileSerializer(self.user).data
        return data


# ========================================
# Registration Serializer
# ========================================


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Validates username format, password strength, and email uniqueness.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        style={"input_type": "password"},
        help_text="Must be at least 8 characters.",
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        help_text="Must match the password field.",
    )

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        ]

    def validate_username(self, value):
        """Validate and sanitize username."""
        value = sanitize_plain_text(value)
        if not validate_username(value):
            raise serializers.ValidationError(
                "Username must be 3-30 characters, using only letters, numbers, and underscores."
            )
        return value

    def validate_email(self, value):
        """Normalize and validate email."""
        return value.lower().strip()

    def validate_password(self, value):
        """Validate password against Django's validators."""
        validate_password(value)
        return value

    def validate(self, attrs):
        """Ensure password and password_confirm match."""
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        """Create a new user. Delegates to the service layer."""
        # Import here to avoid circular imports
        from .services import AccountService

        return AccountService.create_user(validated_data)


# ========================================
# User Profile Serializers
# ========================================


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for user profile information."""

    full_name = serializers.CharField(read_only=True)
    global_rank = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "avatar_url",
            "bio",
            "problems_solved",
            "contests_participated",
            "rating",
            "global_rank",
            "date_joined",
        ]
        read_only_fields = fields

    def get_global_rank(self, obj):
        """Count of active users with strictly higher rating + 1."""
        return User.objects.filter(
            is_active=True, rating__gt=obj.rating
        ).count() + 1


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile (non-sensitive fields only)."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "avatar_url", "bio"]

    def validate_bio(self, value):
        """Sanitize bio text."""
        return sanitize_plain_text(value)

    def validate_first_name(self, value):
        """Sanitize first name."""
        return sanitize_plain_text(value)

    def validate_last_name(self, value):
        """Sanitize last name."""
        return sanitize_plain_text(value)


# ========================================
# Password Change Serializer
# ========================================


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change endpoint."""

    old_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_new_password(self, value):
        """Validate new password strength."""
        validate_password(value)
        return value

    def validate(self, attrs):
        """Ensure new passwords match."""
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        return attrs


# ========================================
# Public User Serializer (for leaderboard, etc.)
# ========================================


class PublicUserSerializer(serializers.ModelSerializer):
    """Minimal user info for public display (leaderboard, contest participants)."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "avatar_url",
            "problems_solved",
            "rating",
        ]
        read_only_fields = fields
