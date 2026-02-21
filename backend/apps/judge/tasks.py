"""
Judge - Celery Tasks
=====================
Async tasks for code execution and result processing.
The judge pipeline:
  1. Receive submission
  2. Execute code in Docker sandbox
  3. Compare output against test cases
  4. Update submission status
  5. Broadcast result via WebSocket
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger("judge")


@shared_task(
    bind=True,
    name="judge.execute_submission",
    max_retries=2,
    default_retry_delay=5,
    acks_late=True,
    reject_on_worker_lost=True,
)
def execute_submission(self, submission_id: str):
    """
    Execute a submission against all test cases.

    Args:
        submission_id: UUID of the Submission to judge.
    """
    from apps.submissions.models import Submission
    from apps.problems.models import TestCase
    from .sandbox import DockerSandbox
    from .services import JudgeService

    try:
        submission = Submission.objects.select_related("problem", "user").get(
            id=submission_id
        )
    except Submission.DoesNotExist:
        logger.error("Submission not found: %s", submission_id)
        return

    # Mark as running
    submission.status = Submission.Status.RUNNING
    submission.save(update_fields=["status"])

    logger.info(
        "Judging submission %s: user=%s problem=%s lang=%s",
        submission_id,
        submission.user.username,
        submission.problem.title,
        submission.language,
    )

    try:
        sandbox = DockerSandbox()
        test_cases = TestCase.objects.filter(problem=submission.problem).order_by("order")
        total = test_cases.count()
        passed = 0
        max_time = 0
        max_memory = 0

        for tc in test_cases:
            result = sandbox.execute(
                language=submission.language,
                code=submission.code,
                stdin=tc.input_data,
            )

            # Track max resource usage
            max_time = max(max_time, result.get("execution_time_ms", 0))
            max_memory = max(max_memory, result.get("memory_used_kb", 0))

            # Compare output
            actual_output = result["stdout"].strip()
            expected_output = tc.expected_output.strip()

            if result["exit_code"] != 0:
                # Runtime or compilation error
                submission.status = (
                    Submission.Status.COMPILATION_ERROR
                    if "compilation" in result.get("stderr", "").lower()
                    else Submission.Status.RUNTIME_ERROR
                )
                submission.error_output = result.get("stderr", "")[:2000]
                break

            if actual_output == expected_output:
                passed += 1
            else:
                submission.status = Submission.Status.WRONG_ANSWER
                break
        else:
            # All test cases passed
            if passed == total:
                submission.status = Submission.Status.ACCEPTED

        # Update submission with results
        submission.test_cases_passed = passed
        submission.total_test_cases = total
        submission.execution_time_ms = max_time
        submission.memory_used_kb = max_memory
        submission.judged_at = timezone.now()
        submission.save()

        # Post-processing: update problem stats, leaderboard, etc.
        JudgeService.post_judge(submission)

        logger.info(
            "Submission %s judged: status=%s passed=%d/%d",
            submission_id, submission.status, passed, total,
        )

    except Exception as exc:
        logger.error(
            "Judge error for submission %s: %s",
            submission_id, str(exc), exc_info=True,
        )
        submission.status = Submission.Status.INTERNAL_ERROR
        submission.error_output = f"Internal judge error: {str(exc)}"[:2000]
        submission.judged_at = timezone.now()
        submission.save()

        # Retry on transient errors
        raise self.retry(exc=exc)
