"""Seed 10 coding problems with test cases into each live (active) contest."""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.contests.models import Contest, ContestProblem
from apps.problems.models import Category, Problem, TestCase
from apps.accounts.models import User

creator = User.objects.first()

# ── Categories ──────────────────────────────────────────────────
categories_map = {}
for name, slug in [
    ("Arrays", "arrays"),
    ("Strings", "strings"),
    ("Math", "math"),
    ("Dynamic Programming", "dynamic-programming"),
    ("Trees", "trees"),
    ("Graphs", "graphs"),
    ("Sorting", "sorting"),
    ("Searching", "searching"),
    ("Recursion", "recursion"),
    ("Greedy", "greedy"),
]:
    cat, _ = Category.objects.get_or_create(slug=slug, defaults={"name": name, "slug": slug})
    categories_map[slug] = cat

# ── 20 Problems (10 unique per contest, with some overlap possible) ──
problems_data = [
    # --- Set A: For "Beginner Friendly Contest" ---
    {
        "title": "Two Sum",
        "slug": "two-sum",
        "description": "<h3>Two Sum</h3><p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return the indices of the two numbers that add up to <code>target</code>.</p><p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p><h4>Example</h4><pre>Input: nums = [2, 7, 11, 15], target = 9\nOutput: 0 1</pre>",
        "input_format": "First line: n (size of array)\nSecond line: n space-separated integers\nThird line: target integer",
        "output_format": "Two space-separated indices (0-indexed)",
        "constraints": "2 <= n <= 10^4\n-10^9 <= nums[i] <= 10^9",
        "difficulty": "easy",
        "category": "arrays",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "4\n2 7 11 15\n9", "output": "0 1", "is_sample": True},
            {"input": "3\n3 2 4\n6", "output": "1 2", "is_sample": True},
            {"input": "2\n3 3\n6", "output": "0 1", "is_sample": False},
            {"input": "5\n1 5 3 7 2\n9", "output": "1 3", "is_sample": False},
        ],
    },
    {
        "title": "Reverse String",
        "slug": "reverse-string",
        "description": "<h3>Reverse String</h3><p>Write a function that reverses a string. The input string is given as a single line.</p><h4>Example</h4><pre>Input: hello\nOutput: olleh</pre>",
        "input_format": "A single string s",
        "output_format": "The reversed string",
        "constraints": "1 <= len(s) <= 10^5\ns contains only printable ASCII characters",
        "difficulty": "easy",
        "category": "strings",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "hello", "output": "olleh", "is_sample": True},
            {"input": "world", "output": "dlrow", "is_sample": True},
            {"input": "a", "output": "a", "is_sample": False},
            {"input": "racecar", "output": "racecar", "is_sample": False},
        ],
    },
    {
        "title": "FizzBuzz",
        "slug": "fizzbuzz",
        "description": "<h3>FizzBuzz</h3><p>Given an integer <code>n</code>, print numbers from 1 to n. For multiples of 3, print <code>Fizz</code>; for multiples of 5, print <code>Buzz</code>; for multiples of both, print <code>FizzBuzz</code>.</p><h4>Example</h4><pre>Input: 5\nOutput:\n1\n2\nFizz\n4\nBuzz</pre>",
        "input_format": "A single integer n",
        "output_format": "n lines of output",
        "constraints": "1 <= n <= 10^4",
        "difficulty": "easy",
        "category": "math",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "5", "output": "1\n2\nFizz\n4\nBuzz", "is_sample": True},
            {"input": "15", "output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", "is_sample": True},
            {"input": "1", "output": "1", "is_sample": False},
            {"input": "3", "output": "1\n2\nFizz", "is_sample": False},
        ],
    },
    {
        "title": "Palindrome Check",
        "slug": "palindrome-check",
        "description": "<h3>Palindrome Check</h3><p>Given a string <code>s</code>, determine if it is a palindrome (reads the same forwards and backwards), considering only alphanumeric characters and ignoring case.</p><h4>Example</h4><pre>Input: racecar\nOutput: true</pre>",
        "input_format": "A single string s",
        "output_format": "true or false",
        "constraints": "1 <= len(s) <= 2 * 10^5",
        "difficulty": "easy",
        "category": "strings",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "racecar", "output": "true", "is_sample": True},
            {"input": "hello", "output": "false", "is_sample": True},
            {"input": "A man a plan a canal Panama", "output": "true", "is_sample": False},
            {"input": "ab", "output": "false", "is_sample": False},
        ],
    },
    {
        "title": "Maximum Subarray Sum",
        "slug": "maximum-subarray-sum",
        "description": "<h3>Maximum Subarray Sum</h3><p>Given an integer array <code>nums</code>, find the contiguous subarray (containing at least one number) which has the largest sum and return that sum.</p><h4>Example</h4><pre>Input: 9\n-2 1 -3 4 -1 2 1 -5 4\nOutput: 6</pre><p>Explanation: The subarray [4, -1, 2, 1] has the largest sum = 6.</p>",
        "input_format": "First line: n\nSecond line: n space-separated integers",
        "output_format": "A single integer — the maximum subarray sum",
        "constraints": "1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4",
        "difficulty": "medium",
        "category": "dynamic-programming",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "9\n-2 1 -3 4 -1 2 1 -5 4", "output": "6", "is_sample": True},
            {"input": "1\n1", "output": "1", "is_sample": True},
            {"input": "5\n5 4 -1 7 8", "output": "23", "is_sample": False},
            {"input": "3\n-1 -2 -3", "output": "-1", "is_sample": False},
        ],
    },
    {
        "title": "Fibonacci Number",
        "slug": "fibonacci-number",
        "description": "<h3>Fibonacci Number</h3><p>Given <code>n</code>, compute the n-th Fibonacci number. F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2).</p><h4>Example</h4><pre>Input: 10\nOutput: 55</pre>",
        "input_format": "A single integer n",
        "output_format": "The n-th Fibonacci number",
        "constraints": "0 <= n <= 45",
        "difficulty": "easy",
        "category": "recursion",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "10", "output": "55", "is_sample": True},
            {"input": "0", "output": "0", "is_sample": True},
            {"input": "1", "output": "1", "is_sample": False},
            {"input": "20", "output": "6765", "is_sample": False},
        ],
    },
    {
        "title": "Valid Parentheses",
        "slug": "valid-parentheses",
        "description": "<h3>Valid Parentheses</h3><p>Given a string <code>s</code> containing just the characters <code>(</code>, <code>)</code>, <code>{</code>, <code>}</code>, <code>[</code> and <code>]</code>, determine if the input string is valid.</p><p>An input string is valid if: open brackets are closed by the same type, and in the correct order.</p><h4>Example</h4><pre>Input: ()[]{}\nOutput: true</pre>",
        "input_format": "A single string s",
        "output_format": "true or false",
        "constraints": "1 <= len(s) <= 10^4",
        "difficulty": "easy",
        "category": "strings",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "()[]{}", "output": "true", "is_sample": True},
            {"input": "(]", "output": "false", "is_sample": True},
            {"input": "{[]}", "output": "true", "is_sample": False},
            {"input": "((()))", "output": "true", "is_sample": False},
        ],
    },
    {
        "title": "Merge Sorted Arrays",
        "slug": "merge-sorted-arrays",
        "description": "<h3>Merge Sorted Arrays</h3><p>Given two sorted integer arrays <code>nums1</code> and <code>nums2</code>, merge them into a single sorted array and print it.</p><h4>Example</h4><pre>Input:\n3\n1 3 5\n3\n2 4 6\nOutput: 1 2 3 4 5 6</pre>",
        "input_format": "First line: n\nSecond line: n sorted integers\nThird line: m\nFourth line: m sorted integers",
        "output_format": "Space-separated merged sorted array",
        "constraints": "0 <= n, m <= 10^4",
        "difficulty": "easy",
        "category": "sorting",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "3\n1 3 5\n3\n2 4 6", "output": "1 2 3 4 5 6", "is_sample": True},
            {"input": "1\n1\n0\n", "output": "1", "is_sample": True},
            {"input": "4\n1 2 3 4\n4\n5 6 7 8", "output": "1 2 3 4 5 6 7 8", "is_sample": False},
            {"input": "0\n\n3\n1 2 3", "output": "1 2 3", "is_sample": False},
        ],
    },
    {
        "title": "Count Vowels",
        "slug": "count-vowels",
        "description": "<h3>Count Vowels</h3><p>Given a string, count the number of vowels (a, e, i, o, u — case insensitive).</p><h4>Example</h4><pre>Input: Hello World\nOutput: 3</pre>",
        "input_format": "A single string",
        "output_format": "An integer — count of vowels",
        "constraints": "1 <= len(s) <= 10^5",
        "difficulty": "easy",
        "category": "strings",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "Hello World", "output": "3", "is_sample": True},
            {"input": "aeiou", "output": "5", "is_sample": True},
            {"input": "bcdfg", "output": "0", "is_sample": False},
            {"input": "AEIOU", "output": "5", "is_sample": False},
        ],
    },
    {
        "title": "Binary Search",
        "slug": "binary-search",
        "description": "<h3>Binary Search</h3><p>Given a sorted array of integers and a target value, return the index of the target if found, otherwise return -1.</p><h4>Example</h4><pre>Input:\n5\n-1 0 3 5 9\n9\nOutput: 4</pre>",
        "input_format": "First line: n\nSecond line: n sorted integers\nThird line: target",
        "output_format": "Index of target or -1",
        "constraints": "1 <= n <= 10^4\n-10^4 <= nums[i], target <= 10^4",
        "difficulty": "easy",
        "category": "searching",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "5\n-1 0 3 5 9\n9", "output": "4", "is_sample": True},
            {"input": "5\n-1 0 3 5 9\n2", "output": "-1", "is_sample": True},
            {"input": "1\n5\n5", "output": "0", "is_sample": False},
            {"input": "3\n1 2 3\n4", "output": "-1", "is_sample": False},
        ],
    },
    # --- Set B: For "Data Structures Deep Dive" ---
    {
        "title": "Longest Common Subsequence",
        "slug": "longest-common-subsequence",
        "description": "<h3>Longest Common Subsequence</h3><p>Given two strings <code>text1</code> and <code>text2</code>, return the length of their longest common subsequence.</p><h4>Example</h4><pre>Input:\nabcde\nace\nOutput: 3</pre><p>Explanation: The LCS is \"ace\".</p>",
        "input_format": "First line: string text1\nSecond line: string text2",
        "output_format": "A single integer — length of LCS",
        "constraints": "1 <= len(text1), len(text2) <= 1000",
        "difficulty": "medium",
        "category": "dynamic-programming",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "abcde\nace", "output": "3", "is_sample": True},
            {"input": "abc\nabc", "output": "3", "is_sample": True},
            {"input": "abc\ndef", "output": "0", "is_sample": False},
            {"input": "oxcpqrsvwf\nshmtulqrypy", "output": "2", "is_sample": False},
        ],
    },
    {
        "title": "Level Order Traversal",
        "slug": "level-order-traversal",
        "description": "<h3>Level Order Traversal</h3><p>Given a binary tree as an array (level order with -1 for null nodes), print the level order traversal with each level on a new line.</p><h4>Example</h4><pre>Input: 7\n3 9 20 -1 -1 15 7\nOutput:\n3\n9 20\n15 7</pre>",
        "input_format": "First line: n (number of elements)\nSecond line: n space-separated integers (-1 = null)",
        "output_format": "Level order traversal, each level on a new line",
        "constraints": "1 <= n <= 10^4",
        "difficulty": "medium",
        "category": "trees",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "7\n3 9 20 -1 -1 15 7", "output": "3\n9 20\n15 7", "is_sample": True},
            {"input": "1\n1", "output": "1", "is_sample": True},
            {"input": "3\n1 2 3", "output": "1\n2 3", "is_sample": False},
        ],
    },
    {
        "title": "Graph BFS Shortest Path",
        "slug": "graph-bfs-shortest-path",
        "description": "<h3>Graph BFS Shortest Path</h3><p>Given an unweighted undirected graph with <code>n</code> nodes (0-indexed) and <code>m</code> edges, find the shortest path length from node <code>0</code> to node <code>n-1</code>. If no path exists, return -1.</p><h4>Example</h4><pre>Input:\n4 4\n0 1\n1 2\n2 3\n0 3\nOutput: 1</pre>",
        "input_format": "First line: n m (nodes, edges)\nNext m lines: u v (edge between u and v)",
        "output_format": "Shortest path length from 0 to n-1, or -1",
        "constraints": "2 <= n <= 10^4\n0 <= m <= 10^5",
        "difficulty": "medium",
        "category": "graphs",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "4 4\n0 1\n1 2\n2 3\n0 3", "output": "1", "is_sample": True},
            {"input": "3 2\n0 1\n1 2", "output": "2", "is_sample": True},
            {"input": "4 2\n0 1\n2 3", "output": "-1", "is_sample": False},
        ],
    },
    {
        "title": "Implement Stack using Queues",
        "slug": "stack-using-queues",
        "description": "<h3>Stack using Queues</h3><p>Implement a stack using only queue operations. Process a series of commands: <code>push x</code>, <code>pop</code>, <code>top</code>, <code>empty</code>.</p><h4>Example</h4><pre>Input:\n5\npush 1\npush 2\ntop\npop\nempty\nOutput:\n2\n2\nfalse</pre>",
        "input_format": "First line: n (number of operations)\nNext n lines: operations",
        "output_format": "Output for each top, pop, empty operation on separate lines",
        "constraints": "1 <= n <= 100\n1 <= x <= 9",
        "difficulty": "easy",
        "category": "arrays",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "5\npush 1\npush 2\ntop\npop\nempty", "output": "2\n2\nfalse", "is_sample": True},
            {"input": "3\npush 1\npop\nempty", "output": "1\ntrue", "is_sample": True},
        ],
    },
    {
        "title": "Detect Cycle in Graph",
        "slug": "detect-cycle-in-graph",
        "description": "<h3>Detect Cycle in Graph</h3><p>Given a directed graph with <code>n</code> nodes and <code>m</code> edges, determine if the graph contains a cycle.</p><h4>Example</h4><pre>Input:\n3 3\n0 1\n1 2\n2 0\nOutput: true</pre>",
        "input_format": "First line: n m\nNext m lines: u v (directed edge from u to v)",
        "output_format": "true or false",
        "constraints": "1 <= n <= 10^4\n0 <= m <= 10^5",
        "difficulty": "medium",
        "category": "graphs",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "3 3\n0 1\n1 2\n2 0", "output": "true", "is_sample": True},
            {"input": "3 2\n0 1\n1 2", "output": "false", "is_sample": True},
            {"input": "4 4\n0 1\n1 2\n2 3\n3 1", "output": "true", "is_sample": False},
        ],
    },
    {
        "title": "Invert Binary Tree",
        "slug": "invert-binary-tree",
        "description": "<h3>Invert Binary Tree</h3><p>Given a binary tree as array input (level order, -1 for null), invert it and print the level order traversal of the inverted tree.</p><h4>Example</h4><pre>Input: 7\n4 2 7 1 3 6 9\nOutput: 4 7 2 9 6 3 1</pre>",
        "input_format": "First line: n\nSecond line: n integers (-1 = null)",
        "output_format": "Space-separated level order of inverted tree (exclude nulls at end)",
        "constraints": "0 <= n <= 10^4",
        "difficulty": "easy",
        "category": "trees",
        "time_limit_ms": 1000,
        "memory_limit_mb": 128,
        "test_cases": [
            {"input": "7\n4 2 7 1 3 6 9", "output": "4 7 2 9 6 3 1", "is_sample": True},
            {"input": "3\n2 1 3", "output": "2 3 1", "is_sample": True},
            {"input": "1\n1", "output": "1", "is_sample": False},
        ],
    },
    {
        "title": "Min Heap Operations",
        "slug": "min-heap-operations",
        "description": "<h3>Min Heap Operations</h3><p>Implement a min heap. Process operations: <code>insert x</code>, <code>extractMin</code>, <code>getMin</code>.</p><h4>Example</h4><pre>Input:\n5\ninsert 5\ninsert 3\ngetMin\nextractMin\ngetMin\nOutput:\n3\n3\n5</pre>",
        "input_format": "First line: n\nNext n lines: operations",
        "output_format": "Output for getMin and extractMin on separate lines",
        "constraints": "1 <= n <= 10^4",
        "difficulty": "medium",
        "category": "trees",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "5\ninsert 5\ninsert 3\ngetMin\nextractMin\ngetMin", "output": "3\n3\n5", "is_sample": True},
            {"input": "3\ninsert 1\ninsert 2\nextractMin", "output": "1", "is_sample": True},
        ],
    },
    {
        "title": "Topological Sort",
        "slug": "topological-sort",
        "description": "<h3>Topological Sort</h3><p>Given a directed acyclic graph (DAG) with <code>n</code> nodes and <code>m</code> edges, output a valid topological ordering. If multiple orderings exist, output the lexicographically smallest one.</p><h4>Example</h4><pre>Input:\n4 4\n3 0\n3 1\n0 1\n0 2\nOutput: 3 0 1 2</pre>",
        "input_format": "First line: n m\nNext m lines: u v (directed edge u -> v)",
        "output_format": "Space-separated topological order",
        "constraints": "1 <= n <= 10^4\n0 <= m <= 10^5",
        "difficulty": "medium",
        "category": "graphs",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "4 4\n3 0\n3 1\n0 1\n0 2", "output": "3 0 1 2", "is_sample": True},
            {"input": "3 2\n0 1\n0 2", "output": "0 1 2", "is_sample": True},
            {"input": "2 1\n1 0", "output": "1 0", "is_sample": False},
        ],
    },
    {
        "title": "Coin Change Problem",
        "slug": "coin-change-problem",
        "description": "<h3>Coin Change</h3><p>Given an array of coin denominations and a target amount, return the fewest number of coins needed to make up that amount. If it's not possible, return -1.</p><h4>Example</h4><pre>Input:\n3\n1 2 5\n11\nOutput: 3</pre><p>Explanation: 11 = 5 + 5 + 1</p>",
        "input_format": "First line: n (number of coin types)\nSecond line: n coin denominations\nThird line: target amount",
        "output_format": "Minimum coins needed, or -1",
        "constraints": "1 <= n <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
        "difficulty": "medium",
        "category": "dynamic-programming",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "3\n1 2 5\n11", "output": "3", "is_sample": True},
            {"input": "1\n2\n3", "output": "-1", "is_sample": True},
            {"input": "1\n1\n0", "output": "0", "is_sample": False},
            {"input": "3\n1 5 10\n27", "output": "5", "is_sample": False},
        ],
    },
    {
        "title": "Activity Selection (Greedy)",
        "slug": "activity-selection-greedy",
        "description": "<h3>Activity Selection</h3><p>Given <code>n</code> activities with start and finish times, find the maximum number of activities that can be performed by a single person (a person can only work on one activity at a time).</p><h4>Example</h4><pre>Input:\n4\n1 3\n2 5\n4 7\n1 8\nOutput: 2</pre>",
        "input_format": "First line: n\nNext n lines: start finish",
        "output_format": "Maximum number of non-overlapping activities",
        "constraints": "1 <= n <= 10^5\n0 <= start < finish <= 10^9",
        "difficulty": "medium",
        "category": "greedy",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "test_cases": [
            {"input": "4\n1 3\n2 5\n4 7\n1 8", "output": "2", "is_sample": True},
            {"input": "3\n1 2\n3 4\n5 6", "output": "3", "is_sample": True},
            {"input": "1\n0 1", "output": "1", "is_sample": False},
            {"input": "5\n1 4\n3 5\n0 6\n5 7\n8 9", "output": "3", "is_sample": False},
        ],
    },
]

