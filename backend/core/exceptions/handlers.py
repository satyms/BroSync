"""
Custom Exception Handlers
=========================
Centralized error handling for consistent API responses.
"""

import logging

from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("core")


def custom_exception_handler(exc, context):
    """
    Override DRF's default exception handler to return consistent
    error response format:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "details": {}  // optional
        }
    }
    """
    # Call DRF's default handler first
    response = exception_handler(exc, context)

    if response is not None:
        error_data = _build_error_response(exc, response)
        response.data = error_data
    else:
        # Unhandled exception — log and return 500
        logger.exception(
            "Unhandled exception in %s",
            context.get("view", "unknown_view"),
            exc_info=exc,
        )
        error_data = {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            },
        }
        response = Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response


def _build_error_response(exc, response):
    """Build a structured error response dict from the exception."""
    error_code = _get_error_code(exc)
    message = _get_error_message(exc)

    error_response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
        },
    }

    # Include field-level validation details
    if isinstance(exc, ValidationError) and isinstance(exc.detail, dict):
        error_response["error"]["details"] = exc.detail

    return error_response


def _get_error_code(exc):
    """Map exception type to a human-readable error code."""
    code_map = {
        ValidationError: "VALIDATION_ERROR",
        AuthenticationFailed: "AUTHENTICATION_FAILED",
        NotAuthenticated: "NOT_AUTHENTICATED",
        PermissionDenied: "PERMISSION_DENIED",
    }
    return code_map.get(type(exc), "ERROR")


def _get_error_message(exc):
    """Extract a readable message from the exception."""
    if isinstance(exc, ValidationError):
        if isinstance(exc.detail, list):
            return exc.detail[0] if exc.detail else "Validation error."
        if isinstance(exc.detail, dict):
            return "One or more fields failed validation."
        return str(exc.detail)
    if hasattr(exc, "detail"):
        return str(exc.detail)
    return str(exc)
