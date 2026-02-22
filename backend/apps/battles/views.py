"""
Battles - REST API Views
=========================
All views are thin: validate input, call services/selectors, return response.

Endpoints:
  POST   /api/v1/battles/request/                 — send a challenge
  POST   /api/v1/battles/request/<id>/respond/    — accept or reject
  GET    /api/v1/battles/request/inbox/           — received pending requests
  GET    /api/v1/battles/<id>/                    — detail of a battle
  GET    /api/v1/battles/my/                      — current user's battles
  POST   /api/v1/battles/<id>/submit/             — submit code during battle
"""

import logging

from rest_framework import permissions, status
from rest_framework.views import APIView

from core.utils.responses import error_response, success_response

from .selectors import (
    get_battle_by_id,
    get_pending_received_requests,
    get_battle_request_for_opponent,
    get_user_battles,
    get_user_battle_history,
)
from .serializers import (
    BattleDetailSerializer,
    BattleListSerializer,
    BattleRequestSerializer,
    BattleSubmitSerializer,
    RespondBattleRequestSerializer,
    SendBattleRequestSerializer,
)
from .services import (
    end_battle,
    respond_to_battle_request,
    score_battle_submission,
    send_battle_request,
)
from apps.judge.local_sandbox import LocalSandbox

logger = logging.getLogger("apps")


class SendBattleRequestView(APIView):
    """POST /api/v1/battles/request/ — challenge another user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendBattleRequestSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return error_response(serializer.errors, status.HTTP_400_BAD_REQUEST)

        opponent   = serializer.context["opponent"]
        difficulty = serializer.validated_data["difficulty"]

        try:
            req = send_battle_request(request.user, opponent, difficulty)
        except ValueError as e:
            return error_response(str(e), status.HTTP_400_BAD_REQUEST)

        return success_response(
            data=BattleRequestSerializer(req).data,
            message="Battle request sent!",
            status_code=status.HTTP_201_CREATED,
        )


class BattleRequestInboxView(APIView):
    """GET /api/v1/battles/request/inbox/ — pending challenges for the logged-in user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        requests = get_pending_received_requests(request.user)
        data = BattleRequestSerializer(requests, many=True).data
        return success_response(data={"results": data, "count": len(data)})


class RespondBattleRequestView(APIView):
    """POST /api/v1/battles/request/<id>/respond/ — accept or reject."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        battle_request = get_battle_request_for_opponent(request_id, request.user)
        if not battle_request:
            return error_response("Request not found or already handled.", status.HTTP_404_NOT_FOUND)

        serializer = RespondBattleRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(serializer.errors, status.HTTP_400_BAD_REQUEST)

        try:
            battle = respond_to_battle_request(
                battle_request,
                accepted=serializer.validated_data["accepted"],
            )
        except ValueError as e:
            return error_response(str(e), status.HTTP_400_BAD_REQUEST)

        if battle:
            return success_response(
                data=BattleDetailSerializer(battle).data,
                message="Battle accepted! Good luck!",
            )
        return success_response(message="Battle request rejected.")


class BattleDetailView(APIView):
    """GET /api/v1/battles/<id>/ — full battle info."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, battle_id):
        battle = get_battle_by_id(battle_id)
        if not battle:
            return error_response("Battle not found.", status.HTTP_404_NOT_FOUND)

        # Only participants can view
        if request.user not in (battle.challenger, battle.opponent):
            return error_response("Forbidden.", status.HTTP_403_FORBIDDEN)

        return success_response(data=BattleDetailSerializer(battle).data)


class MyBattlesView(APIView):
    """GET /api/v1/battles/my/ — list all battles for the current user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import Battle
        battles = (
            Battle.objects
            .filter(challenger=request.user)
            .union(Battle.objects.filter(opponent=request.user))
            .order_by("-created_at")
        )
        data = BattleListSerializer(battles, many=True).data
        return success_response(data={"results": data, "count": len(data)})


class BattleHistoryView(APIView):
    """GET /api/v1/battles/history/ — completed battle log for the current user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = get_user_battle_history(request.user)
        return success_response(data={"results": history, "count": len(history)})


class BattleSubmitView(APIView):
    """
    POST /api/v1/battles/<id>/submit/
    Submit code for a specific problem within a battle (REST fallback).
    The WS consumer is the primary channel; this is a fallback.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, battle_id):
        battle = get_battle_by_id(battle_id)
        if not battle:
            return error_response("Battle not found.", status.HTTP_404_NOT_FOUND)

        if request.user not in (battle.challenger, battle.opponent):
            return error_response("You are not in this battle.", status.HTTP_403_FORBIDDEN)

        if battle.status != battle.Status.ACTIVE:
            return error_response("Battle is not active.", status.HTTP_400_BAD_REQUEST)

        serializer = BattleSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(serializer.errors, status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        problem_id = data["problem_id"]

        # Make sure the problem is part of this battle
        if not battle.problems.filter(id=problem_id).exists():
            return error_response("Problem not in this battle.", status.HTTP_400_BAD_REQUEST)

        # Run code through local sandbox
        try:
            from apps.problems.models import Problem
            problem = Problem.objects.prefetch_related("test_cases").get(id=problem_id)
            sandbox = LocalSandbox()
            result  = sandbox.run(
                code=data["code"],
                language=data["language"],
                test_cases=list(problem.test_cases.all()),
                time_limit_ms=problem.time_limit_ms,
                memory_limit_mb=problem.memory_limit_mb,
            )
        except Exception as exc:
            logger.error("Battle sandbox error: %s", exc)
            return error_response("Code execution failed.", status.HTTP_500_INTERNAL_SERVER_ERROR)

        sub = score_battle_submission(
            battle=battle,
            user=request.user,
            problem_id=problem_id,
            judge_status=result.get("status", "wrong_answer"),
            execution_time_ms=result.get("execution_time_ms"),
            memory_used_kb=result.get("memory_used_kb"),
            language=data["language"],
            code=data["code"],
            error_output=result.get("error", ""),
        )

        from .serializers import BattleSubmissionResultSerializer
        return success_response(
            data=BattleSubmissionResultSerializer(sub).data,
            message=f"{'Accepted! ✓' if sub.status == 'accepted' else 'Wrong answer.'}",
        )
