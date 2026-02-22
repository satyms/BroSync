"""
Submissions - URL Configuration
=================================
"""
from django.urls import path

from . import views

app_name = "submissions"

urlpatterns = [
    path("", views.SubmitCodeView.as_view(), name="submit"),
    path("me/", views.MySubmissionsView.as_view(), name="my-submissions"),
    path("all/", views.AllSubmissionsView.as_view(), name="all-submissions"),
    path("activity/", views.ActivityHeatmapView.as_view(), name="activity-heatmap"),
    path("<uuid:id>/", views.SubmissionDetailView.as_view(), name="detail"),
    path("<uuid:id>/status/", views.SubmissionStatusView.as_view(), name="status"),
]
