"""
Accounts - Views
=================
API endpoints for authentication, registration, and profile management.
All business logic is delegated to AccountService.
"""

import logging

from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.permissions.roles import IsOwnerOrAdmin
from core.utils.responses import error_response, success_response

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
)
from .services import AccountService

logger = logging.getLogger("apps")
User = get_user_model()


# ========================================
# Authentication Views
# ========================================


class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/
    Authenticate user and return JWT access + refresh tokens.
    """

    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class TokenRefreshAPIView(TokenRefreshView):
    """
    POST /api/v1/auth/token/refresh/
    Refresh an expired access token using a valid refresh token.
    """

    permission_classes = [AllowAny]


# ========================================
# Registration
# ========================================


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/auth/register/
    Create a new user account. Returns JWT tokens on success.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        tokens = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

        return success_response(
            data={
                "user": UserProfileSerializer(user).data,
                "tokens": tokens,
            },
            message="Registration successful.",
            status_code=status.HTTP_201_CREATED,
        )


# ========================================
# Profile Management
# ========================================


class ProfileView(APIView):
    """
    GET /api/v1/auth/profile/
    Retrieve the authenticated user's profile.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return success_response(data=serializer.data)


class ProfileUpdateView(APIView):
    """
    PATCH /api/v1/auth/profile/update/
    Update the authenticated user's profile fields.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Delegate to service layer
        user = AccountService.update_profile(request.user, serializer.validated_data)
        return success_response(
            data=UserProfileSerializer(user).data,
            message="Profile updated successfully.",
        )


# ========================================
# Password Management
# ========================================


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/password/change/
    Change the authenticated user's password.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AccountService.change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"],
        )

        return success_response(message="Password changed successfully.")


# ========================================
# Logout (Blacklist refresh token)
# ========================================


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklist the refresh token to log the user out.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return error_response(
                    message="Refresh token is required.",
                    code="MISSING_TOKEN",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return success_response(message="Logged out successfully.")
        except Exception as e:
            logger.warning("Logout failed: %s", str(e))
            return error_response(
                message="Invalid or expired refresh token.",
                code="INVALID_TOKEN",
                status_code=status.HTTP_400_BAD_REQUEST,
            )


# ========================================
# Account Deactivation
# ========================================


class DeactivateAccountView(APIView):
    """
    POST /api/v1/auth/deactivate/
    Soft-delete (deactivate) the authenticated user's account.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        AccountService.deactivate_account(request.user)
        return success_response(message="Account deactivated successfully.")


# ========================================
# User Lookup (Admin or public)
# ========================================


class UserDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/auth/users/<uuid:pk>/
    Retrieve any user's public profile.
    """

    queryset = User.objects.filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"
