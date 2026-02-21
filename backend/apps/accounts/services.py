"""
Accounts - Service Layer
=========================
Business logic for user management, separated from views.
"""

import logging

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

logger = logging.getLogger("apps")
User = get_user_model()


class AccountService:
    """
    Encapsulates all business logic related to user accounts.
    Views delegate to this service for create, update, and password operations.
    """

    @staticmethod
    @transaction.atomic
    def create_user(validated_data: dict) -> "User":
        """
        Create a new user account.

        Args:
            validated_data: Validated data from RegisterSerializer.

        Returns:
            Created User instance.

        Raises:
            ValidationError: If email or username already exists.
        """
        try:
            user = User.objects.create_user(
                email=validated_data["email"],
                username=validated_data["username"],
                password=validated_data["password"],
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
            )
            logger.info("New user registered: %s", user.username)
            return user
        except IntegrityError as e:
            logger.warning("User registration failed (duplicate): %s", str(e))
            raise ValidationError(
                {"detail": "A user with this email or username already exists."}
            )

    @staticmethod
    def update_profile(user: "User", validated_data: dict) -> "User":
        """
        Update a user's profile fields.

        Args:
            user: User instance to update.
            validated_data: Validated data from UserUpdateSerializer.

        Returns:
            Updated User instance.
        """
        for field, value in validated_data.items():
            setattr(user, field, value)
        user.save(update_fields=list(validated_data.keys()) + ["updated_at"])
        logger.info("Profile updated: %s", user.username)
        return user

    @staticmethod
    def change_password(user: "User", old_password: str, new_password: str) -> bool:
        """
        Change the user's password after verifying the old one.

        Args:
            user: User instance.
            old_password: Current password for verification.
            new_password: New password to set.

        Returns:
            True if password was changed successfully.

        Raises:
            ValidationError: If old password is incorrect.
        """
        if not user.check_password(old_password):
            raise ValidationError({"old_password": "Current password is incorrect."})

        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        logger.info("Password changed: %s", user.username)
        return True

    @staticmethod
    def deactivate_account(user: "User") -> None:
        """
        Soft-delete a user account by deactivating it.

        Args:
            user: User instance to deactivate.
        """
        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])
        logger.info("Account deactivated: %s", user.username)

    @staticmethod
    def get_user_by_id(user_id) -> "User":
        """
        Retrieve a user by their ID.

        Args:
            user_id: UUID of the user.

        Returns:
            User instance.

        Raises:
            User.DoesNotExist: If user is not found.
        """
        return User.objects.get(id=user_id, is_active=True)

    @staticmethod
    def get_user_stats(user: "User") -> dict:
        """
        Return user statistics for profile display.

        Args:
            user: User instance.

        Returns:
            Dict with user stats.
        """
        return {
            "problems_solved": user.problems_solved,
            "contests_participated": user.contests_participated,
            "rating": user.rating,
        }
