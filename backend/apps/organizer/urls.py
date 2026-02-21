"""Organizer - URL Patterns."""

from django.urls import path

from .views import (
    GenerateJoinCodeView,
    OrgCategoryListView,
    OrgContestDetailView,
    OrgContestListCreateView,
    OrgContestProblemsView,
    OrgContestRemoveProblemView,
    OrgDashboardView,
    OrgDisqualifyParticipantView,
    OrgParticipantsView,
    OrgProblemDetailView,
    OrgProblemListCreateView,
    OrgProblemTestCasesView,
    OrgTestCaseDetailView,
    OrganizerProfileView,
    OrganizerSetupView,
)

app_name = "organizer"

urlpatterns = [
    # ── Setup & Profile ──────────────────────────────────────────────────────
    path("setup/", OrganizerSetupView.as_view(), name="setup"),
    path("profile/", OrganizerProfileView.as_view(), name="profile"),

    # ── Dashboard ────────────────────────────────────────────────────────────
    path("dashboard/", OrgDashboardView.as_view(), name="dashboard"),

    # ── Contest Management ───────────────────────────────────────────────────
    path("contests/", OrgContestListCreateView.as_view(), name="contest-list"),
    path("contests/<uuid:pk>/", OrgContestDetailView.as_view(), name="contest-detail"),
    path("contests/<uuid:pk>/problems/", OrgContestProblemsView.as_view(), name="contest-problems"),
    path(
        "contests/<uuid:pk>/problems/<uuid:problem_id>/",
        OrgContestRemoveProblemView.as_view(),
        name="contest-remove-problem",
    ),
    path(
        "contests/<uuid:pk>/generate-code/",
        GenerateJoinCodeView.as_view(),
        name="generate-code",
    ),
    path(
        "contests/<uuid:pk>/participants/",
        OrgParticipantsView.as_view(),
        name="participants",
    ),
    path(
        "contests/<uuid:pk>/participants/<uuid:participation_id>/disqualify/",
        OrgDisqualifyParticipantView.as_view(),
        name="disqualify",
    ),

    # ── Problem Management ───────────────────────────────────────────────────
    path("problems/", OrgProblemListCreateView.as_view(), name="problem-list"),
    path("problems/<uuid:pk>/", OrgProblemDetailView.as_view(), name="problem-detail"),
    path(
        "problems/<uuid:pk>/test-cases/",
        OrgProblemTestCasesView.as_view(),
        name="problem-test-cases",
    ),

    # ── Test Case Detail ─────────────────────────────────────────────────────
    path("test-cases/<uuid:pk>/", OrgTestCaseDetailView.as_view(), name="test-case-detail"),

    # ── Utility ──────────────────────────────────────────────────────────────
    path("categories/", OrgCategoryListView.as_view(), name="categories"),
]
