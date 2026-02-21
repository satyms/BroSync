"""Leaderboard - URL Patterns."""
from django.urls import path
from .views import GlobalLeaderboardView

app_name = "leaderboard"

urlpatterns = [
    path("", GlobalLeaderboardView.as_view(), name="global"),
]
