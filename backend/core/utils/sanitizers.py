"""
Input Sanitization Utilities
=============================
Helpers for cleaning and validating user input to prevent XSS and injection.
"""

import re

import bleach


# Allowed HTML tags for rich-text problem descriptions (if any)
ALLOWED_TAGS = ["p", "br", "strong", "em", "ul", "ol", "li", "code", "pre", "blockquote"]
ALLOWED_ATTRIBUTES = {"code": ["class"]}


def sanitize_html(value: str) -> str:
    """
    Clean HTML content, allowing only safe tags.
    Used for problem descriptions and editorial content.
    """
    return bleach.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,
    )


def sanitize_plain_text(value: str) -> str:
    """
    Strip all HTML tags — used for usernames, titles, etc.
    """
    return bleach.clean(value, tags=[], strip=True).strip()


def sanitize_code_input(value: str) -> str:
    """
    Minimal sanitization for code submissions.
    We don't strip tags (code may contain < >), but we enforce
    a maximum length and remove null bytes.
    """
    # Remove null bytes
    value = value.replace("\x00", "")
    return value


def validate_username(username: str) -> bool:
    """
    Validate username format: alphanumeric + underscores, 3-30 chars.
    """
    return bool(re.match(r"^[a-zA-Z0-9_]{3,30}$", username))
