"""
BroSync - Root URL Configuration
=================================
All app URL includes are registered here.
"""

from django.contrib import admin
from django.urls import include, path

# API version prefix
API_V1 = "api/v1/"

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # API v1 endpoints
    path(f"{API_V1}auth/", include("apps.accounts.urls", namespace="accounts")),
    path(f"{API_V1}problems/", include("apps.problems.urls", namespace="problems")),
    path(f"{API_V1}submissions/", include("apps.submissions.urls", namespace="submissions")),
    path(f"{API_V1}contests/", include("apps.contests.urls", namespace="contests")),
    path(f"{API_V1}leaderboard/", include("apps.leaderboard.urls", namespace="leaderboard")),
    path(f"{API_V1}organizer/", include("apps.organizer.urls", namespace="organizer")),
]
