"""Contests - Views."""
import logging

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView

from core.utils.responses import error_response, success_response

from .models import Contest, ContestParticipation
from .serializers import (
    ContestDetailSerializer,
    ContestListSerializer,
    ContestParticipationSerializer,
)

logger = logging.getLogger("apps")


class ContestListView(APIView):
    """GET /api/v1/contests/ — list published/upcoming/active/ended contests."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Contest.objects.exclude(status="draft").select_related("created_by").prefetch_related("participations")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = ContestListSerializer(qs, many=True, context={"request": request})
        return success_response(data=serializer.data)


class ContestDetailView(APIView):
    """GET /api/v1/contests/<slug>/ — full contest detail."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        try:
            contest = (
                Contest.objects
                .exclude(status="draft")
                .prefetch_related("participations", "contestproblem_set__problem")
                .select_related("created_by")
                .get(slug=slug)
            )
        except Contest.DoesNotExist:
            return error_response("Contest not found.", status_code=404)
        serializer = ContestDetailSerializer(contest, context={"request": request})
        return success_response(data=serializer.data)


class JoinContestView(APIView):
    """POST /api/v1/contests/<slug>/join/ — join a contest."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        try:
            contest = Contest.objects.get(slug=slug)
        except Contest.DoesNotExist:
            return error_response("Contest not found.", status_code=404)

        # Check if already joined
        if ContestParticipation.objects.filter(contest=contest, user=request.user).exists():
            return error_response("You have already joined this contest.", status_code=400)

        # Private contest requires join_code
        if contest.visibility == "private":
            join_code = request.data.get("join_code", "")
            if not join_code or join_code != contest.join_code:
                return error_response("Invalid join code.", status_code=403)

        # Check max participants
        if contest.max_participants > 0:
            count = contest.participations.count()
            if count >= contest.max_participants:
                return error_response("Contest is full.", status_code=400)

        participation = ContestParticipation.objects.create(
            contest=contest, user=request.user
        )
        serializer = ContestParticipationSerializer(participation)
        return success_response(data=serializer.data, status_code=201)


class ContestLeaderboardView(APIView):
    """GET /api/v1/contests/<slug>/leaderboard/ — per-contest ranking."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        try:
            contest = Contest.objects.get(slug=slug)
        except Contest.DoesNotExist:
            return error_response("Contest not found.", status_code=404)

        participations = (
            ContestParticipation.objects
            .filter(contest=contest)
            .select_related("user")
            .order_by("-score", "penalty")
        )
        serializer = ContestParticipationSerializer(participations, many=True)
        return success_response(data=serializer.data)
