"""Leaderboard - Views."""
import logging

from rest_framework import permissions
from rest_framework.views import APIView

from core.utils.responses import success_response

from apps.leaderboard.models import LeaderboardEntry
from apps.leaderboard.serializers import ContestLeaderboardSerializer, GlobalLeaderboardSerializer

logger = logging.getLogger("apps")


class GlobalLeaderboardView(APIView):
    """GET /api/v1/leaderboard/ — global user rankings by rating."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.accounts.models import User
        from django.db.models import Count, Q

        users = (
            User.objects
            .filter(is_active=True)
            .annotate(
                total_solved=Count(
                    "submissions",
                    filter=Q(submissions__status="accepted"),
                    distinct=True,
                )
            )
            .order_by("-rating", "-total_solved")
        )

        # Pagination
        page_size = int(request.query_params.get("page_size", 50))
        page = int(request.query_params.get("page", 1))
        start = (page - 1) * page_size
        end = start + page_size
        total = users.count()
        paged = users[start:end]

        serializer = GlobalLeaderboardSerializer(paged, many=True)
        return success_response(data={
            "count": total,
            "results": serializer.data,
        })
