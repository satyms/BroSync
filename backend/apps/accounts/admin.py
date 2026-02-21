"""
Accounts - Admin Configuration
================================
Register User model with Django admin for management.
"""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the User model."""

    list_display = (
        "username",
        "email",
        "role",
        "rating",
        "problems_solved",
        "is_active",
        "date_joined",
    )
    list_filter = ("role", "is_active", "is_staff", "date_joined")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("-date_joined",)
    readonly_fields = ("id", "date_joined", "updated_at", "last_login")

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "avatar_url", "bio")}),
        ("Role & Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Stats", {"fields": ("problems_solved", "contests_participated", "rating")}),
        ("Timestamps", {"fields": ("date_joined", "last_login", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2", "role"),
            },
        ),
    )
