"""
Submissions - Admin Configuration
====================================
"""
from django.contrib import admin

from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user", "problem", "language", "status",
        "test_cases_passed", "total_test_cases",
        "execution_time_ms", "submitted_at",
    )
    list_filter = ("status", "language", "submitted_at")
    search_fields = ("user__username", "problem__title")
    readonly_fields = (
        "id", "user", "problem", "contest", "code", "status",
        "execution_time_ms", "memory_used_kb",
        "test_cases_passed", "total_test_cases",
        "error_output", "submitted_at", "judged_at",
    )
    ordering = ("-submitted_at",)
