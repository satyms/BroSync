"""
Response Helpers
================
Standardized API response format.
"""

from rest_framework.response import Response


def success_response(data=None, message="Success", status_code=200):
    """
    Return a standardized success response.
    {
        "success": true,
        "message": "...",
        "data": { ... }
    }
    """
    payload = {
        "success": True,
        "message": message,
    }
    if data is not None:
        payload["data"] = data
    return Response(payload, status=status_code)


def error_response(message="An error occurred", code="ERROR", details=None, status_code=400):
    """
    Return a standardized error response.
    {
        "success": false,
        "error": {
            "code": "...",
            "message": "...",
            "details": { ... }
        }
    }
    """
    error = {
        "code": code,
        "message": message,
    }
    if details:
        error["details"] = details
    return Response({"success": False, "error": error}, status=status_code)
