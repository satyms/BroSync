"""
Accounts - URL Configuration
==============================
Maps URL patterns to account views.
"""

from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("login/", views.LoginView.as_view(), name="login"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("token/refresh/", views.TokenRefreshAPIView.as_view(), name="token-refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),

    # Profile management
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("profile/update/", views.ProfileUpdateView.as_view(), name="profile-update"),

    # Password
    path("password/change/", views.ChangePasswordView.as_view(), name="password-change"),

    # Account actions
    path("deactivate/", views.DeactivateAccountView.as_view(), name="deactivate"),

    # User lookup
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user-detail"),
    path("users/<str:username>/profile/", views.PublicProfileByUsernameView.as_view(), name="user-profile-by-username"),
]
