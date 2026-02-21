"""
Judge - Service Layer
======================
Business logic for post-judgment processing.
"""

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import F

logger = logging.getLogger("judge")


class JudgeService:
    """Handles post-judgment business logic."""

    @staticmethod
    def post_judge(submission):
        """
        Run post-judgment tasks:
        1. Update problem submission stats
        2. Update user stats (if accepted)
        3. Update contest leaderboard (if contest submission)
        4. Broadcast result via WebSocket

        Args:
            submission: The judged Submission instance.
        """
        from apps.submissions.models import Submission

        # 1. Update problem stats
        problem = submission.problem
        problem.total_submissions = F("total_submissions") + 1
        if submission.status == Submission.Status.ACCEPTED:
            problem.accepted_submissions = F("accepted_submissions") + 1
        problem.save(update_fields=["total_submissions", "accepted_submissions"])

        # 2. Update user stats if accepted (and not previously accepted)
        if submission.status == Submission.Status.ACCEPTED:
            # Check if this is the first accepted submission for this problem
            already_accepted = Submission.objects.filter(
                user=submission.user,
                problem=submission.problem,
                status=Submission.Status.ACCEPTED,
            ).exclude(id=submission.id).exists()

            if not already_accepted:
                user = submission.user
                user.problems_solved = F("problems_solved") + 1
                user.save(update_fields=["problems_solved"])

        # 3. Update contest leaderboard
        if submission.contest_id:
            JudgeService._update_contest_leaderboard(submission)

        # 4. Broadcast result via WebSocket
        JudgeService._broadcast_result(submission)

    @staticmethod
    def _update_contest_leaderboard(submission):
        """Update the Redis-backed contest leaderboard."""
        from django.core.cache import cache
        from apps.contests.models import ContestParticipation, ContestProblem
        from apps.submissions.models import Submission

        try:
            participation = ContestParticipation.objects.get(
                contest=submission.contest, user=submission.user,
            )
            contest_problem = ContestProblem.objects.get(
                contest=submission.contest, problem=submission.problem,
            )

            if submission.status == Submission.Status.ACCEPTED:
                participation.score = F("score") + contest_problem.points
                participation.problems_solved = F("problems_solved") + 1
            else:
                # Add penalty for wrong answer
                participation.penalty = (
                    F("penalty") + submission.contest.penalty_time_minutes
                )

            participation.save()

            # Update Redis sorted set for live leaderboard
            redis_key = f"leaderboard:{submission.contest_id}"
            cache.set(
                f"{redis_key}:{submission.user_id}",
                {
                    "user_id": str(submission.user_id),
                    "username": submission.user.username,
                    "score": participation.score,
                    "penalty": participation.penalty,
                },
                timeout=7200,  # 2 hours
            )

            # Broadcast to WebSocket
            JudgeService._broadcast_leaderboard_update(submission.contest_id)

        except Exception as e:
            logger.error(
                "Failed to update contest leaderboard: %s", str(e), exc_info=True,
            )

    @staticmethod
    def _broadcast_leaderboard_update(contest_id):
        """Send leaderboard update to the WebSocket group."""
        channel_layer = get_channel_layer()
        group_name = f"leaderboard_{contest_id}"

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "leaderboard_update",
                "data": {"contest_id": str(contest_id), "action": "refresh"},
            },
        )

    @staticmethod
    def _broadcast_result(submission):
        """Broadcast submission result to the user via notifications."""
        channel_layer = get_channel_layer()
        group_name = f"user_{submission.user_id}"

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "submission_result",
                "data": {
                    "submission_id": str(submission.id),
                    "problem_id": str(submission.problem_id),
                    "status": submission.status,
                    "test_cases_passed": submission.test_cases_passed,
                    "total_test_cases": submission.total_test_cases,
                    "execution_time_ms": submission.execution_time_ms,
                },
            },
        )
