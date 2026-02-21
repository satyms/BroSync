"""
Management command: seed_problems
===================================
Seeds the database with 15 sample problems (5 Easy, 5 Medium, 5 Hard)
covering a range of classic programming topics.

Usage:
    python manage.py seed_problems
    python manage.py seed_problems --clear   # delete existing seeded problems first
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.problems.models import Category, Problem, TestCase

User = get_user_model()

# ---------------------------------------------------------------------------
# Problem definitions
# ---------------------------------------------------------------------------

CATEGORIES = [
    {"name": "Strings",        "slug": "strings"},
    {"name": "Math",           "slug": "math"},
    {"name": "Arrays",         "slug": "arrays"},
    {"name": "Dynamic Programming", "slug": "dynamic-programming"},
    {"name": "Recursion",      "slug": "recursion"},
    {"name": "Sorting",        "slug": "sorting"},
]

PROBLEMS = [
    # ── EASY ─────────────────────────────────────────────────────────────
    {
        "title": "Reverse a String",
        "slug": "reverse-a-string",
        "difficulty": "easy",
        "category_slug": "strings",
        "description": (
            "<p>Given a string <code>S</code>, print the string in reverse order.</p>"
        ),
        "input_format": "A single line containing a string S.",
        "output_format": "Print the reversed string on a single line.",
        "constraints": "1 ≤ |S| ≤ 10^5\nS contains only printable ASCII characters.",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "hello",       "output": "olleh",       "is_sample": True,  "order": 1},
            {"input": "CodeArena",   "output": "anerAedoC",   "is_sample": True,  "order": 2},
            {"input": "abcdefghij",  "output": "jihgfedcba",  "is_sample": False, "order": 3},
            {"input": "racecar",     "output": "racecar",     "is_sample": False, "order": 4},
        ],
    },
    {
        "title": "Sum of Digits",
        "slug": "sum-of-digits",
        "difficulty": "easy",
        "category_slug": "math",
        "description": (
            "<p>Given a non-negative integer <code>N</code>, find the sum of all its digits.</p>"
            "<p><strong>Example:</strong> For N = 1234, the sum is 1+2+3+4 = 10.</p>"
        ),
        "input_format": "A single line containing a non-negative integer N.",
        "output_format": "Print the sum of digits of N.",
        "constraints": "0 ≤ N ≤ 10^18",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "1234",              "output": "10",  "is_sample": True,  "order": 1},
            {"input": "9999",              "output": "36",  "is_sample": True,  "order": 2},
            {"input": "0",                 "output": "0",   "is_sample": False, "order": 3},
            {"input": "999999999999999999","output": "162", "is_sample": False, "order": 4},
        ],
    },
    {
        "title": "Palindrome Check",
        "slug": "palindrome-check",
        "difficulty": "easy",
        "category_slug": "strings",
        "description": (
            "<p>Given a string <code>S</code> (lowercase letters only), determine whether it is a palindrome.</p>"
            "<p>A palindrome reads the same forward and backward.</p>"
        ),
        "input_format": "A single line containing a string S (lowercase letters only, no spaces).",
        "output_format": 'Print "YES" if S is a palindrome, otherwise print "NO".',
        "constraints": "1 ≤ |S| ≤ 10^5",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "racecar",  "output": "YES", "is_sample": True,  "order": 1},
            {"input": "hello",    "output": "NO",  "is_sample": True,  "order": 2},
            {"input": "madam",    "output": "YES", "is_sample": False, "order": 3},
            {"input": "abcba",    "output": "YES", "is_sample": False, "order": 4},
            {"input": "abcd",     "output": "NO",  "is_sample": False, "order": 5},
        ],
    },
    {
        "title": "Count Vowels",
        "slug": "count-vowels",
        "difficulty": "easy",
        "category_slug": "strings",
        "description": (
            "<p>Given a string <code>S</code>, count the number of vowels (a, e, i, o, u — both "
            "uppercase and lowercase).</p>"
        ),
        "input_format": "A single line containing a string S.",
        "output_format": "Print the number of vowels in S.",
        "constraints": "1 ≤ |S| ≤ 10^5",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "Hello World",       "output": "3",  "is_sample": True,  "order": 1},
            {"input": "aeiouAEIOU",        "output": "10", "is_sample": True,  "order": 2},
            {"input": "Python Programming","output": "4",  "is_sample": False, "order": 3},
            {"input": "bcdfg",             "output": "0",  "is_sample": False, "order": 4},
        ],
    },
    {
        "title": "Fibonacci Number",
        "slug": "fibonacci-number",
        "difficulty": "easy",
        "category_slug": "recursion",
        "description": (
            "<p>Given an integer <code>N</code>, print the N-th Fibonacci number.</p>"
            "<p>The Fibonacci sequence is defined as:</p>"
            "<ul>"
            "<li>F(0) = 0</li>"
            "<li>F(1) = 1</li>"
            "<li>F(N) = F(N-1) + F(N-2) for N ≥ 2</li>"
            "</ul>"
        ),
        "input_format": "A single integer N.",
        "output_format": "Print the N-th Fibonacci number.",
        "constraints": "0 ≤ N ≤ 50",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "0",  "output": "0",          "is_sample": True,  "order": 1},
            {"input": "7",  "output": "13",         "is_sample": True,  "order": 2},
            {"input": "10", "output": "55",         "is_sample": False, "order": 3},
            {"input": "50", "output": "12586269025","is_sample": False, "order": 4},
        ],
    },

    # ── MEDIUM ────────────────────────────────────────────────────────────
    {
        "title": "Prime Number Check",
        "slug": "prime-number-check",
        "difficulty": "medium",
        "category_slug": "math",
        "description": (
            "<p>Given <code>T</code> test cases, for each integer <code>N</code>, determine if it is prime.</p>"
            "<p>A prime number is greater than 1 and has no divisors other than 1 and itself.</p>"
        ),
        "input_format": "First line: T (number of test cases).\nNext T lines: one integer N each.",
        "output_format": 'For each N, print "PRIME" if it is prime, else "NOT PRIME".',
        "constraints": "1 ≤ T ≤ 100\n1 ≤ N ≤ 10^9",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "3\n2\n9\n17",       "output": "PRIME\nNOT PRIME\nPRIME", "is_sample": True,  "order": 1},
            {"input": "2\n1\n13",          "output": "NOT PRIME\nPRIME",         "is_sample": True,  "order": 2},
            {"input": "3\n997\n1000\n999999937","output": "PRIME\nNOT PRIME\nPRIME","is_sample": False,"order": 3},
        ],
    },
    {
        "title": "Anagram Check",
        "slug": "anagram-check",
        "difficulty": "medium",
        "category_slug": "strings",
        "description": (
            "<p>Given two strings <code>A</code> and <code>B</code>, determine if they are anagrams of each other.</p>"
            "<p>Two strings are anagrams if one can be formed by rearranging the letters of the other (ignoring case).</p>"
        ),
        "input_format": "Two lines, each containing a string (one word, no spaces).",
        "output_format": 'Print "YES" if the strings are anagrams, else "NO".',
        "constraints": "1 ≤ |A|, |B| ≤ 10^5\nStrings contain only alphabetic characters.",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "listen\nsilent",   "output": "YES", "is_sample": True,  "order": 1},
            {"input": "hello\nworld",     "output": "NO",  "is_sample": True,  "order": 2},
            {"input": "Triangle\nIntegral","output": "YES","is_sample": False, "order": 3},
            {"input": "abc\nabcd",        "output": "NO",  "is_sample": False, "order": 4},
        ],
    },
    {
        "title": "Second Largest Element",
        "slug": "second-largest-element",
        "difficulty": "medium",
        "category_slug": "arrays",
        "description": (
            "<p>Given an array of <code>N</code> distinct integers, find the second largest element.</p>"
        ),
        "input_format": "First line: N (size of array).\nSecond line: N space-separated integers.",
        "output_format": "Print the second largest element.",
        "constraints": "2 ≤ N ≤ 10^5\n-10^9 ≤ A[i] ≤ 10^9\nAll elements are distinct.",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "5\n3 1 4 1 5",        "output": "4",          "is_sample": True,  "order": 1},
            {"input": "3\n10 20 30",          "output": "20",         "is_sample": True,  "order": 2},
            {"input": "6\n-5 -1 -3 -2 -4 -6","output": "-2",         "is_sample": False, "order": 3},
            {"input": "2\n7 3",              "output": "3",           "is_sample": False, "order": 4},
        ],
    },
    {
        "title": "Binary to Decimal",
        "slug": "binary-to-decimal",
        "difficulty": "medium",
        "category_slug": "math",
        "description": (
            "<p>Given a binary string (consisting only of '0' and '1'), convert it to its decimal equivalent.</p>"
        ),
        "input_format": "A single line containing a binary string B.",
        "output_format": "Print the decimal value of B.",
        "constraints": "1 ≤ |B| ≤ 63\nB contains only '0' and '1'.\nThe result fits in a 64-bit signed integer.",
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "1010",             "output": "10",              "is_sample": True,  "order": 1},
            {"input": "11111111",         "output": "255",             "is_sample": True,  "order": 2},
            {"input": "0",               "output": "0",               "is_sample": False, "order": 3},
            {"input": "111111111111111", "output": "32767",           "is_sample": False, "order": 4},
        ],
    },
    {
        "title": "Sort an Array",
        "slug": "sort-an-array",
        "difficulty": "medium",
        "category_slug": "sorting",
        "description": (
            "<p>Given an array of <code>N</code> integers, sort them in non-decreasing order and print the result.</p>"
        ),
        "input_format": "First line: N.\nSecond line: N space-separated integers.",
        "output_format": "Print the sorted array on a single line with elements separated by spaces.",
        "constraints": "1 ≤ N ≤ 10^5\n-10^9 ≤ A[i] ≤ 10^9",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "5\n3 1 4 1 5",          "output": "1 1 3 4 5",           "is_sample": True,  "order": 1},
            {"input": "3\n9 2 7",              "output": "2 7 9",               "is_sample": True,  "order": 2},
            {"input": "6\n-3 0 5 -1 2 -4",    "output": "-4 -3 -1 0 2 5",     "is_sample": False, "order": 3},
            {"input": "1\n42",                "output": "42",                  "is_sample": False, "order": 4},
        ],
    },

    # ── HARD ──────────────────────────────────────────────────────────────
    {
        "title": "Longest Common Subsequence",
        "slug": "longest-common-subsequence",
        "difficulty": "hard",
        "category_slug": "dynamic-programming",
        "description": (
            "<p>Given two strings <code>A</code> and <code>B</code>, find the length of their "
            "<strong>Longest Common Subsequence (LCS)</strong>.</p>"
            "<p>A subsequence is a sequence derived from another by deleting some or no characters "
            "without changing the order of the remaining characters.</p>"
            "<p><strong>Example:</strong> LCS of <code>ABCBDAB</code> and <code>BDCAB</code> is <code>BCAB</code> with length 4.</p>"
        ),
        "input_format": "Two lines, each containing a string.",
        "output_format": "Print the length of the LCS.",
        "constraints": "1 ≤ |A|, |B| ≤ 1000\nStrings contain only uppercase English letters.",
        "time_limit_ms": 3000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "ABCBDAB\nBDCAB",   "output": "4", "is_sample": True,  "order": 1},
            {"input": "AGGTAB\nGXTXAYB",  "output": "4", "is_sample": True,  "order": 2},
            {"input": "ABCDEF\nACE",      "output": "3", "is_sample": False, "order": 3},
            {"input": "AAAAAA\nAA",       "output": "2", "is_sample": False, "order": 4},
        ],
    },
    {
        "title": "0/1 Knapsack",
        "slug": "01-knapsack",
        "difficulty": "hard",
        "category_slug": "dynamic-programming",
        "description": (
            "<p>You are given <code>N</code> items, each with a weight and a value. "
            "You have a knapsack that can carry a maximum weight of <code>W</code>.</p>"
            "<p>Determine the maximum total value you can carry. You may include each item <strong>at most once</strong>.</p>"
        ),
        "input_format": (
            "First line: N W\n"
            "Next N lines: weight_i value_i"
        ),
        "output_format": "Print the maximum total value.",
        "constraints": "1 ≤ N ≤ 1000\n1 ≤ W ≤ 1000\n1 ≤ weight_i, value_i ≤ 1000",
        "time_limit_ms": 3000,
        "memory_limit_mb": 256,
        "test_cases": [
            {
                "input":  "4 8\n2 3\n3 4\n4 5\n5 6",
                "output": "10",
                "is_sample": True, "order": 1,
            },
            {
                "input":  "3 5\n2 3\n3 4\n1 2",
                "output": "7",
                "is_sample": True, "order": 2,
            },
            {
                "input":  "5 10\n2 6\n2 3\n6 5\n5 4\n4 6",
                "output": "15",
                "is_sample": False, "order": 3,
            },
            {
                "input":  "1 1\n2 10",
                "output": "0",
                "is_sample": False, "order": 4,
            },
        ],
    },
    {
        "title": "Longest Increasing Subsequence",
        "slug": "longest-increasing-subsequence",
        "difficulty": "hard",
        "category_slug": "dynamic-programming",
        "description": (
            "<p>Given an array of <code>N</code> integers, find the length of the "
            "<strong>Longest Strictly Increasing Subsequence (LIS)</strong>.</p>"
            "<p>A subsequence is strictly increasing if each element is greater than the previous one.</p>"
        ),
        "input_format": "First line: N.\nSecond line: N space-separated integers.",
        "output_format": "Print the length of the LIS.",
        "constraints": "1 ≤ N ≤ 10^5\n-10^9 ≤ A[i] ≤ 10^9",
        "time_limit_ms": 3000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "8\n10 9 2 5 3 7 101 18", "output": "4", "is_sample": True,  "order": 1},
            {"input": "5\n0 1 0 3 2",            "output": "3", "is_sample": True,  "order": 2},
            {"input": "1\n7",                    "output": "1", "is_sample": False, "order": 3},
            {"input": "6\n5 4 3 2 1 0",          "output": "1", "is_sample": False, "order": 4},
            {"input": "7\n1 2 3 4 5 6 7",        "output": "7", "is_sample": False, "order": 5},
        ],
    },
    {
        "title": "Edit Distance",
        "slug": "edit-distance",
        "difficulty": "hard",
        "category_slug": "dynamic-programming",
        "description": (
            "<p>Given two strings <code>A</code> and <code>B</code>, find the minimum number of operations "
            "required to convert <code>A</code> into <code>B</code>.</p>"
            "<p>Allowed operations:</p>"
            "<ul>"
            "<li><strong>Insert</strong> a character</li>"
            "<li><strong>Delete</strong> a character</li>"
            "<li><strong>Replace</strong> a character</li>"
            "</ul>"
            "<p>This is also known as the <em>Levenshtein Distance</em>.</p>"
        ),
        "input_format": "Two lines, each containing a string.",
        "output_format": "Print the minimum edit distance.",
        "constraints": "0 ≤ |A|, |B| ≤ 1000\nStrings contain only lowercase English letters.",
        "time_limit_ms": 3000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "horse\nros",     "output": "3", "is_sample": True,  "order": 1},
            {"input": "intention\nexecution", "output": "5", "is_sample": True,  "order": 2},
            {"input": "kitten\nsitting", "output": "3", "is_sample": False, "order": 3},
            {"input": "abc\nabc",       "output": "0", "is_sample": False, "order": 4},
            {"input": "\nabc",          "output": "3", "is_sample": False, "order": 5},
        ],
    },
    {
        "title": "Maximum Subarray Sum",
        "slug": "maximum-subarray-sum",
        "difficulty": "hard",
        "category_slug": "dynamic-programming",
        "description": (
            "<p>Given an array of <code>N</code> integers (which may include negative numbers), "
            "find the maximum sum of a contiguous subarray.</p>"
            "<p>This is the classic <strong>Kadane's Algorithm</strong> problem.</p>"
            "<p><strong>Note:</strong> The subarray must contain at least one element.</p>"
        ),
        "input_format": "First line: N.\nSecond line: N space-separated integers.",
        "output_format": "Print the maximum subarray sum.",
        "constraints": "1 ≤ N ≤ 10^5\n-10^4 ≤ A[i] ≤ 10^4",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "9\n-2 1 -3 4 -1 2 1 -5 4", "output": "6",  "is_sample": True,  "order": 1},
            {"input": "5\n1 2 3 4 5",              "output": "15", "is_sample": True,  "order": 2},
            {"input": "4\n-1 -2 -3 -4",            "output": "-1", "is_sample": False, "order": 3},
            {"input": "7\n5 -3 5 -2 5 -3 5",       "output": "12", "is_sample": False, "order": 4},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed 15 sample problems (5 Easy + 5 Medium + 5 Hard) with test cases."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete previously seeded problems before re-seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            slugs = [p["slug"] for p in PROBLEMS]
            deleted, _ = Problem.objects.filter(slug__in=slugs).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing seeded problem(s)."))

        # Get admin user for created_by
        admin = User.objects.filter(is_staff=True).first()

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
                is_published=True,
                created_by=admin,
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
            )
        )
