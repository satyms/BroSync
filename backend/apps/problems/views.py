"""
Problems - Views
=================
API views for problem listing, detail, categories, and code playground.
"""

import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions.roles import IsAdmin
from core.utils.responses import error_response, success_response

from .models import Category, Problem, TestCase
from .serializers import (
    CategoryCreateSerializer,
    CategorySerializer,
    ProblemCreateSerializer,
    ProblemDetailSerializer,
    ProblemListSerializer,
    RunCodeSerializer,
    TestCaseAdminSerializer,
)
from .services import ProblemService

logger = logging.getLogger("apps")


# ========================================
# PUBLIC VIEWS (Authenticated users)
# ========================================

class ProblemListView(generics.ListAPIView):
    """
    GET /api/v1/problems/
    List all published problems with optional filters:
      ?difficulty=easy|medium|hard
      ?category=arrays
      ?search=two+sum
    """
    serializer_class = ProblemListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProblemService.list_published(filters=self.request.query_params)


class ProblemDetailView(APIView):
    """
    GET /api/v1/problems/<slug>/
    Get full problem detail with sample test cases.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        try:
            problem = ProblemService.get_by_slug(slug)
        except Problem.DoesNotExist:
            return error_response("Problem not found.", status.HTTP_404_NOT_FOUND)

        serializer = ProblemDetailSerializer(problem)
        return success_response(serializer.data)


class CategoryListView(generics.ListAPIView):
    """
    GET /api/v1/problems/categories/
    List all problem categories.
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProblemService.list_categories()


# ========================================
# RUN / PLAYGROUND (Authenticated users)
# ========================================

class RunCodeView(APIView):
    """
    POST /api/v1/problems/run/
    Quick-run code in the sandbox without creating a submission.
    Useful for the code playground / IDE.

    Body: { "language": "python", "code": "print('hi')", "stdin": "" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RunCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.judge.factory import get_sandbox

        try:
            sandbox = get_sandbox()
            result = sandbox.execute(
                language=serializer.validated_data["language"],
                code=serializer.validated_data["code"],
                stdin=serializer.validated_data.get("stdin", ""),
            )
            return success_response(result)

        except Exception as exc:
            logger.warning("Run code error: %s", str(exc))
            return error_response(str(exc), status.HTTP_400_BAD_REQUEST)


# ========================================
# ADMIN VIEWS
# ========================================

class ProblemCreateView(generics.CreateAPIView):
    """
    POST /api/v1/problems/admin/create/
    Admin-only: create a new problem.
    """
    serializer_class = ProblemCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class ProblemUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/v1/problems/admin/<id>/
    Admin-only: update a problem.
    """
    serializer_class = ProblemCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Problem.objects.all()
    lookup_field = "id"


class TestCaseCreateView(APIView):
    """
    POST /api/v1/problems/admin/testcases/
    Admin-only: bulk add test cases.
    Body: { "problem": "<uuid>", "test_cases": [ { "input_data": "...", "expected_output": "...", "is_sample": true, "order": 1 } ] }
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        problem_id = request.data.get("problem")
        test_cases_data = request.data.get("test_cases", [])

        if not problem_id or not test_cases_data:
            return error_response(
                "Both 'problem' and 'test_cases' are required.",
                status.HTTP_400_BAD_REQUEST,
            )

        try:
            problem = Problem.objects.get(id=problem_id)
        except Problem.DoesNotExist:
            return error_response("Problem not found.", status.HTTP_404_NOT_FOUND)

        created = ProblemService.add_test_cases(problem, test_cases_data)
        serializer = TestCaseAdminSerializer(created, many=True)
        return success_response(serializer.data, status_code=status.HTTP_201_CREATED)


class CategoryCreateView(generics.CreateAPIView):
    """
    POST /api/v1/problems/admin/categories/
    Admin-only: create a category.
    """
    serializer_class = CategoryCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
