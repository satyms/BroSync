"""
Accounts - Tests
==================
Unit tests for registration, login, profile, and password management.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class UserModelTest(TestCase):
    """Tests for the custom User model."""

    def test_create_user(self):
        """Creating a regular user sets correct defaults."""
        user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="StrongPass123!",
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.role, "user")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_create_superuser(self):
        """Creating a superuser sets admin role and staff flags."""
        admin = User.objects.create_superuser(
            email="admin@example.com",
            username="adminuser",
            password="AdminPass123!",
        )
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_email_required(self):
        """Creating a user without email raises ValueError."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", username="no_email", password="pass")

    def test_username_required(self):
        """Creating a user without username raises ValueError."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="a@b.com", username="", password="pass")


class RegisterAPITest(TestCase):
    """Tests for the registration endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/register/"

    def test_register_success(self):
        """Valid registration returns 201 with tokens."""
        data = {
            "email": "new@example.com",
            "username": "newuser",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("tokens", response.data["data"])

    def test_register_password_mismatch(self):
        """Mismatched passwords return 400."""
        data = {
            "email": "new@example.com",
            "username": "newuser",
            "password": "StrongPass123!",
            "password_confirm": "DifferentPass456!",
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        """Duplicate email returns error."""
        User.objects.create_user(
            email="dup@example.com", username="existing", password="Pass123!"
        )
        data = {
            "email": "dup@example.com",
            "username": "newuser2",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(TestCase):
    """Tests for the login endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/login/"
        self.user = User.objects.create_user(
            email="login@example.com",
            username="loginuser",
            password="StrongPass123!",
        )

    def test_login_success(self):
        """Valid credentials return access and refresh tokens."""
        data = {"email": "login@example.com", "password": "StrongPass123!"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invalid_credentials(self):
        """Invalid credentials return 401."""
        data = {"email": "login@example.com", "password": "WrongPass!"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileAPITest(TestCase):
    """Tests for profile endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="profile@example.com",
            username="profileuser",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        """Authenticated user can retrieve their profile."""
        response = self.client.get("/api/v1/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["username"], "profileuser")

    def test_update_profile(self):
        """Authenticated user can update their profile."""
        data = {"first_name": "Updated", "bio": "Hello world"}
        response = self.client.patch(
            "/api/v1/auth/profile/update/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["first_name"], "Updated")

    def test_unauthenticated_profile_access(self):
        """Unauthenticated requests are rejected."""
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
