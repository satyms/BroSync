"""
Core Permissions
================
Reusable permission classes for role-based access control.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsOrganizer(BasePermission):
    """Allow access only to organizer (or admin) users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("organizer", "admin")
        )


class IsUser(BasePermission):
    """Allow access to any authenticated user."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsOwner(BasePermission):
    """Allow access only to the owner of the object."""

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsAdminOrReadOnly(BasePermission):
    """Allow write access to admins, read access to all authenticated users."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow access to the owner of the object or an admin."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        return obj.user == request.user


class IsOrganizerOwner(BasePermission):
    """
    Allow organizer/admin to access only their own resources.
    Object must have a `created_by` field pointing to a User.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("organizer", "admin")
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        return obj.created_by == request.user

