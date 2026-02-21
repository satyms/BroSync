"""
Judge - Sandbox Factory
========================
Returns the appropriate sandbox executor based on settings.
- Development: LocalSandbox (subprocess-based, no Docker required)
- Production:  DockerSandbox (Docker container isolation)
"""

import logging

from django.conf import settings

logger = logging.getLogger("judge")


def get_sandbox():
    """
    Returns a sandbox instance based on the SANDBOX_BACKEND setting.

    Settings:
        SANDBOX_BACKEND = 'docker'  → DockerSandbox (default, production)
        SANDBOX_BACKEND = 'local'   → LocalSandbox  (development)
    """
    backend = getattr(settings, "SANDBOX_BACKEND", "docker")

    if backend == "local":
        from .local_sandbox import LocalSandbox
        logger.debug("Using LocalSandbox (subprocess) for code execution")
        return LocalSandbox()
    else:
        from .sandbox import DockerSandbox
        logger.debug("Using DockerSandbox for code execution")
        return DockerSandbox()
