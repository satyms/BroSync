"""Proctor - URL Patterns."""
from django.urls import path

from .views import AnalyzeFrameView, ViolationStatusView

app_name = "proctor"

urlpatterns = [
    path("analyze/", AnalyzeFrameView.as_view(), name="analyze-frame"),
    path("status/", ViolationStatusView.as_view(), name="violation-status"),
]
