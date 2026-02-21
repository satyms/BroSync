"""
Accounts - Models
==================
Custom User model with role-based access control.
"""

import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model.
    Uses email as the primary identifier instead of username.
    Supports role-based access: 'admin' and 'user'.
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        USER = "user", "User"
        ORGANIZER = "organizer", "Organizer"

    # Primary key
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the user.",
    )

    # Core fields
    email = models.EmailField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text="User's email address (used for login).",
    )
    username = models.CharField(
        unique=True,
        max_length=30,
        db_index=True,
        help_text="Unique username (3-30 alphanumeric/underscore characters).",
    )
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)

    # Role & permissions
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        db_index=True,
        help_text="User role for access control.",
    )
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Profile
    avatar_url = models.URLField(max_length=500, blank=True, default="")
    bio = models.TextField(max_length=500, blank=True, default="")

    # Stats (denormalized for performance)
    problems_solved = models.PositiveIntegerField(default=0)
    contests_participated = models.PositiveIntegerField(default=0)
    rating = models.IntegerField(default=0, db_index=True)

    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "accounts_user"
        ordering = ["-date_joined"]
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["email"], name="idx_user_email"),
            models.Index(fields=["username"], name="idx_user_username"),
            models.Index(fields=["rating"], name="idx_user_rating"),
            models.Index(fields=["role"], name="idx_user_role"),
        ]

    def __str__(self):
        return f"{self.username} ({self.email})"

    @property
    def full_name(self):
        """Return user's full name."""
        return f"{self.first_name} {self.last_name}".strip() or self.username

    @property
    def is_admin(self):
        """Check if user has admin role."""
        return self.role == self.Role.ADMIN

    @property
    def is_organizer(self):
        """Check if user has organizer role."""
        return self.role == self.Role.ORGANIZER
