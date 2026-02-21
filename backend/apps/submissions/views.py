"""
Submissions - Views
====================
API views for submitting code, viewing results, and polling status.
"""

import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.utils.responses import error_response, success_response

from .models import Submission
from .serializers import (
    SubmissionCreateSerializer,
    SubmissionDetailSerializer,
    SubmissionListSerializer,
)
from .services import SubmissionService

logger = logging.getLogger("apps")


class SubmitCodeView(APIView):
    """
    POST /api/v1/submissions/
    Submit code for judging. Creates a Submission and dispatches to the judge.

    Body: { "problem": "<uuid>", "language": "python", "code": "..." }
    Optional: "contest": "<uuid>" for contest submissions.

    Returns the submission ID immediately; poll GET /submissions/<id>/ for results.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SubmissionCreateSerializer(
            data=request.data, context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        submission = SubmissionService.create_and_judge(
            data=serializer.validated_data,
            user=request.user,
        )

        return success_response(
            {
                "id": str(submission.id),
                "status": submission.status,
                "message": "Submission received. Judging in progress.",
            },
            status_code=status.HTTP_201_CREATED,
        )


class SubmissionDetailView(APIView):
    """
    GET /api/v1/submissions/<uuid:id>/
    Get submission detail (status, results, code).
    Users can only see their own submissions (or admins can see all).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        try:
            submission = Submission.objects.select_related(
                "problem", "user"
            ).get(id=id)
        except Submission.DoesNotExist:
            return error_response("Submission not found.", status.HTTP_404_NOT_FOUND)

        # Only allow the owner or admin to view full details
        if submission.user != request.user and not request.user.is_staff:
            return error_response("Not authorized.", status.HTTP_403_FORBIDDEN)

        serializer = SubmissionDetailSerializer(submission)
        return success_response(serializer.data)


class MySubmissionsView(generics.ListAPIView):
    """
    GET /api/v1/submissions/me/
    List the current user's submissions.
    Optional: ?problem=<uuid> to filter by problem.
    """
    serializer_class = SubmissionListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SubmissionService.get_user_submissions(
            user=self.request.user,
            problem_id=self.request.query_params.get("problem"),
        )


class AllSubmissionsView(generics.ListAPIView):
    """
    GET /api/v1/submissions/all/
    List all submissions (public feed).
    Optional: ?problem=<uuid> to filter by problem.
    """
    serializer_class = SubmissionListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SubmissionService.get_all_submissions(
            problem_id=self.request.query_params.get("problem"),
        )


class SubmissionStatusView(APIView):
    """
    GET /api/v1/submissions/<uuid:id>/status/
    Lightweight endpoint to poll submission status (for polling fallback).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        try:
            submission = Submission.objects.only(
                "id", "status", "test_cases_passed", "total_test_cases",
                "execution_time_ms", "memory_used_kb",
            ).get(id=id)
        except Submission.DoesNotExist:
            return error_response("Submission not found.", status.HTTP_404_NOT_FOUND)

        return success_response({
            "id": str(submission.id),
            "status": submission.status,
            "test_cases_passed": submission.test_cases_passed,
            "total_test_cases": submission.total_test_cases,
            "execution_time_ms": submission.execution_time_ms,
            "memory_used_kb": submission.memory_used_kb,
        })
