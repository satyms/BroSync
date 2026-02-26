"""Seed 5 coding contests into the database."""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from datetime import timedelta
from django.utils import timezone
from apps.contests.models import Contest
from apps.accounts.models import User

# Get the first user as contest creator (or None)
creator = User.objects.first()

now = timezone.now()

contests_data = [
    {
        "title": "Weekly Code Sprint #1",
        "slug": "weekly-code-sprint-1",
        "description": "A fast-paced weekly contest to sharpen your algorithmic skills. Solve as many problems as you can in 2 hours!",
        "status": Contest.Status.UPCOMING,
        "start_time": now + timedelta(days=2),
        "end_time": now + timedelta(days=2, hours=2),
        "visibility": Contest.Visibility.PUBLIC,
        "penalty_time_minutes": 20,
        "max_participants": 500,
    },
    {
        "title": "BroSync Grand Challenge",
        "slug": "brosync-grand-challenge",
        "description": "The ultimate coding showdown! Compete against the best programmers in a 3-hour marathon of challenging problems.",
        "status": Contest.Status.UPCOMING,
        "start_time": now + timedelta(days=5),
        "end_time": now + timedelta(days=5, hours=3),
        "visibility": Contest.Visibility.PUBLIC,
        "penalty_time_minutes": 20,
        "max_participants": 1000,
    },
    {
        "title": "Beginner Friendly Contest",
        "slug": "beginner-friendly-contest",
        "description": "New to competitive programming? This contest is designed for beginners with easy to medium difficulty problems. No pressure, just learning!",
        "status": Contest.Status.ACTIVE,
        "start_time": now - timedelta(hours=1),
        "end_time": now + timedelta(hours=2),
        "visibility": Contest.Visibility.PUBLIC,
        "penalty_time_minutes": 10,
        "max_participants": 0,
    },
    {
        "title": "Data Structures Deep Dive",
        "slug": "data-structures-deep-dive",
        "description": "Put your knowledge of trees, graphs, heaps, and advanced data structures to the test in this themed contest.",
        "status": Contest.Status.ACTIVE,
        "start_time": now - timedelta(hours=1),
        "end_time": now + timedelta(hours=3),
        "visibility": Contest.Visibility.PUBLIC,
        "penalty_time_minutes": 15,
        "max_participants": 300,
    },
    {
        "title": "Night Owl Coding Marathon",
        "slug": "night-owl-coding-marathon",
        "description": "For the night owls! A late-night contest starting at midnight with tricky algorithmic puzzles. Coffee recommended.",
        "status": Contest.Status.ENDED,
        "start_time": now - timedelta(days=3),
        "end_time": now - timedelta(days=3) + timedelta(hours=4),
        "visibility": Contest.Visibility.PUBLIC,
        "penalty_time_minutes": 20,
        "max_participants": 200,
    },
]

created_count = 0
for data in contests_data:
    contest, created = Contest.objects.get_or_create(
        slug=data["slug"],
        defaults={**data, "created_by": creator},
    )
    if created:
        created_count += 1
        print(f"  Created: {contest.title} [{contest.status}]")
    else:
        print(f"  Already exists: {contest.title}")

print(f"\nDone! {created_count} new contest(s) created. Total: {Contest.objects.count()}")
