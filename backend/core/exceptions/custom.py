"""
Custom Exceptions
=================
Application-specific exceptions for clean error handling.
"""

from rest_framework import status
from rest_framework.exceptions import APIException


class ServiceUnavailable(APIException):
    """Raised when an external service (Docker, Redis, etc.) is unavailable."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Service temporarily unavailable. Try again shortly."
    default_code = "service_unavailable"


class CodeExecutionError(APIException):
    """Raised when code execution in the sandbox fails."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Code execution failed."
    default_code = "execution_error"


class TimeLimitExceeded(APIException):
    """Raised when code execution exceeds the time limit."""

    status_code = status.HTTP_408_REQUEST_TIMEOUT
    default_detail = "Time limit exceeded."
    default_code = "time_limit_exceeded"


class MemoryLimitExceeded(APIException):
    """Raised when code execution exceeds the memory limit."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Memory limit exceeded."
    default_code = "memory_limit_exceeded"


class ContestNotActive(APIException):
    """Raised when trying to submit to an inactive contest."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This contest is not currently active."
    default_code = "contest_not_active"


class ContestAlreadyJoined(APIException):
    """Raised when a user tries to join a contest they already joined."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "You have already joined this contest."
    default_code = "contest_already_joined"


class SubmissionRateLimited(APIException):
    """Raised when a user submits too frequently."""

    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Too many submissions. Please wait before submitting again."
    default_code = "submission_rate_limited"
