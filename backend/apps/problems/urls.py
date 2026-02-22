"""
Problems - URL Configuration
==============================
"""
from django.urls import path

from . import views

app_name = "problems"

urlpatterns = [
    # Roadmap tree
    path("roadmaps/", views.RoadmapView.as_view(), name="roadmaps"),

    # Public endpoints
    path("", views.ProblemListView.as_view(), name="list"),
    path("categories/", views.CategoryListView.as_view(), name="categories"),
    path("run/", views.RunCodeView.as_view(), name="run-code"),
    path("<slug:slug>/", views.ProblemDetailView.as_view(), name="detail"),
    path("<slug:slug>/solvers/", views.ProblemSolversView.as_view(), name="solvers"),

    # Admin endpoints
    path("admin/create/", views.ProblemCreateView.as_view(), name="admin-create"),
    path("admin/<uuid:id>/", views.ProblemUpdateView.as_view(), name="admin-update"),
    path("admin/testcases/", views.TestCaseCreateView.as_view(), name="admin-testcases"),
    path("admin/categories/", views.CategoryCreateView.as_view(), name="admin-categories"),
]
