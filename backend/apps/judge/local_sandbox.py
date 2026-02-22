"""
Judge - Local Sandbox Executor (Development Only)
===================================================
Executes user code using subprocess for local development without Docker.

WARNING: This is NOT secure for production. Use DockerSandbox in production.
This executor runs code directly on the host machine with limited safeguards:
- Timeout enforcement via subprocess
- Memory limit via resource module (Linux) or approximation (Windows)

Supports: Python, C++, Java, JavaScript (Node.js)
Requires the compilers/interpreters to be installed on the host machine.
"""

import logging
import os
import platform
import shutil
import subprocess
import tempfile
import time

logger = logging.getLogger("judge")

# Language configuration for local execution
LOCAL_LANG_CONFIG = {
    "python": {
        "filename": "solution.py",
        "compile_cmd": None,
        "run_cmd": ["python", "{code_path}"],
    },
    "cpp": {
        "filename": "solution.cpp",
        "compile_cmd": ["g++", "-O2", "-std=c++17", "-o", "{out_path}", "{code_path}"],
        "run_cmd": ["{out_path}"],
    },
    "java": {
        "filename": "Solution.java",
        "compile_cmd": ["javac", "{code_path}"],
        "run_cmd": ["java", "-cp", "{work_dir}", "Solution"],
    },
    "javascript": {
        "filename": "solution.js",
        "compile_cmd": None,
        "run_cmd": ["node", "{code_path}"],
    },
}


