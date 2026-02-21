"""
Organizer - Views
==================
API endpoints for organization management:
  - Setup / Profile
  - Dashboard analytics
  - Contest CRUD
  - Problem CRUD + test cases
  - Participant management
"""

import logging

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.contests.models import Contest, ContestParticipation, ContestProblem
from apps.problems.models import Problem, TestCase, Category
from core.permissions.roles import IsOrganizer, IsOrganizerOwner
from core.utils.responses import error_response, success_response

from .models import OrganizerProfile
from .serializers import (
    AddProblemToContestSerializer,
    OrgContestDetailSerializer,
    OrgContestListSerializer,
    OrgDashboardStatsSerializer,
    OrgProblemDetailSerializer,
    OrgProblemListSerializer,
    OrganizerProfileSerializer,
    OrganizerSetupSerializer,
    ParticipantSerializer,
    TestCaseSerializer,
)

logger = logging.getLogger("apps")
User = get_user_model()


# ──────────────────────────────────────────────────────────────────────────────
# Organizer Setup & Profile
# ──────────────────────────────────────────────────────────────────────────────


class OrganizerSetupView(APIView):
    """
    POST /api/v1/organizer/setup/
    Register the current user as an organizer.
    Any authenticated user can call this (they upgrade their own role).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrganizerSetupSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return error_response(
                message="Invalid data.", details=serializer.errors, status_code=400
            )
        profile = serializer.save()
        return success_response(
            data=OrganizerProfileSerializer(profile).data,
            message="You are now registered as an organizer.",
            status_code=status.HTTP_201_CREATED,
        )


class OrganizerProfileView(APIView):
    """
    GET  /api/v1/organizer/profile/
    PUT  /api/v1/organizer/profile/
    View or update the organizer profile of the current user.
    """

    permission_classes = [IsOrganizer]

    def get(self, request):
        try:
            profile = request.user.organizer_profile
        except OrganizerProfile.DoesNotExist:
            return error_response(
                message="Organizer profile not found. Please complete setup.",
                status_code=404,
            )
        return success_response(data=OrganizerProfileSerializer(profile).data)

    def put(self, request):
        try:
            profile = request.user.organizer_profile
        except OrganizerProfile.DoesNotExist:
            return error_response(message="Organizer profile not found.", status_code=404)

        serializer = OrganizerProfileSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Invalid data.", details=serializer.errors, status_code=400
            )
        serializer.save()
        return success_response(data=serializer.data, message="Profile updated.")


# ──────────────────────────────────────────────────────────────────────────────
# Dashboard Analytics
# ──────────────────────────────────────────────────────────────────────────────


class OrgDashboardView(APIView):
    """
    GET /api/v1/organizer/dashboard/
    Returns aggregated stats and analytics charts for the organizer.
    """

    permission_classes = [IsOrganizer]

    def get(self, request):
        user = request.user
        contests = Contest.objects.filter(created_by=user)
        problems = Problem.objects.filter(created_by=user)

        # Basic counts
        total_contests = contests.count()
        active_contests = contests.filter(status=Contest.Status.ACTIVE).count()
        upcoming_contests = contests.filter(status=Contest.Status.UPCOMING).count()
        ended_contests = contests.filter(status=Contest.Status.ENDED).count()
        total_problems = problems.count()
        published_problems = problems.filter(is_published=True).count()

        # Total participants across all contests
        total_participants = ContestParticipation.objects.filter(
            contest__in=contests
        ).values("user").distinct().count()

        # Participation growth: last 6 contests by participant count
        participation_growth = list(
            contests.order_by("created_at")
            .annotate(count=Count("participations"))
            .values("title", "count")[:6]
        )

        # Difficulty distribution of organizer's problems
        diff_qs = problems.values("difficulty").annotate(count=Count("id"))
        difficulty_distribution = {row["difficulty"]: row["count"] for row in diff_qs}

        # Contest performance: acceptance rates of last 5 contests
        contest_performance = []
        for c in contests.order_by("-created_at")[:5]:
            total_subs = c.submissions.count()
            accepted = c.submissions.filter(status="accepted").count()
            rate = round((accepted / total_subs * 100), 1) if total_subs else 0
            contest_performance.append({
                "title": c.title[:25],
                "total_submissions": total_subs,
                "accepted": accepted,
                "acceptance_rate": rate,
            })

        data = {
            "total_contests": total_contests,
            "active_contests": active_contests,
            "upcoming_contests": upcoming_contests,
            "ended_contests": ended_contests,
            "total_problems": total_problems,
            "published_problems": published_problems,
            "total_participants": total_participants,
            "participation_growth": participation_growth,
            "difficulty_distribution": difficulty_distribution,
            "contest_performance": contest_performance,
        }
        return success_response(data=data)


# ──────────────────────────────────────────────────────────────────────────────
# Contest Management
# ──────────────────────────────────────────────────────────────────────────────


class OrgContestListCreateView(APIView):
    """
    GET  /api/v1/organizer/contests/     — list organizer's contests
    POST /api/v1/organizer/contests/     — create a new contest
    """

    permission_classes = [IsOrganizer]

    def get(self, request):
        contests = Contest.objects.filter(created_by=request.user).order_by("-created_at")
        serializer = OrgContestListSerializer(contests, many=True)
        return success_response(data={"results": serializer.data, "count": contests.count()})

    def post(self, request):
        serializer = OrgContestDetailSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return error_response(
                message="Invalid contest data.", details=serializer.errors, status_code=400
            )
        contest = serializer.save()
        return success_response(
            data=OrgContestDetailSerializer(contest).data,
            message="Contest created successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class OrgContestDetailView(APIView):
    """
    GET    /api/v1/organizer/contests/<id>/
    PUT    /api/v1/organizer/contests/<id>/
    DELETE /api/v1/organizer/contests/<id>/
    """

    permission_classes = [IsOrganizer]

    def _get_contest(self, request, pk):
        try:
            contest = Contest.objects.get(pk=pk)
        except Contest.DoesNotExist:
            return None, error_response(message="Contest not found.", status_code=404)
        if contest.created_by != request.user and request.user.role != "admin":
            return None, error_response(message="Permission denied.", status_code=403)
        return contest, None

    def get(self, request, pk):
        contest, err = self._get_contest(request, pk)
        if err:
            return err
        return success_response(data=OrgContestDetailSerializer(contest).data)

    def put(self, request, pk):
        contest, err = self._get_contest(request, pk)
        if err:
            return err
        serializer = OrgContestDetailSerializer(
            contest, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return error_response(
                message="Invalid data.", details=serializer.errors, status_code=400
            )
        contest = serializer.save()
        return success_response(
            data=OrgContestDetailSerializer(contest).data, message="Contest updated."
        )

    def delete(self, request, pk):
        contest, err = self._get_contest(request, pk)
        if err:
            return err
        title = contest.title
        contest.delete()
        return success_response(message=f'Contest "{title}" deleted.')


class OrgContestProblemsView(APIView):
    """
    GET    /api/v1/organizer/contests/<id>/problems/   — list problems in contest
    POST   /api/v1/organizer/contests/<id>/problems/   — add problem to contest
    DELETE /api/v1/organizer/contests/<id>/problems/<problem_id>/  — remove problem
    """

    permission_classes = [IsOrganizer]

    def _get_contest(self, request, pk):
        try:
            contest = Contest.objects.get(pk=pk)
        except Contest.DoesNotExist:
            return None, error_response(message="Contest not found.", status_code=404)
        if contest.created_by != request.user and request.user.role != "admin":
            return None, error_response(message="Permission denied.", status_code=403)
        return contest, None

    def get(self, request, pk):
        contest, err = self._get_contest(request, pk)
        if err:
            return err
        from .serializers import ContestProblemInlineSerializer
        cps = ContestProblem.objects.filter(contest=contest).select_related("problem")
        serializer = ContestProblemInlineSerializer(cps, many=True)
        return success_response(data={"results": serializer.data})

    def post(self, request, pk):
        contest, err = self._get_contest(request, pk)
        if err:
            return err
        serializer = AddProblemToContestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid data.", details=serializer.errors, status_code=400
            )
        try:
            problem = Problem.objects.get(pk=serializer.validated_data["problem_id"])
        except Problem.DoesNotExist:
            return error_response(message="Problem not found.", status_code=404)

        cp, created = ContestProblem.objects.update_or_create(
            contest=contest,
            problem=problem,
            defaults={
                "order": serializer.validated_data["order"],
                "points": serializer.validated_data["points"],
            },
        )
        from .serializers import ContestProblemInlineSerializer
        return success_response(
            data=ContestProblemInlineSerializer(cp).data,
            message="Problem added to contest." if created else "Problem updated in contest.",
            status_code=status.HTTP_201_CREATED if created else 200,
        )


class OrgContestRemoveProblemView(APIView):
    """DELETE /api/v1/organizer/contests/<pk>/problems/<problem_id>/"""

    permission_classes = [IsOrganizer]

    def delete(self, request, pk, problem_id):
        try:
            contest = Contest.objects.get(pk=pk)
        except Contest.DoesNotExist:
            return error_response(message="Contest not found.", status_code=404)
        if contest.created_by != request.user and request.user.role != "admin":
            return error_response(message="Permission denied.", status_code=403)
        deleted, _ = ContestProblem.objects.filter(
            contest=contest, problem_id=problem_id
        ).delete()
        if not deleted:
            return error_response(message="Problem not found in this contest.", status_code=404)
        return success_response(message="Problem removed from contest.")


class GenerateJoinCodeView(APIView):
    """POST /api/v1/organizer/contests/<pk>/generate-code/"""

    permission_classes = [IsOrganizer]

    def post(self, request, pk):
        try:
            contest = Contest.objects.get(pk=pk)
        except Contest.DoesNotExist:
            return error_response(message="Contest not found.", status_code=404)
        if contest.created_by != request.user and request.user.role != "admin":
            return error_response(message="Permission denied.", status_code=403)
        code = contest.generate_join_code()
        return success_response(data={"join_code": code}, message="Join code regenerated.")


# ──────────────────────────────────────────────────────────────────────────────
# Problem Management
# ──────────────────────────────────────────────────────────────────────────────


class OrgProblemListCreateView(APIView):
    """
    GET  /api/v1/organizer/problems/
    POST /api/v1/organizer/problems/
    """

    permission_classes = [IsOrganizer]

    def get(self, request):
        problems = Problem.objects.filter(created_by=request.user).order_by("-created_at")
        serializer = OrgProblemListSerializer(problems, many=True)
        return success_response(data={"results": serializer.data, "count": problems.count()})

    def post(self, request):
        serializer = OrgProblemDetailSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return error_response(
                message="Invalid problem data.", details=serializer.errors, status_code=400
            )
        problem = serializer.save()
        return success_response(
            data=OrgProblemDetailSerializer(problem).data,
            message="Problem created successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class OrgProblemDetailView(APIView):
    """
    GET    /api/v1/organizer/problems/<id>/
    PUT    /api/v1/organizer/problems/<id>/
    DELETE /api/v1/organizer/problems/<id>/
    """

    permission_classes = [IsOrganizer]

    def _get_problem(self, request, pk):
        try:
            problem = Problem.objects.prefetch_related("test_cases").get(pk=pk)
        except Problem.DoesNotExist:
            return None, error_response(message="Problem not found.", status_code=404)
        if problem.created_by != request.user and request.user.role != "admin":
            return None, error_response(message="Permission denied.", status_code=403)
        return problem, None

    def get(self, request, pk):
        problem, err = self._get_problem(request, pk)
        if err:
            return err
        return success_response(data=OrgProblemDetailSerializer(problem).data)

    def put(self, request, pk):
        problem, err = self._get_problem(request, pk)
        if err:
            return err
        serializer = OrgProblemDetailSerializer(
            problem, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return error_response(
                message="Invalid data.", details=serializer.errors, status_code=400
            )
        problem = serializer.save()
        return success_response(
            data=OrgProblemDetailSerializer(problem).data, message="Problem updated."
        )

    def delete(self, request, pk):
        problem, err = self._get_problem(request, pk)
        if err:
            return err
        title = problem.title
        problem.delete()
        return success_response(message=f'Problem "{title}" deleted.')


class OrgProblemTestCasesView(APIView):
    """
    GET  /api/v1/organizer/problems/<id>/test-cases/
    POST /api/v1/organizer/problems/<id>/test-cases/
    """

    permission_classes = [IsOrganizer]

    def _get_problem(self, request, pk):
        try:
            problem = Problem.objects.get(pk=pk)
        except Problem.DoesNotExist:
            return None, error_response(message="Problem not found.", status_code=404)
        if problem.created_by != request.user and request.user.role != "admin":
            return None, error_response(message="Permission denied.", status_code=403)
        return problem, None

    def get(self, request, pk):
        problem, err = self._get_problem(request, pk)
        if err:
            return err
        tcs = problem.test_cases.all()
        return success_response(data=TestCaseSerializer(tcs, many=True).data)

    def post(self, request, pk):
        problem, err = self._get_problem(request, pk)
        if err:
            return err
        serializer = TestCaseSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid data.", details=serializer.errors, status_code=400
            )
        tc = TestCase.objects.create(problem=problem, **serializer.validated_data)
        return success_response(
            data=TestCaseSerializer(tc).data,
            message="Test case added.",
            status_code=status.HTTP_201_CREATED,
        )


class OrgTestCaseDetailView(APIView):
    """
    PUT    /api/v1/organizer/test-cases/<id>/
    DELETE /api/v1/organizer/test-cases/<id>/
    """

    permission_classes = [IsOrganizer]

    def _get_tc(self, request, pk):
        try:
            tc = TestCase.objects.select_related("problem").get(pk=pk)
        except TestCase.DoesNotExist:
            return None, error_response(message="Test case not found.", status_code=404)
        if tc.problem.created_by != request.user and request.user.role != "admin":
            return None, error_response(message="Permission denied.", status_code=403)
        return tc, None

    def put(self, request, pk):
        tc, err = self._get_tc(request, pk)
        if err:
            return err
        serializer = TestCaseSerializer(tc, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Invalid data.", details=serializer.errors, status_code=400
            )
        tc = serializer.save()
        return success_response(data=TestCaseSerializer(tc).data, message="Test case updated.")

    def delete(self, request, pk):
        tc, err = self._get_tc(request, pk)
        if err:
            return err
        tc.delete()
        return success_response(message="Test case deleted.")


# ──────────────────────────────────────────────────────────────────────────────
# Participant Management
# ──────────────────────────────────────────────────────────────────────────────


class OrgParticipantsView(APIView):
    """
    GET /api/v1/organizer/contests/<pk>/participants/
    Returns all participants for a given contest.
    """

    permission_classes = [IsOrganizer]

    def get(self, request, pk):
        try:
            contest = Contest.objects.get(pk=pk)
        except Contest.DoesNotExist:
            return error_response(message="Contest not found.", status_code=404)
        if contest.created_by != request.user and request.user.role != "admin":
            return error_response(message="Permission denied.", status_code=403)

        participations = (
            ContestParticipation.objects.filter(contest=contest)
            .select_related("user")
            .order_by("-score", "penalty")
        )
        serializer = ParticipantSerializer(participations, many=True)
        return success_response(
            data={
                "contest": contest.title,
                "count": participations.count(),
                "results": serializer.data,
            }
        )


class OrgDisqualifyParticipantView(APIView):
    """
    POST /api/v1/organizer/contests/<pk>/participants/<participation_id>/disqualify/
    Disqualify a participant (sets their score to -1 as a marker).
    """

    permission_classes = [IsOrganizer]

    def post(self, request, pk, participation_id):
        try:
            contest = Contest.objects.get(pk=pk)
        except Contest.DoesNotExist:
            return error_response(message="Contest not found.", status_code=404)
        if contest.created_by != request.user and request.user.role != "admin":
            return error_response(message="Permission denied.", status_code=403)

        try:
            participation = ContestParticipation.objects.get(
                id=participation_id, contest=contest
            )
        except ContestParticipation.DoesNotExist:
            return error_response(message="Participation not found.", status_code=404)

        participation.score = -1  # Use -1 as disqualified marker
        participation.save(update_fields=["score"])
        return success_response(
            message=f"User '{participation.user.username}' has been disqualified."
        )


class OrgCategoryListView(APIView):
    """GET /api/v1/organizer/categories/ — list problem categories for dropdowns."""

    permission_classes = [IsOrganizer]

    def get(self, request):
        from apps.problems.models import Category
        categories = Category.objects.all().order_by("name")
        data = [{"id": str(c.id), "name": c.name, "slug": c.slug} for c in categories]
        return success_response(data=data)
