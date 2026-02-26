"""
Problems - Views
=================
API views for problem listing, detail, categories, and code playground.
"""

import json
import logging
import os

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions.roles import IsAdmin
from core.utils.responses import error_response, success_response

from .models import Category, Problem, TestCase
from .serializers import (
    CategoryCreateSerializer,
    CategorySerializer,
    ProblemCreateSerializer,
    ProblemDetailSerializer,
    ProblemListSerializer,
    RunCodeSerializer,
    TestCaseAdminSerializer,
)
from .services import ProblemService

logger = logging.getLogger("apps")


# ========================================
# PUBLIC VIEWS (Authenticated users)
# ========================================

class ProblemListView(generics.ListAPIView):
    """
    GET /api/v1/problems/
    List all published problems with optional filters:
      ?difficulty=easy|medium|hard
      ?category=arrays
      ?search=two+sum
    """
    serializer_class = ProblemListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProblemService.list_published(filters=self.request.query_params)


class ProblemDetailView(APIView):
    """
    GET /api/v1/problems/<slug>/
    Get full problem detail with sample test cases.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        try:
            problem = ProblemService.get_by_slug(slug)
        except Problem.DoesNotExist:
            return error_response("Problem not found.", status.HTTP_404_NOT_FOUND)

        serializer = ProblemDetailSerializer(problem)
        return success_response(serializer.data)


class ProblemSolversView(APIView):
    """
    GET /api/v1/problems/<slug>/solvers/
    Returns a leaderboard of users who solved this problem.
    Ranked by: who solved it first (earliest accepted submission).
    Each entry includes: rank, username, language, runtime, attempts, solved_at.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        from apps.submissions.models import Submission
        from django.db.models import Min, Count

        try:
            problem = Problem.objects.get(slug=slug, is_published=True)
        except Problem.DoesNotExist:
            return error_response("Problem not found.", status_code=404)

        # Step 1: Per user — find the earliest accepted submission time (max 200 users)
        user_first_solve = (
            Submission.objects
            .filter(problem=problem, status="accepted")
            .values("user_id", "user__username", "user__first_name", "user__last_name")
            .annotate(solved_at=Min("submitted_at"))
            .order_by("solved_at")[:200]
        )

        if not user_first_solve:
            return success_response(data=[])

        user_ids = [e["user_id"] for e in user_first_solve]
        solved_at_map = {e["user_id"]: e["solved_at"] for e in user_first_solve}
        user_info_map = {
            e["user_id"]: {
                "username": e["user__username"],
                "first_name": e["user__first_name"],
                "last_name": e["user__last_name"],
            }
            for e in user_first_solve
        }

        # Step 2: Get language + runtime for each user's first accepted submission
        best_subs = {}
        for sub in (
            Submission.objects
            .filter(problem=problem, status="accepted", user_id__in=user_ids)
            .values("user_id", "language", "execution_time_ms", "submitted_at")
            .order_by("submitted_at")
        ):
            if sub["user_id"] not in best_subs:
                best_subs[sub["user_id"]] = sub

        # Step 3: Total attempts (all submissions) per user for this problem
        attempts_map = {
            e["user_id"]: e["total"]
            for e in Submission.objects
            .filter(problem=problem, user_id__in=user_ids)
            .values("user_id")
            .annotate(total=Count("id"))
        }

        # Build ranked result
        solvers = []
        for rank, uid in enumerate(user_ids, 1):
            info = user_info_map.get(uid, {})
            sub = best_subs.get(uid, {})
            solvers.append({
                "rank": rank,
                "username": info.get("username", ""),
                "first_name": info.get("first_name", ""),
                "last_name": info.get("last_name", ""),
                "language": sub.get("language", ""),
                "execution_time_ms": sub.get("execution_time_ms"),
                "solved_at": solved_at_map.get(uid),
                "attempts": attempts_map.get(uid, 1),
            })

        return success_response(data=solvers)


