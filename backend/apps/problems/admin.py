"""
Problems - Admin Configuration
================================
"""
from django.contrib import admin

from .models import Category, Problem, TestCase


class TestCaseInline(admin.TabularInline):
    """Inline test cases inside the Problem admin page."""
    model = TestCase
    extra = 2
    fields = ("order", "input_data", "expected_output", "is_sample")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ("title", "difficulty", "category", "is_published", "total_submissions", "accepted_submissions", "created_at")
    list_filter = ("difficulty", "is_published", "category")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("total_submissions", "accepted_submissions", "created_at", "updated_at")
    inlines = [TestCaseInline]


@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display = ("problem", "order", "is_sample")
    list_filter = ("is_sample",)
    search_fields = ("problem__title",)
