"""
Proctor - Views
================
Endpoint for webcam frame analysis during contests.
"""

import logging

from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.views import APIView

from apps.contests.models import Contest, ContestParticipation
from core.utils.responses import error_response, success_response

from .services import analyse_frame, decode_base64_frame

logger = logging.getLogger("apps.proctor")

MAX_VIOLATIONS = 5
VIOLATION_CACHE_TTL = 60 * 60 * 6  # 6 hours


def _cache_key(user_id, contest_id, problem_id):
    return f"proctor:violations:{contest_id}:{problem_id}:{user_id}"


def _disqualified_key(user_id, contest_id, problem_id):
    return f"proctor:disqualified:{contest_id}:{problem_id}:{user_id}"


class AnalyzeFrameView(APIView):
    """
    POST /api/v1/proctor/analyze/
    Body: { "frame": "<base64 data-URI>", "contest_id": "<uuid>", "problem_id": "<uuid>" }

    Returns the analysis result and the current violation count.
    If violations exceed MAX_VIOLATIONS the response signals the
    frontend to end the contest for this user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        frame_data = request.data.get("frame")
        contest_id = request.data.get("contest_id")
        problem_id = request.data.get("problem_id", "unknown")

        if not frame_data:
            return error_response("Missing 'frame' field.", status_code=400)
        if not contest_id:
            return error_response("Missing 'contest_id' field.", status_code=400)

        # Validate contest & participation
        try:
            contest = Contest.objects.get(pk=contest_id)
        except Contest.DoesNotExist:
            return error_response("Contest not found.", status_code=404)

        if contest.status != "active":
            return error_response("Contest is not active.", status_code=400)

        if not ContestParticipation.objects.filter(
            contest=contest, user=request.user
        ).exists():
            return error_response("You are not a participant of this contest.", status_code=403)

        # Check if already disqualified
        dq_key = _disqualified_key(request.user.id, contest_id, problem_id)
        if cache.get(dq_key):
            return success_response(data={
                "looking_away": True,
                "violations": MAX_VIOLATIONS,
                "max_violations": MAX_VIOLATIONS,
                "disqualified": True,
                "reason": "already_disqualified",
            })

        # Decode & analyse
        try:
            frame_np = decode_base64_frame(frame_data)
        except Exception as exc:
            logger.warning("Failed to decode frame: %s", exc)
            return error_response("Invalid frame data.", status_code=400)

        result = analyse_frame(frame_np)

        # Track violations in cache (per problem)
        viol_key = _cache_key(request.user.id, contest_id, problem_id)
        violations = cache.get(viol_key, 0)

        if result["looking_away"]:
            violations += 1
            cache.set(viol_key, violations, VIOLATION_CACHE_TTL)

        disqualified = violations >= MAX_VIOLATIONS
        if disqualified:
            cache.set(dq_key, True, VIOLATION_CACHE_TTL)

        return success_response(data={
            "looking_away": result["looking_away"],
            "confidence": result["confidence"],
            "reason": result["reason"],
            "violations": violations,
            "max_violations": MAX_VIOLATIONS,
            "disqualified": disqualified,
        })


class ViolationStatusView(APIView):
    """
    GET /api/v1/proctor/status/?contest_id=<uuid>&problem_id=<uuid>

    Returns the current violation count without sending a frame.
    Useful for reconnection / page refresh.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        contest_id = request.query_params.get("contest_id")
        problem_id = request.query_params.get("problem_id", "unknown")
        if not contest_id:
            return error_response("Missing 'contest_id' param.", status_code=400)

        viol_key = _cache_key(request.user.id, contest_id, problem_id)
        dq_key = _disqualified_key(request.user.id, contest_id, problem_id)
        violations = cache.get(viol_key, 0)
        disqualified = bool(cache.get(dq_key))

        return success_response(data={
            "violations": violations,
            "max_violations": MAX_VIOLATIONS,
            "disqualified": disqualified,
        })
