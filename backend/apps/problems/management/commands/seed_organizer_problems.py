"""
Management command: seed_organizer_problems
=============================================
Seeds 12 problems attributed to a specific organizer user so they appear
in the Organizer Panel → Problem Bank.

Usage:
    python manage.py seed_organizer_problems
    python manage.py seed_organizer_problems --username mandy_012
    python manage.py seed_organizer_problems --clear
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.problems.models import Category, Problem, TestCase

User = get_user_model()

CATEGORIES = [
    {"name": "Arrays",              "slug": "arrays"},
    {"name": "Strings",             "slug": "strings"},
    {"name": "Math",                "slug": "math"},
    {"name": "Dynamic Programming", "slug": "dynamic-programming"},
    {"name": "Graphs",              "slug": "graphs"},
    {"name": "Sorting",             "slug": "sorting"},
    {"name": "Two Pointers",        "slug": "two-pointers"},
    {"name": "Stack",               "slug": "stack"},
    {"name": "Binary Search",       "slug": "binary-search"},
    {"name": "Greedy",              "slug": "greedy"},
]

PROBLEMS = [
    # ── EASY ──────────────────────────────────────────────────────────────

    {
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "easy",
        "category_slug": "arrays",
        "description": (
            "<p>Given an array of <code>N</code> integers and a target value <code>K</code>, "
            "find the indices of the two numbers that add up to <code>K</code>.</p>"
            "<p>You may assume there is exactly one solution, and you may not use the same element twice.</p>"
            "<p><strong>Example:</strong> For array <code>[2, 7, 11, 15]</code> and K = 9, "
            "the answer is <code>0 1</code> (because 2 + 7 = 9).</p>"
        ),
        "input_format": "First line: N K\nSecond line: N space-separated integers.",
        "output_format": "Print two space-separated 0-based indices i j (i < j) such that A[i] + A[j] = K.",
        "constraints": "2 ≤ N ≤ 10^4\n-10^9 ≤ A[i] ≤ 10^9\n-2×10^9 ≤ K ≤ 2×10^9\nExactly one solution exists.",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "4 9\n2 7 11 15",        "output": "0 1", "is_sample": True,  "order": 1},
            {"input": "3 6\n3 2 4",            "output": "1 2", "is_sample": True,  "order": 2},
            {"input": "5 10\n1 3 5 7 9",       "output": "1 4", "is_sample": False, "order": 3},
            {"input": "2 -1\n-3 2",            "output": "0 1", "is_sample": False, "order": 4},
        ],
    },

    {
        "title": "Maximum Element in Array",
        "slug": "maximum-element-in-array",
        "difficulty": "easy",
        "category_slug": "arrays",
        "description": (
            "<p>Given an array of <code>N</code> integers, find the maximum element.</p>"
        ),
        "input_format": "First line: N.\nSecond line: N space-separated integers.",
        "output_format": "Print the maximum element.",
        "constraints": "1 ≤ N ≤ 10^6\n-10^9 ≤ A[i] ≤ 10^9",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "5\n3 1 4 1 5",          "output": "5",           "is_sample": True,  "order": 1},
            {"input": "4\n-1 -5 -2 -8",        "output": "-1",          "is_sample": True,  "order": 2},
            {"input": "1\n42",                 "output": "42",          "is_sample": False, "order": 3},
            {"input": "6\n0 100 -100 50 50 99","output": "100",         "is_sample": False, "order": 4},
        ],
    },

    {
        "title": "GCD and LCM",
        "slug": "gcd-and-lcm",
        "difficulty": "easy",
        "category_slug": "math",
        "description": (
            "<p>Given two positive integers <code>A</code> and <code>B</code>, "
            "compute their <strong>GCD</strong> (Greatest Common Divisor) and "
            "<strong>LCM</strong> (Least Common Multiple).</p>"
            "<p>Recall: LCM(A, B) = (A × B) / GCD(A, B)</p>"
        ),
        "input_format": "A single line containing two integers A and B.",
        "output_format": "Print GCD and LCM on the same line, separated by a space.",
        "constraints": "1 ≤ A, B ≤ 10^9",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "12 8",      "output": "4 24",          "is_sample": True,  "order": 1},
            {"input": "7 13",      "output": "1 91",          "is_sample": True,  "order": 2},
            {"input": "100 75",    "output": "25 300",        "is_sample": False, "order": 3},
            {"input": "1000000000 999999999", "output": "1 999999999000000000", "is_sample": False, "order": 4},
        ],
    },

    {
        "title": "Prefix Sum",
        "slug": "prefix-sum",
        "difficulty": "easy",
        "category_slug": "arrays",
        "description": (
            "<p>Given an array of <code>N</code> integers and <code>Q</code> range queries, "
            "answer each query: find the sum of elements from index <code>L</code> to <code>R</code> (0-indexed, inclusive).</p>"
            "<p>Use prefix sums to answer each query in O(1).</p>"
        ),
        "input_format": (
            "First line: N Q\n"
            "Second line: N space-separated integers.\n"
            "Next Q lines: two integers L R each."
        ),
        "output_format": "For each query, print the sum on a separate line.",
        "constraints": "1 ≤ N ≤ 10^5\n1 ≤ Q ≤ 10^5\n0 ≤ L ≤ R < N\n-10^4 ≤ A[i] ≤ 10^4",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {
                "input":  "5 3\n1 2 3 4 5\n0 2\n1 3\n0 4",
                "output": "6\n9\n15",
                "is_sample": True,  "order": 1,
            },
            {
                "input":  "4 2\n-1 2 -3 4\n0 3\n1 2",
                "output": "2\n-1",
                "is_sample": True,  "order": 2,
            },
            {
                "input":  "3 1\n10 20 30\n0 2",
                "output": "60",
                "is_sample": False, "order": 3,
            },
        ],
    },

    # ── MEDIUM ────────────────────────────────────────────────────────────

    {
        "title": "Valid Parentheses",
        "slug": "valid-parentheses",
        "difficulty": "medium",
        "category_slug": "stack",
        "description": (
            "<p>Given a string containing only the characters <code>'('</code>, <code>')'</code>, "
            "<code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, "
            "determine if the input string is <strong>valid</strong>.</p>"
            "<p>A string is valid if:</p>"
            "<ul>"
            "<li>Open brackets must be closed by the same type of bracket.</li>"
            "<li>Open brackets must be closed in the correct order.</li>"
            "<li>Every close bracket has a corresponding open bracket.</li>"
            "</ul>"
        ),
        "input_format": "A single line containing a string S.",
        "output_format": 'Print "YES" if valid, else "NO".',
        "constraints": "1 ≤ |S| ≤ 10^4\nS contains only '(', ')', '{', '}', '[', ']'.",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "()",          "output": "YES", "is_sample": True,  "order": 1},
            {"input": "()[{}]",      "output": "YES", "is_sample": True,  "order": 2},
            {"input": "(]",          "output": "NO",  "is_sample": True,  "order": 3},
            {"input": "([)]",        "output": "NO",  "is_sample": False, "order": 4},
            {"input": "{[]}",        "output": "YES", "is_sample": False, "order": 5},
            {"input": "(((",         "output": "NO",  "is_sample": False, "order": 6},
        ],
    },

    {
        "title": "Binary Search",
        "slug": "binary-search",
        "difficulty": "medium",
        "category_slug": "binary-search",
        "description": (
            "<p>Given a sorted array of <code>N</code> distinct integers and a target value <code>K</code>, "
            "find the index of <code>K</code> in the array.</p>"
            "<p>If <code>K</code> is not present, print <code>-1</code>.</p>"
            "<p>Your solution must run in <strong>O(log N)</strong> time.</p>"
        ),
        "input_format": "First line: N K\nSecond line: N space-separated integers in sorted order.",
        "output_format": "Print the 0-based index of K, or -1 if not found.",
        "constraints": "1 ≤ N ≤ 10^6\n-10^9 ≤ A[i] ≤ 10^9\nAll elements are distinct.",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "5 7\n1 3 5 7 9",        "output": "3",  "is_sample": True,  "order": 1},
            {"input": "5 6\n1 3 5 7 9",        "output": "-1", "is_sample": True,  "order": 2},
            {"input": "3 1\n1 2 3",            "output": "0",  "is_sample": False, "order": 3},
            {"input": "1 999\n999",            "output": "0",  "is_sample": False, "order": 4},
            {"input": "4 -5\n-10 -5 0 5",     "output": "1",  "is_sample": False, "order": 5},
        ],
    },

    {
        "title": "Longest Substring Without Repeating Characters",
        "slug": "longest-substring-no-repeat",
        "difficulty": "medium",
        "category_slug": "two-pointers",
        "description": (
            "<p>Given a string <code>S</code>, find the length of the "
            "<strong>longest substring</strong> without repeating characters.</p>"
            "<p><strong>Example:</strong> For <code>\"abcabcbb\"</code>, the answer is <code>3</code> "
            "(substring <code>\"abc\"</code>).</p>"
        ),
        "input_format": "A single line containing a string S.",
        "output_format": "Print the length of the longest substring without repeating characters.",
        "constraints": "0 ≤ |S| ≤ 10^5\nS contains only printable ASCII characters.",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "abcabcbb",   "output": "3", "is_sample": True,  "order": 1},
            {"input": "bbbbb",      "output": "1", "is_sample": True,  "order": 2},
            {"input": "pwwkew",     "output": "3", "is_sample": True,  "order": 3},
            {"input": "",           "output": "0", "is_sample": False, "order": 4},
            {"input": "dvdf",       "output": "3", "is_sample": False, "order": 5},
        ],
    },

    {
        "title": "Coin Change",
        "slug": "coin-change",
        "difficulty": "medium",
        "category_slug": "dynamic-programming",
        "description": (
            "<p>You are given an array of coin denominations and a target amount <code>S</code>.</p>"
            "<p>Find the <strong>minimum number of coins</strong> needed to make up amount <code>S</code>.</p>"
            "<p>You have an unlimited supply of each coin denomination.</p>"
            "<p>If the amount cannot be made up, print <code>-1</code>.</p>"
        ),
        "input_format": "First line: N S (number of coin types, target sum)\nSecond line: N space-separated coin denominations.",
        "output_format": "Print the minimum number of coins, or -1 if impossible.",
        "constraints": "1 ≤ N ≤ 12\n1 ≤ S ≤ 10^4\n1 ≤ coin[i] ≤ 10^4",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "3 11\n1 5 6",     "output": "2", "is_sample": True,  "order": 1},
            {"input": "3 7\n2 4 6",      "output": "-1","is_sample": True,  "order": 2},
            {"input": "1 0\n1",          "output": "0", "is_sample": False, "order": 3},
            {"input": "3 100\n1 5 10",   "output": "10","is_sample": False, "order": 4},
        ],
    },

    # ── HARD ──────────────────────────────────────────────────────────────

    {
        "title": "Number of Islands",
        "slug": "number-of-islands",
        "difficulty": "hard",
        "category_slug": "graphs",
        "description": (
            "<p>Given a 2D grid of <code>'1'</code> (land) and <code>'0'</code> (water), "
            "count the number of islands.</p>"
            "<p>An island is surrounded by water and is formed by connecting adjacent land cells "
            "horizontally or vertically.</p>"
            "<p>You may assume all four edges of the grid are surrounded by water.</p>"
        ),
        "input_format": (
            "First line: R C (rows and columns).\n"
            "Next R lines: C characters each, either '1' or '0'."
        ),
        "output_format": "Print the total number of islands.",
        "constraints": "1 ≤ R, C ≤ 300\nGrid contains only '0' and '1'.",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {
                "input":  "4 5\n11110\n11010\n11000\n00000",
                "output": "1",
                "is_sample": True,  "order": 1,
            },
            {
                "input":  "4 5\n11000\n11000\n00100\n00011",
                "output": "3",
                "is_sample": True,  "order": 2,
            },
            {
                "input":  "1 1\n1",
                "output": "1",
                "is_sample": False, "order": 3,
            },
            {
                "input":  "2 2\n00\n00",
                "output": "0",
                "is_sample": False, "order": 4,
            },
        ],
    },

    {
        "title": "Trapping Rain Water",
        "slug": "trapping-rain-water",
        "difficulty": "hard",
        "category_slug": "two-pointers",
        "description": (
            "<p>Given <code>N</code> non-negative integers representing the height of bars in an elevation map "
            "(each bar has width 1), compute how much water it can trap after raining.</p>"
            "<p><strong>Example:</strong> Heights <code>[0,1,0,2,1,0,1,3,2,1,2,1]</code> trap <code>6</code> units of water.</p>"
        ),
        "input_format": "First line: N.\nSecond line: N space-separated non-negative integers.",
        "output_format": "Print the total units of water trapped.",
        "constraints": "1 ≤ N ≤ 3×10^4\n0 ≤ height[i] ≤ 10^5",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "12\n0 1 0 2 1 0 1 3 2 1 2 1", "output": "6",  "is_sample": True,  "order": 1},
            {"input": "6\n4 2 0 3 2 5",              "output": "9",  "is_sample": True,  "order": 2},
            {"input": "3\n3 0 3",                    "output": "3",  "is_sample": False, "order": 3},
            {"input": "4\n1 2 3 4",                  "output": "0",  "is_sample": False, "order": 4},
            {"input": "5\n5 4 1 2 3",                "output": "7",  "is_sample": False, "order": 5},
        ],
    },

    {
        "title": "Word Break",
        "slug": "word-break",
        "difficulty": "hard",
        "category_slug": "dynamic-programming",
        "description": (
            "<p>Given a string <code>S</code> and a dictionary of words, determine if <code>S</code> "
            "can be segmented into a space-separated sequence of one or more dictionary words.</p>"
            "<p><strong>Example:</strong> S = <code>\"leetcode\"</code>, dictionary = <code>[\"leet\", \"code\"]</code> → <code>YES</code></p>"
        ),
        "input_format": (
            "First line: the string S.\n"
            "Second line: N (number of words in dictionary).\n"
            "Third line: N space-separated words."
        ),
        "output_format": 'Print "YES" if S can be segmented, else "NO".',
        "constraints": "1 ≤ |S| ≤ 300\n1 ≤ N ≤ 1000\n1 ≤ |word| ≤ 20\nAll strings are lowercase.",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {
                "input":  "leetcode\n2\nleet code",
                "output": "YES",
                "is_sample": True,  "order": 1,
            },
            {
                "input":  "applepenapple\n2\napple pen",
                "output": "YES",
                "is_sample": True,  "order": 2,
            },
            {
                "input":  "catsandog\n5\ncats dog sand and cat",
                "output": "NO",
                "is_sample": False, "order": 3,
            },
            {
                "input":  "hello\n1\nhello",
                "output": "YES",
                "is_sample": False, "order": 4,
            },
        ],
    },

    {
        "title": "Activity Selection",
        "slug": "activity-selection",
        "difficulty": "hard",
        "category_slug": "greedy",
        "description": (
            "<p>Given <code>N</code> activities, each with a start time and finish time, "
            "select the <strong>maximum number of non-overlapping activities</strong>.</p>"
            "<p>Two activities overlap if one starts before the other finishes.</p>"
            "<p>This is the classic <strong>Greedy Activity Selection</strong> problem.</p>"
        ),
        "input_format": (
            "First line: N\n"
            "Next N lines: start_i finish_i (0-indexed time, finish > start)"
        ),
        "output_format": "Print the maximum number of non-overlapping activities.",
        "constraints": "1 ≤ N ≤ 10^5\n0 ≤ start_i < finish_i ≤ 10^9",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {
                "input":  "6\n1 3\n2 5\n3 9\n6 8\n5 7\n8 10",
                "output": "3",
                "is_sample": True,  "order": 1,
            },
            {
                "input":  "3\n1 4\n2 3\n3 5",
                "output": "2",
                "is_sample": True,  "order": 2,
            },
            {
                "input":  "1\n0 100",
                "output": "1",
                "is_sample": False, "order": 3,
            },
            {
                "input":  "4\n1 2\n2 3\n3 4\n4 5",
                "output": "4",
                "is_sample": False, "order": 4,
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed 12 problems attributed to a specific organizer user (for the Organizer Panel)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            type=str,
            default="mandy_012",
            help="Username to assign as problem owner (default: mandy_012).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete previously seeded organizer problems before re-seeding.",
        )
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Mark problems as published (visible on public problems list).",
        )

    def handle(self, *args, **options):
        username = options["username"]

        # Resolve the organizer user
        try:
            organizer = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(
                f"User '{username}' not found. "
                "Create the user first or pass --username <existing_username>."
            ))
            return

        if options["clear"]:
            slugs = [p["slug"] for p in PROBLEMS]
            deleted, _ = Problem.objects.filter(slug__in=slugs, created_by=organizer).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing organizer problem(s)."))

        is_published = options.get("publish", False)

        # Ensure categories exist
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, _ = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={"name": cat_data["name"]},
            )
            cat_map[cat_data["slug"]] = cat

        created = skipped = 0
        for pdata in PROBLEMS:
            if Problem.objects.filter(slug=pdata["slug"]).exists():
                self.stdout.write(f"  skip (exists): {pdata['title']}")
                skipped += 1
                continue

            problem = Problem.objects.create(
                title=pdata["title"],
                slug=pdata["slug"],
                difficulty=pdata["difficulty"],
                category=cat_map.get(pdata.get("category_slug")),
                description=pdata["description"],
                input_format=pdata.get("input_format", ""),
                output_format=pdata.get("output_format", ""),
                constraints=pdata.get("constraints", ""),
                time_limit_ms=pdata.get("time_limit_ms", 2000),
                memory_limit_mb=pdata.get("memory_limit_mb", 256),
                is_published=is_published,
                created_by=organizer,
            )

            test_case_objs = [
                TestCase(
                    problem=problem,
                    input_data=tc["input"],
                    expected_output=tc["output"],
                    is_sample=tc["is_sample"],
                    order=tc["order"],
                )
                for tc in pdata["test_cases"]
            ]
            TestCase.objects.bulk_create(test_case_objs)

            diff_label = {"easy": "🟢", "medium": "🟡", "hard": "🔴"}.get(pdata["difficulty"], "")
            self.stdout.write(
                self.style.SUCCESS(
                    f"  {diff_label} Created: {pdata['title']} ({len(test_case_objs)} test cases)"
                )
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone! Created {created} problems, skipped {skipped} (already exist)."
                f"\n  Owner: {organizer.username} ({organizer.email})"
                f"\n  Published: {is_published}"
            )
        )