class CategoryListView(generics.ListAPIView):
    """
    GET /api/v1/problems/categories/
    List all problem categories.
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProblemService.list_categories()


# ========================================
# RUN / PLAYGROUND (Authenticated users)
# ========================================

class RunCodeView(APIView):
    """
    POST /api/v1/problems/run/
    Quick-run code in the sandbox without creating a submission.
    Useful for the code playground / IDE.

    Body: { "language": "python", "code": "print('hi')", "stdin": "" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RunCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.judge.factory import get_sandbox

        try:
            sandbox = get_sandbox()
            result = sandbox.execute(
                language=serializer.validated_data["language"],
                code=serializer.validated_data["code"],
                stdin=serializer.validated_data.get("stdin", ""),
            )
            return success_response(result)

        except Exception as exc:
            logger.warning("Run code error: %s", str(exc))
            return error_response(str(exc), status.HTTP_400_BAD_REQUEST)


# ========================================
# ADMIN VIEWS
# ========================================

class ProblemCreateView(generics.CreateAPIView):
    """
    POST /api/v1/problems/admin/create/
    Admin-only: create a new problem.
    """
    serializer_class = ProblemCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class ProblemUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/v1/problems/admin/<id>/
    Admin-only: update a problem.
    """
    serializer_class = ProblemCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Problem.objects.all()
    lookup_field = "id"


class TestCaseCreateView(APIView):
    """
    POST /api/v1/problems/admin/testcases/
    Admin-only: bulk add test cases.
    Body: { "problem": "<uuid>", "test_cases": [ { "input_data": "...", "expected_output": "...", "is_sample": true, "order": 1 } ] }
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        problem_id = request.data.get("problem")
        test_cases_data = request.data.get("test_cases", [])

        if not problem_id or not test_cases_data:
            return error_response(
                "Both 'problem' and 'test_cases' are required.",
                status.HTTP_400_BAD_REQUEST,
            )

        try:
            problem = Problem.objects.get(id=problem_id)
        except Problem.DoesNotExist:
            return error_response("Problem not found.", status.HTTP_404_NOT_FOUND)

        created = ProblemService.add_test_cases(problem, test_cases_data)
        serializer = TestCaseAdminSerializer(created, many=True)
        return success_response(serializer.data, status_code=status.HTTP_201_CREATED)


class CategoryCreateView(generics.CreateAPIView):
    """
    POST /api/v1/problems/admin/categories/
    Admin-only: create a category.
    """
    serializer_class = CategoryCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class RoadmapView(APIView):
    """
    GET /api/v1/problems/roadmaps/?type=dsa
    Returns the roadmap node tree for the given type (dsa, python, webdev).
    Public endpoint — no auth required.
    """
    permission_classes = [permissions.AllowAny]

    _DATA_FILE = os.path.join(os.path.dirname(__file__), "roadmaps.json")
    _cache: dict | None = None

    @classmethod
    def _load(cls) -> dict:
        # Always re-read from disk so JSON edits are picked up without server restart
        with open(cls._DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    def get(self, request):
        roadmap_type = request.query_params.get("type", "dsa").lower()
        data = self._load()
        if roadmap_type not in data:
            valid = list(data.keys())
            return error_response(
                f"Unknown roadmap type '{roadmap_type}'. Valid types: {valid}",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return success_response(data[roadmap_type])


# ---------------------------------------------------------------------------
# In-memory cache & URL map for W3Schools topic scraping
# ---------------------------------------------------------------------------

_TOPIC_CACHE: dict = {}

TOPIC_URL_MAP: dict = {
    # ── Python ──────────────────────────────────────────────────────────
    "syntax":                   "https://www.w3schools.com/python/python_syntax.asp",
    "variables":                "https://www.w3schools.com/python/python_variables.asp",
    "data types":               "https://www.w3schools.com/python/python_datatypes.asp",
    "type casting":             "https://www.w3schools.com/python/python_casting.asp",
    "exceptions":               "https://www.w3schools.com/python/python_try_except.asp",
    "comments":                 "https://www.w3schools.com/python/python_comments.asp",
    "conditionals":             "https://www.w3schools.com/python/python_conditions.asp",
    "loops":                    "https://www.w3schools.com/python/python_for_loops.asp",
    "functions":                "https://www.w3schools.com/python/python_functions.asp",
    "oop":                      "https://www.w3schools.com/python/python_classes.asp",
    "modules":                  "https://www.w3schools.com/python/python_modules.asp",
    "packages":                 "https://www.w3schools.com/python/python_pip.asp",
    "lists":                    "https://www.w3schools.com/python/python_lists.asp",
    "tuples":                   "https://www.w3schools.com/python/python_tuples.asp",
    "sets":                     "https://www.w3schools.com/python/python_sets.asp",
    "dictionaries":             "https://www.w3schools.com/python/python_dictionaries.asp",
    "stacks":                   "https://www.w3schools.com/dsa/dsa_data_stacks.php",
    "queues":                   "https://www.w3schools.com/dsa/dsa_data_queues.php",
    "recursion":                "https://www.w3schools.com/python/gloss_python_function_recursion.asp",
    "sorting algorithms":       "https://www.w3schools.com/python/python_lists_sort.asp",
    "binary search tree":       "https://www.w3schools.com/dsa/dsa_data_binarysearchtrees.php",
    "searching":                "https://www.w3schools.com/dsa/dsa_algo_linearsearch.php",
    "lambdas":                  "https://www.w3schools.com/python/python_lambda.asp",
    "decorators":               "https://www.w3schools.com/python/python_decorators.asp",
    "iterators":                "https://www.w3schools.com/python/python_iterators.asp",
    "generators":               "https://www.w3schools.com/python/python_generators.asp",
    "list comprehensions":      "https://www.w3schools.com/python/python_lists_comprehension.asp",
    "generator expressions":    "https://www.w3schools.com/python/python_generators.asp",
    "regular expressions":      "https://www.w3schools.com/python/python_regex.asp",
    "context managers":         "https://www.w3schools.com/python/python_file_handling.asp",
    "pip":                      "https://www.w3schools.com/python/python_pip.asp",
    "pypi":                     "https://www.w3schools.com/python/python_pip.asp",
    "virtualenv":               "https://www.w3schools.com/python/python_pip.asp",
    "threading":                "https://www.w3schools.com/python/python_threading.asp",
    "async / await":            "https://www.w3schools.com/python/python_async_functions.asp",
    "asyncio":                  "https://www.w3schools.com/python/python_async_functions.asp",
    "django":                   "https://www.w3schools.com/django/django_intro.php",
    "flask":                    "https://www.w3schools.com/python/python_modules_flask.asp",
    "pytest":                   "https://www.w3schools.com/python/python_try_except.asp",
    "unittest":                 "https://www.w3schools.com/python/python_try_except.asp",
    "docker":                   "https://www.w3schools.com/python/python_getting_started.asp",
    # ── DSA ─────────────────────────────────────────────────────────────
    "arrays":                   "https://www.w3schools.com/dsa/dsa_data_arrays.php",
    "array operations":         "https://www.w3schools.com/dsa/dsa_data_arrays.php",
    "linked lists":             "https://www.w3schools.com/dsa/dsa_data_linkedlists.php",
    "hash maps":                "https://www.w3schools.com/dsa/dsa_data_hashtables.php",
    "hash tables":              "https://www.w3schools.com/dsa/dsa_data_hashtables.php",
    "hash sets":                "https://www.w3schools.com/dsa/dsa_data_sets.php",
    "trees":                    "https://www.w3schools.com/dsa/dsa_data_trees.php",
    "graphs":                   "https://www.w3schools.com/dsa/dsa_data_graphs.php",
    "binary search":            "https://www.w3schools.com/dsa/dsa_algo_binarysearch.php",
    "binary search tree":       "https://www.w3schools.com/dsa/dsa_data_binarysearchtrees.php",
    "bubble sort":              "https://www.w3schools.com/dsa/dsa_algo_bubblesort.php",
    "merge sort":               "https://www.w3schools.com/dsa/dsa_algo_mergesort.php",
    "quick sort":               "https://www.w3schools.com/dsa/dsa_algo_quicksort.php",
    "sorting algorithms":       "https://www.w3schools.com/dsa/dsa_algo_bubblesort.php",
    "dynamic programming":      "https://www.w3schools.com/dsa/dsa_algo_dp.php",
    "greedy algorithms":        "https://www.w3schools.com/dsa/dsa_algo_greedyalgorithms.php",
    "big o notation":           "https://www.w3schools.com/dsa/dsa_timecomplexity_theory.php",
    "time complexity":          "https://www.w3schools.com/dsa/dsa_timecomplexity_theory.php",
    "two pointers":             "https://www.w3schools.com/dsa/dsa_algo_twopointers.php",
    "sliding window":           "https://www.w3schools.com/dsa/dsa_algo_slidingwindow.php",
    "bfs":                      "https://www.w3schools.com/dsa/dsa_algo_graphs_bfs.php",
    "dfs":                      "https://www.w3schools.com/dsa/dsa_algo_graphs_dfs.php",
    "heaps":                    "https://www.w3schools.com/dsa/dsa_data_heaps.php",
    # ── Python OOP ───────────────────────────────────────────────────────
    "classes":                  "https://www.w3schools.com/python/python_classes.asp",
    "inheritance":              "https://www.w3schools.com/python/python_inheritance.asp",
    "methods":                  "https://www.w3schools.com/python/python_classes.asp",
    "dunder methods":           "https://www.w3schools.com/python/python_classes.asp",
    "dataclasses":              "https://www.w3schools.com/python/python_classes.asp",
    "abstract classes":         "https://www.w3schools.com/python/python_classes.asp",
    "hashmaps":                 "https://www.w3schools.com/dsa/dsa_data_hashtables.php",
    "bst":                      "https://www.w3schools.com/dsa/dsa_data_binarysearchtrees.php",
    "basic syntax":             "https://www.w3schools.com/python/python_syntax.asp",
    "variables & data types":   "https://www.w3schools.com/python/python_variables.asp",
    "builtin functions":        "https://www.w3schools.com/python/python_functions.asp",
    "gil":                      "https://www.w3schools.com/python/python_threading.asp",
    "multiprocessing":          "https://www.w3schools.com/python/python_threading.asp",
    "pydantic":                 "https://www.w3schools.com/python/python_classes.asp",
    "mypy":                     "https://www.w3schools.com/python/python_classes.asp",
    "typing module":            "https://www.w3schools.com/python/python_classes.asp",
    "pyproject.toml":           "https://www.w3schools.com/python/python_pip.asp",
    "conda":                    "https://www.w3schools.com/python/python_pip.asp",
    "poetry":                   "https://www.w3schools.com/python/python_pip.asp",
    "pyenv":                    "https://www.w3schools.com/python/python_pip.asp",
    "uv":                       "https://www.w3schools.com/python/python_pip.asp",
    "pipenv":                   "https://www.w3schools.com/python/python_pip.asp",
    "fastapi":                  "https://www.w3schools.com/python/python_modules_flask.asp",
    "flask":                    "https://www.w3schools.com/python/python_modules_flask.asp",
    "ci/cd":                    "https://www.w3schools.com/python/python_getting_started.asp",
    "sphinx":                   "https://www.w3schools.com/python/python_getting_started.asp",
    "logging":                  "https://www.w3schools.com/python/python_getting_started.asp",
    "ruff":                     "https://www.w3schools.com/python/python_getting_started.asp",
    "black":                    "https://www.w3schools.com/python/python_getting_started.asp",
    "code formatting":          "https://www.w3schools.com/python/python_getting_started.asp",
    "mocking":                  "https://www.w3schools.com/python/python_try_except.asp",
    "fixtures":                 "https://www.w3schools.com/python/python_try_except.asp",
    "doctest":                  "https://www.w3schools.com/python/python_try_except.asp",
    "tox":                      "https://www.w3schools.com/python/python_try_except.asp",
    "tornado":                  "https://www.w3schools.com/python/python_modules_flask.asp",
    "sanic":                    "https://www.w3schools.com/python/python_modules_flask.asp",
    "aiohttp":                  "https://www.w3schools.com/python/python_async_functions.asp",
    "pyramid":                  "https://www.w3schools.com/python/python_modules_flask.asp",
    "gevent":                   "https://www.w3schools.com/python/python_threading.asp",
    "pyright":                  "https://www.w3schools.com/python/python_classes.asp",
    "pyre":                     "https://www.w3schools.com/python/python_classes.asp",
    # ── Web Dev ─────────────────────────────────────────────────────────
    "html basics":              "https://www.w3schools.com/html/html_intro.asp",
    "semantic html":            "https://www.w3schools.com/html/html5_semantic_elements.asp",
    "forms & validation":       "https://www.w3schools.com/html/html_forms.asp",
    "css basics":               "https://www.w3schools.com/css/css_intro.asp",
    "flexbox":                  "https://www.w3schools.com/css/css3_flexbox.asp",
    "grid":                     "https://www.w3schools.com/css/css_grid.asp",
    "responsive design":        "https://www.w3schools.com/css/css_rwd_intro.asp",
    "css variables":            "https://www.w3schools.com/css/css3_variables.asp",
    "css animations":           "https://www.w3schools.com/css/css3_animations.asp",
    "dom manipulation":         "https://www.w3schools.com/js/js_htmldom.asp",
    "events":                   "https://www.w3schools.com/js/js_events.asp",
    "fetch api":                "https://www.w3schools.com/js/js_api_fetch.asp",
    "promises":                 "https://www.w3schools.com/js/js_promise.asp",
    "async/await":              "https://www.w3schools.com/js/js_async.asp",
    "es6+ features":            "https://www.w3schools.com/js/js_es6.asp",
    "javascript basics":        "https://www.w3schools.com/js/js_intro.asp",
    "react":                    "https://www.w3schools.com/react/react_intro.asp",
    "node.js":                  "https://www.w3schools.com/nodejs/nodejs_intro.asp",
    "npm":                      "https://www.w3schools.com/nodejs/nodejs_npm.asp",
    "rest api":                 "https://www.w3schools.com/js/js_api_fetch.asp",
    "sql basics":               "https://www.w3schools.com/sql/sql_intro.asp",
    "mongodb":                  "https://www.w3schools.com/mongodb/mongodb_intro.php",
    "typescript basics":        "https://www.w3schools.com/typescript/typescript_intro.php",
}


class TopicLearnView(APIView):
    """
    GET /api/v1/problems/learn/?topic=<name>
    Scrapes W3Schools for the given topic and returns structured content.
    Results are cached in memory for the lifetime of the process.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        topic = request.query_params.get("topic", "").strip()
        if not topic:
            return error_response("'topic' query param is required.", status_code=status.HTTP_400_BAD_REQUEST)

        key = topic.lower()

        # Serve from cache if available
        if key in _TOPIC_CACHE:
            return success_response(_TOPIC_CACHE[key])

        url = TOPIC_URL_MAP.get(key)
        if not url:
            payload = {"title": topic, "url": None, "sections": [], "not_found": True}
            return success_response(payload)

        payload = self._scrape(url, topic)
        _TOPIC_CACHE[key] = payload
        return success_response(payload)

    # ------------------------------------------------------------------
    def _scrape(self, url: str, topic_name: str) -> dict:
        import requests as req
        from bs4 import BeautifulSoup, NavigableString

        try:
            resp = req.get(
                url,
                timeout=10,
                headers={"User-Agent": "Mozilla/5.0 (compatible; BroSync/1.0)"},
            )
            resp.raise_for_status()
        except Exception as exc:
            return {"title": topic_name, "url": url, "sections": [], "not_found": True, "error": str(exc)}

        try:
            soup = BeautifulSoup(resp.text, "html.parser")

            # W3Schools main content area
            main = (
                soup.find("div", id="main")
                or soup.find("div", class_="w3-main")
                or soup.body
            )

            # Page title
            h1 = main.find("h1") if main else None
            title = h1.get_text(strip=True) if h1 else topic_name

            sections: list[dict] = []
            current_section: dict | None = None

            # Add a default section so content before first h2 isn't lost
            current_section = {"heading": "Overview", "items": []}
            sections.append(current_section)

            def _is_code_block(el) -> bool:
                cls = el.get("class", [])
                return any("w3-code" in c or c == "code" for c in cls)

            for el in main.descendants if main else []:
                if isinstance(el, NavigableString):
                    continue
                # Only process direct-ish children (skip deeply nested)
                if el.name == "h2":
                    current_section = {"heading": el.get_text(strip=True), "items": []}
                    sections.append(current_section)
                elif el.name == "h3" and current_section is not None:
                    text = el.get_text(strip=True)
                    if text:
                        current_section["items"].append({"type": "subheading", "content": text})
                elif el.name == "p" and current_section is not None:
                    # Skip paragraphs inside code divs
                    if el.find_parent(class_=lambda c: c and "w3-code" in c):
                        continue
                    text = el.get_text(strip=True)
                    if text and len(text) > 5:
                        current_section["items"].append({"type": "text", "content": text})
                elif el.name == "div" and _is_code_block(el) and current_section is not None:
                    code_text = el.get_text()
                    if code_text.strip():
                        current_section["items"].append({"type": "code", "content": code_text})

            # Drop empty sections
            sections = [s for s in sections if s["items"]]
            return {"title": title, "url": url, "sections": sections, "not_found": False}

        except Exception as exc:
            return {"title": topic_name, "url": url, "sections": [], "not_found": True, "error": str(exc)}