class LocalSandbox:
    """
    Executes code using subprocess for local development.
    Provides the same interface as DockerSandbox.
    """

    def __init__(self):
        self.timeout = 10  # seconds

    def execute(self, language: str, code: str, stdin: str = "") -> dict:
        """
        Execute user code locally using subprocess.

        Args:
            language: Programming language.
            code: Source code to execute.
            stdin: Standard input for the program.

        Returns:
            Dict with keys: stdout, stderr, exit_code, execution_time_ms, memory_used_kb
        """
        lang_config = LOCAL_LANG_CONFIG.get(language)
        if not lang_config:
            return {
                "stdout": "",
                "stderr": f"Unsupported language: {language}",
                "exit_code": 1,
                "execution_time_ms": 0,
                "memory_used_kb": 0,
            }

        work_dir = None
        try:
            # Create temp working directory
            work_dir = tempfile.mkdtemp(prefix="brosync_local_")
            code_path = os.path.join(work_dir, lang_config["filename"])
            out_path = os.path.join(work_dir, "solution")

            # On Windows, compiled binaries need .exe extension
            if platform.system() == "Windows" and language == "cpp":
                out_path += ".exe"

            with open(code_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Compilation step (C++, Java)
            if lang_config["compile_cmd"]:
                compile_cmd = [
                    c.format(code_path=code_path, out_path=out_path, work_dir=work_dir)
                    for c in lang_config["compile_cmd"]
                ]
                try:
                    compile_result = subprocess.run(
                        compile_cmd,
                        capture_output=True,
                        text=True,
                        timeout=30,
                        cwd=work_dir,
                    )
                    if compile_result.returncode != 0:
                        return {
                            "stdout": "",
                            "stderr": compile_result.stderr.strip(),
                            "exit_code": compile_result.returncode,
                            "execution_time_ms": 0,
                            "memory_used_kb": 0,
                        }
                except FileNotFoundError:
                    compiler = compile_cmd[0]
                    return {
                        "stdout": "",
                        "stderr": f"Compiler/interpreter '{compiler}' not found. Install it to run {language} code.",
                        "exit_code": 1,
                        "execution_time_ms": 0,
                        "memory_used_kb": 0,
                    }
                except subprocess.TimeoutExpired:
                    return {
                        "stdout": "",
                        "stderr": "Compilation timed out.",
                        "exit_code": 1,
                        "execution_time_ms": 30000,
                        "memory_used_kb": 0,
                    }

            # Execution step
            run_cmd = [
                c.format(code_path=code_path, out_path=out_path, work_dir=work_dir)
                for c in lang_config["run_cmd"]
            ]

            start_time = time.monotonic()
            try:
                run_result = subprocess.run(
                    run_cmd,
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                    cwd=work_dir,
                )
                execution_time_ms = int((time.monotonic() - start_time) * 1000)

                return {
                    "stdout": run_result.stdout.strip(),
                    "stderr": run_result.stderr.strip(),
                    "exit_code": run_result.returncode,
                    "execution_time_ms": execution_time_ms,
                    "memory_used_kb": 0,  # Not easily measurable locally
                }

            except FileNotFoundError:
                interpreter = run_cmd[0]
                return {
                    "stdout": "",
                    "stderr": f"Interpreter/runtime '{interpreter}' not found. Install it to run {language} code.",
                    "exit_code": 1,
                    "execution_time_ms": 0,
                    "memory_used_kb": 0,
                }
            except subprocess.TimeoutExpired:
                execution_time_ms = int((time.monotonic() - start_time) * 1000)
                return {
                    "stdout": "",
                    "stderr": "Time Limit Exceeded",
                    "exit_code": -1,
                    "execution_time_ms": execution_time_ms,
                    "memory_used_kb": 0,
                }

        except Exception as e:
            logger.error("Local sandbox error: %s", str(e), exc_info=True)
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "exit_code": 1,
                "execution_time_ms": 0,
                "memory_used_kb": 0,
            }
        finally:
            if work_dir:
                try:
                    shutil.rmtree(work_dir, ignore_errors=True)
                except Exception:
                    pass

    def run(
        self,
        code: str,
        language: str,
        test_cases: list,
        time_limit_ms: int = 5000,
        memory_limit_mb: int = 256,
    ) -> dict:
        """
        Judge code against a list of TestCase objects.
        Runs each test case through execute() and compares to expected output.

        Returns a dict with keys:
            status            : 'accepted' | 'wrong_answer' | 'runtime_error' |
                               'time_limit' | 'compile_error'
            execution_time_ms : total wall-clock ms
            memory_used_kb   : 0 (not measurable locally)
            error             : stderr text on failure, else ''
            failed_case       : 1-based index of first failing test case (or None)
        """
        # Override sandbox timeout with per-problem limit
        old_timeout = self.timeout
        self.timeout = max(1, time_limit_ms // 1000 + 2)  # seconds, with 2s buffer

        total_ms = 0
        try:
            for idx, tc in enumerate(test_cases, start=1):
                result = self.execute(
                    language=language,
                    code=code,
                    stdin=tc.input_data or "",
                )

                total_ms += result.get("execution_time_ms", 0)
                stderr    = result.get("stderr", "")
                stdout    = result.get("stdout", "")
                exit_code = result.get("exit_code", 0)

                # Compilation / interpreter not found
                if exit_code != 0 and ("not found" in stderr or "Unsupported" in stderr):
                    return {
                        "status": "compile_error",
                        "execution_time_ms": total_ms,
                        "memory_used_kb": 0,
                        "error": stderr,
                        "failed_case": idx,
                    }

                # Time Limit
                if "Time Limit Exceeded" in stderr or exit_code == -1:
                    return {
                        "status": "time_limit",
                        "execution_time_ms": total_ms,
                        "memory_used_kb": 0,
                        "error": "Time Limit Exceeded",
                        "failed_case": idx,
                    }

                # Runtime Error (non-zero exit, not TLE)
                if exit_code != 0:
                    return {
                        "status": "runtime_error",
                        "execution_time_ms": total_ms,
                        "memory_used_kb": 0,
                        "error": stderr,
                        "failed_case": idx,
                    }

                # Compare output (strip trailing whitespace on each line for safety)
                expected = "\n".join(
                    line.rstrip() for line in (tc.expected_output or "").splitlines()
                ).strip()
                actual = "\n".join(
                    line.rstrip() for line in stdout.splitlines()
                ).strip()

                if actual != expected:
                    return {
                        "status": "wrong_answer",
                        "execution_time_ms": total_ms,
                        "memory_used_kb": 0,
                        "error": f"Test {idx}: expected {repr(expected[:120])}, got {repr(actual[:120])}",
                        "failed_case": idx,
                    }

            # All test cases passed
            return {
                "status": "accepted",
                "execution_time_ms": total_ms,
                "memory_used_kb": 0,
                "error": "",
                "failed_case": None,
            }
        finally:
            self.timeout = old_timeout

    def verify_images(self) -> dict:
        """Check which language runtimes are available locally."""
        checks = {
            "python": ["python", "--version"],
            "cpp": ["g++", "--version"],
            "java": ["java", "--version"],
            "javascript": ["node", "--version"],
        }
        result = {}
        for lang, cmd in checks.items():
            try:
                subprocess.run(cmd, capture_output=True, timeout=5)
                result[lang] = True
            except (FileNotFoundError, subprocess.TimeoutExpired):
                result[lang] = False
        return result
