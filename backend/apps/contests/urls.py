"""Contests - URL Patterns."""
from django.urls import path
from .views import ContestDetailView, ContestLeaderboardView, ContestListView, JoinContestView

app_name = "contests"

urlpatterns = [
    path("", ContestListView.as_view(), name="contest-list"),
    path("<slug:slug>/", ContestDetailView.as_view(), name="contest-detail"),
    path("<slug:slug>/join/", JoinContestView.as_view(), name="contest-join"),
    path("<slug:slug>/leaderboard/", ContestLeaderboardView.as_view(), name="contest-leaderboard"),
]