# Create problems and test cases
problem_objs = {}
for pd in problems_data:
    tc_data = pd.pop("test_cases")
    cat_slug = pd.pop("category")
    pd["category"] = categories_map.get(cat_slug)
    pd["is_published"] = True
    pd["created_by"] = creator

    problem, created = Problem.objects.get_or_create(slug=pd["slug"], defaults=pd)
    if created:
        for idx, tc in enumerate(tc_data):
            TestCase.objects.create(
                problem=problem,
                input_data=tc["input"],
                expected_output=tc["output"],
                is_sample=tc.get("is_sample", False),
                order=idx,
            )
        print(f"  Problem created: {problem.title} [{problem.difficulty}] with {len(tc_data)} test cases")
    else:
        print(f"  Problem exists: {problem.title}")
    problem_objs[problem.slug] = problem


# ── Link problems to active contests ──
set_a_slugs = [
    "two-sum", "reverse-string", "fizzbuzz", "palindrome-check",
    "maximum-subarray-sum", "fibonacci-number", "valid-parentheses",
    "merge-sorted-arrays", "count-vowels", "binary-search",
]
set_b_slugs = [
    "longest-common-subsequence", "level-order-traversal",
    "graph-bfs-shortest-path", "stack-using-queues", "detect-cycle-in-graph",
    "invert-binary-tree", "min-heap-operations", "topological-sort",
    "coin-change-problem", "activity-selection-greedy",
]

points_a = [100, 100, 100, 100, 200, 100, 100, 150, 100, 150]
points_b = [200, 200, 250, 150, 250, 150, 200, 300, 250, 200]

active_contests = Contest.objects.filter(status="active")
print(f"\nFound {active_contests.count()} active contest(s).")

for contest in active_contests:
    # Choose set based on contest slug
    if "beginner" in contest.slug.lower():
        slugs, pts = set_a_slugs, points_a
    elif "data-structure" in contest.slug.lower():
        slugs, pts = set_b_slugs, points_b
    else:
        slugs, pts = set_a_slugs, points_a  # default to set A

    linked = 0
    for idx, (pslug, pt) in enumerate(zip(slugs, pts)):
        problem = problem_objs.get(pslug)
        if not problem:
            continue
        _, created = ContestProblem.objects.get_or_create(
            contest=contest,
            problem=problem,
            defaults={"order": idx, "points": pt},
        )
        if created:
            linked += 1
    print(f"  Contest '{contest.title}': linked {linked} new problems (total: {ContestProblem.objects.filter(contest=contest).count()})")

print("\nDone!")
