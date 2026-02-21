"""
Judge - Docker Sandbox Executor
================================
Executes user code inside isolated Docker containers with strict security limits.

Security measures:
- Non-root user inside container (UID 1000)
- Network disabled
- Memory limited (configurable, default 128MB)
- CPU limited (configurable, default 0.5 cores)
- No privilege escalation, all capabilities dropped
- Auto-remove after execution
- Execution timeout (configurable, default 10 seconds)

How it works:
1. User code + stdin are written to a temp directory on the host
2. A fresh Docker container is created with the sandbox image
3. The temp directory is bind-mounted into /sandbox inside the container
4. The container executes the code with stdin piped via the input file
5. stdout/stderr are captured, execution time and memory usage are recorded
6. The container is always force-removed after execution (finally block)
"""

import logging
import os
import shutil
import tempfile
import time

import docker
from django.conf import settings

from core.exceptions.custom import (
    CodeExecutionError,
    MemoryLimitExceeded,
    ServiceUnavailable,
    TimeLimitExceeded,
)

logger = logging.getLogger("judge")

# File names and execution commands per language
LANGUAGE_CONFIG = {
    "python": {
        "filename": "solution.py",
        "command": "python3 /sandbox/solution.py < /sandbox/input.txt",
    },
    "cpp": {
        "filename": "solution.cpp",
        "command": "cd /tmp && cp /sandbox/solution.cpp . && g++ -O2 -std=c++17 -o solution solution.cpp && ./solution < /sandbox/input.txt",
    },
    "java": {
        "filename": "Solution.java",
        "command": "cd /tmp && cp /sandbox/Solution.java . && javac Solution.java && java -cp /tmp Solution < /sandbox/input.txt",
    },
    "javascript": {
        "filename": "solution.js",
        "command": "node /sandbox/solution.js < /sandbox/input.txt",
    },
}


class DockerSandbox:
    """
    Manages secure code execution inside Docker containers.
    Each execution gets a fresh, isolated container that is destroyed after use.
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
        lang_config = LANGUAGE_CONFIG.get(language)
        if not lang_config:
            raise CodeExecutionError(f"Unsupported language: {language}")

        image = self.config["IMAGES"].get(language)
        if not image:
            raise CodeExecutionError(f"No Docker image configured for: {language}")

        container = None
        sandbox_dir = None

        try:
            # 1. Create a temp directory with user code + stdin
            sandbox_dir = tempfile.mkdtemp(prefix="brosync_sandbox_")
            code_file = os.path.join(sandbox_dir, lang_config["filename"])
            input_file = os.path.join(sandbox_dir, "input.txt")

            with open(code_file, "w", encoding="utf-8") as f:
                f.write(code)
            with open(input_file, "w", encoding="utf-8") as f:
                f.write(stdin)

            # Make files readable by sandbox user (UID 1000)
            os.chmod(sandbox_dir, 0o755)
            os.chmod(code_file, 0o644)
            os.chmod(input_file, 0o644)

            start_time = time.monotonic()

            # 2. Run the container with strict security constraints
            container = self.client.containers.run(
                image=image,
                command=["sh", "-c", lang_config["command"]],
                detach=True,
                # Mount code directory as read-only
                volumes={sandbox_dir: {"bind": "/sandbox", "mode": "ro"}},
                # Security: run as non-root user
                user="1000:1000",
                # Security: disable networking
                network_disabled=self.config["NETWORK_DISABLED"],
                # Security: memory limit
                mem_limit=self.config["MEMORY_LIMIT"],
                # Security: CPU limit
                nano_cpus=int(self.config["CPU_LIMIT"] * 1e9),
                # Security: auto-remove disabled (we remove manually after getting logs)
                auto_remove=False,
                # Security: no privileged mode, drop all capabilities
                privileged=False,
                cap_drop=["ALL"],
                # Security: no new privileges
                security_opt=["no-new-privileges"],
                # Writable /tmp for compilation artifacts (C++/Java)
                tmpfs={"/tmp": "size=64M"},
                # Working directory
                working_dir="/sandbox",
                # Labels for tracking/cleanup
                labels={"brosync": "sandbox", "language": language},
            )

            # 3. Wait for container to finish (with timeout)
            timeout_seconds = self.config["TIMEOUT"]
            result = container.wait(timeout=timeout_seconds)
            exit_code = result.get("StatusCode", -1)

            execution_time_ms = int((time.monotonic() - start_time) * 1000)

            # 4. Capture output
            stdout = container.logs(stdout=True, stderr=False).decode(
                "utf-8", errors="replace"
            )
            stderr = container.logs(stdout=False, stderr=True).decode(
                "utf-8", errors="replace"
            )

            # 5. Get peak memory usage
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
            error_msg = str(e).lower()
            if "timed out" in error_msg or "read timeout" in error_msg:
                logger.warning("Execution timeout for %s", language)
                raise TimeLimitExceeded()
            if "oom" in error_msg:
                logger.warning("OOM killed for %s", language)
                raise MemoryLimitExceeded()
            logger.error("Unexpected execution error: %s", str(e), exc_info=True)
            raise CodeExecutionError(f"Execution error: {str(e)}")

        finally:
            # Always cleanup: remove container and temp directory
            if container:
                try:
                    container.remove(force=True)
                except Exception:
                    pass
            if sandbox_dir:
                try:
                    shutil.rmtree(sandbox_dir, ignore_errors=True)
                except Exception:
                    pass

    @staticmethod
    def _get_memory_usage(container) -> int:
        """Get peak memory usage from container stats in KB."""
        try:
            stats = container.stats(stream=False)
            memory_bytes = stats.get("memory_stats", {}).get("max_usage", 0)
            return memory_bytes // 1024
        except Exception:
            return 0

    def verify_images(self) -> dict:
        """
        Check which sandbox images are available locally.
        Returns dict of {language: bool} indicating availability.
        """
        result = {}
        for lang, image_name in self.config["IMAGES"].items():
            try:
                self.client.images.get(image_name)
                result[lang] = True
            except docker.errors.ImageNotFound:
                result[lang] = False
            except Exception:
                result[lang] = False
        return result
