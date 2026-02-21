"""
Sensitive Data Log Filter
=========================
Filters sensitive information (passwords, tokens, secrets)
from log records before they are emitted.
"""

import logging
import re


class SensitiveDataFilter(logging.Filter):
    """
    Logging filter that redacts sensitive data patterns from log messages.
    Prevents accidental leakage of passwords, tokens, etc. into log files.
    """

    # Patterns to redact (case-insensitive)
    SENSITIVE_PATTERNS = [
        re.compile(r"(password\s*[=:]\s*)\S+", re.IGNORECASE),
        re.compile(r"(token\s*[=:]\s*)\S+", re.IGNORECASE),
        re.compile(r"(secret\s*[=:]\s*)\S+", re.IGNORECASE),
        re.compile(r"(authorization\s*[=:]\s*)\S+", re.IGNORECASE),
        re.compile(r"(api_key\s*[=:]\s*)\S+", re.IGNORECASE),
        re.compile(r"(access_token\s*[=:]\s*)\S+", re.IGNORECASE),
        re.compile(r"(refresh_token\s*[=:]\s*)\S+", re.IGNORECASE),
    ]

    REDACTED = "[REDACTED]"

    def filter(self, record: logging.LogRecord) -> bool:
        """Redact sensitive data in the log message. Always returns True to keep the record."""
        if isinstance(record.msg, str):
            for pattern in self.SENSITIVE_PATTERNS:
                record.msg = pattern.sub(rf"\1{self.REDACTED}", record.msg)

        # Also redact args if present
        if record.args:
            if isinstance(record.args, dict):
                record.args = {
                    k: self.REDACTED if self._is_sensitive_key(k) else v
                    for k, v in record.args.items()
                }
            elif isinstance(record.args, tuple):
                record.args = tuple(
                    self._redact_value(arg) for arg in record.args
                )

        return True

    @staticmethod
    def _is_sensitive_key(key: str) -> bool:
        """Check if a dictionary key name is sensitive."""
        sensitive_keys = {"password", "token", "secret", "api_key", "authorization"}
        return key.lower() in sensitive_keys

    def _redact_value(self, value):
        """Redact a value if it looks like a sensitive string."""
        if isinstance(value, str):
            for pattern in self.SENSITIVE_PATTERNS:
                value = pattern.sub(rf"\1{self.REDACTED}", value)
        return value
