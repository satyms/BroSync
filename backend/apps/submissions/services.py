"""
Submissions - Service Layer
=============================
Business logic for submission creation and dispatching to the judge.
"""

import logging

from django.utils import timezone

from .models import Submission

logger = logging.getLogger("apps")


class SubmissionService:
    """Handles submission creation and judge dispatch."""

    @staticmethod
    def create_and_judge(data: dict, user) -> Submission:
        """
        Create a new submission and dispatch it to the Celery judge task.

        Args:
            data: Validated submission data (problem, language, code, contest).
            user: The requesting user.

        Returns:
            The created Submission instance (status=pending).
        """
        from apps.judge.tasks import execute_submission

        submission = Submission.objects.create(
            user=user,
            problem=data["problem"],
            language=data["language"],
            code=data["code"],
            contest=data.get("contest"),
            status=Submission.Status.PENDING,
        )

        logger.info(
            "Submission created: id=%s user=%s problem=%s lang=%s",
            submission.id, user.username, submission.problem.title, submission.language,
        )

        # Dispatch to Celery judge queue
        execute_submission.delay(str(submission.id))

        return submission

    @staticmethod
    def get_user_submissions(user, problem_id=None):
        """Get submissions for a user, optionally filtered by problem."""
        qs = Submission.objects.filter(user=user).select_related("problem")
        if problem_id:
            qs = qs.filter(problem_id=problem_id)
        return qs

    @staticmethod
    def get_all_submissions(problem_id=None):
        """Get all submissions, optionally filtered by problem."""
        qs = Submission.objects.all().select_related("problem", "user")
        if problem_id:
            qs = qs.filter(problem_id=problem_id)
        return qs
