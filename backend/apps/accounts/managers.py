"""
Accounts - Custom User Manager
===============================
Handles user creation with proper validation and normalization.
"""

from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):
    """Custom manager for the User model."""

    def create_user(self, email, username, password=None, **extra_fields):
        """
        Create and return a regular user with an email, username, and password.

        Args:
            email: User's email address.
            username: Unique username.
            password: Raw password (will be hashed).
            **extra_fields: Additional fields for the User model.

        Returns:
            User instance.

        Raises:
            ValueError: If email or username is not provided.
        """
        if not email:
            raise ValueError("Users must have an email address.")
        if not username:
            raise ValueError("Users must have a username.")

        email = self.normalize_email(email)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", "user")

        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        """
        Create and return a superuser with admin role.

        Args:
            email: Admin's email address.
            username: Unique username.
            password: Raw password.
            **extra_fields: Additional fields.

        Returns:
            User instance with admin privileges.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, username, password, **extra_fields)
