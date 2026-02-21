"""
Judge - Docker Sandbox Executor
================================
Executes user code inside isolated Docker containers with strict security limits.

Security measures:
- Non-root user inside container
- Network disabled
- Memory limited
- CPU limited
- Read-only filesystem
- Auto-remove after execution
- Execution timeout
"""

import logging
import tempfile
import time
from pathlib import Path

import docker
from django.conf import settings

from core.exceptions.custom import (
    CodeExecutionError,
    MemoryLimitExceeded,
    ServiceUnavailable,
    TimeLimitExceeded,
)

logger = logging.getLogger("judge")


class DockerSandbox:
    """
    Manages secure code execution inside Docker containers.
    Each execution gets a fresh, isolated container.
    """

    def __init__(self):
        """Initialize Docker client."""
        try:
            self.client = docker.from_env()
        except docker.errors.DockerException as e:
            logger.error("Failed to connect to Docker daemon: %s", str(e))
            raise ServiceUnavailable("Docker engine is not available.")

        self.config = settings.DOCKER_SANDBOX

    def execute(self, language: str, code: str, stdin: str = "") -> dict:
        """
        Execute user code in a sandboxed Docker container.

        Args:
            language: Programming language ('python', 'cpp', 'java', 'javascript').
            code: Source code to execute.
            stdin: Standard input for the program.

        Returns:
            Dict with keys: stdout, stderr, exit_code, execution_time_ms, memory_used_kb

        Raises:
            CodeExecutionError: If execution fails.
            TimeLimitExceeded: If execution exceeds time limit.
            MemoryLimitExceeded: If execution exceeds memory limit.
            ServiceUnavailable: If Docker is unavailable.
        """
        image = self.config["IMAGES"].get(language)
        if not image:
            raise CodeExecutionError(f"Unsupported language: {language}")

        container = None
        start_time = time.monotonic()

        try:
            # Write code to a temporary file
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=self._get_extension(language), delete=False
            ) as code_file:
                code_file.write(code)
                code_path = code_file.name

            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".txt", delete=False
            ) as input_file:
                input_file.write(stdin)
                input_path = input_file.name

            # Run the container with strict security constraints
            container = self.client.containers.run(
                image=image,
                command=self._build_command(language),
                detach=True,
                # Security: non-root user
                user="1000:1000",
                # Security: disable networking
                network_disabled=self.config["NETWORK_DISABLED"],
                # Security: memory limit
                mem_limit=self.config["MEMORY_LIMIT"],
                # Security: CPU limit
                nano_cpus=int(self.config["CPU_LIMIT"] * 1e9),
                # Security: read-only filesystem
                read_only=True,
                # Security: temporary writable dirs for execution
                tmpfs={"/tmp": "size=64M,noexec"},
                # Security: auto-remove
                auto_remove=False,
                # Security: no privileged mode, drop all capabilities
                privileged=False,
                cap_drop=["ALL"],
                # Security: no new privileges
                security_opt=["no-new-privileges"],
                # Stdin
                stdin_open=True,
                # Labels for tracking
                labels={"brosync": "sandbox", "language": language},
            )

            # Attach stdin data
            sock = container.attach_socket(params={"stdin": True, "stream": True})
            sock._sock.sendall(stdin.encode("utf-8"))
            sock._sock.close()

            # Wait for completion with timeout
            result = container.wait(timeout=self.config["TIMEOUT"])
            exit_code = result.get("StatusCode", -1)

            # Get output
            stdout = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
            stderr = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")

            execution_time_ms = int((time.monotonic() - start_time) * 1000)

            # Get container stats for memory usage
            memory_used_kb = self._get_memory_usage(container)

            logger.info(
                "Code execution completed: lang=%s exit=%d time=%dms mem=%dKB",
                language, exit_code, execution_time_ms, memory_used_kb,
            )

            return {
                "stdout": stdout.strip(),
                "stderr": stderr.strip(),
                "exit_code": exit_code,
                "execution_time_ms": execution_time_ms,
                "memory_used_kb": memory_used_kb,
            }

        except docker.errors.ContainerError as e:
            logger.warning("Container error: %s", str(e))
            raise CodeExecutionError(f"Execution failed: {str(e)}")

        except Exception as e:
            if "timed out" in str(e).lower() or "read timeout" in str(e).lower():
                logger.warning("Execution timeout for %s", language)
                raise TimeLimitExceeded()
            if "oom" in str(e).lower():
                logger.warning("OOM killed for %s", language)
                raise MemoryLimitExceeded()
            logger.error("Unexpected execution error: %s", str(e), exc_info=True)
            raise CodeExecutionError(f"Execution error: {str(e)}")

        finally:
            # Cleanup: always remove the container
            if container:
                try:
                    container.remove(force=True)
                except Exception:
                    pass
            # Cleanup temp files
            for path in [code_path, input_path]:
                try:
                    Path(path).unlink(missing_ok=True)
                except Exception:
                    pass

    @staticmethod
    def _get_extension(language: str) -> str:
        """Get file extension for the given language."""
        extensions = {
            "python": ".py",
            "cpp": ".cpp",
            "java": ".java",
            "javascript": ".js",
        }
        return extensions.get(language, ".txt")

    @staticmethod
    def _build_command(language: str) -> str:
        """Build execution command for the language."""
        commands = {
            "python": "python3 /tmp/solution.py < /tmp/input.txt",
            "cpp": "cd /tmp && g++ -o solution solution.cpp && ./solution < input.txt",
            "java": "cd /tmp && javac Solution.java && java Solution < input.txt",
            "javascript": "node /tmp/solution.js < /tmp/input.txt",
        }
        return commands.get(language, "echo 'Unsupported language'")

    @staticmethod
    def _get_memory_usage(container) -> int:
        """Get peak memory usage from container stats in KB."""
        try:
            stats = container.stats(stream=False)
            memory_bytes = stats.get("memory_stats", {}).get("max_usage", 0)
            return memory_bytes // 1024
        except Exception:
            return 0
