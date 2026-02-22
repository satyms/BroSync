"""
Battles - URL Patterns
========================
REST endpoints for the battle system.
"""

from django.urls import path
from . import views

app_name = "battles"

urlpatterns = [
    # Battle requests
    path("request/",                   views.SendBattleRequestView.as_view(),    name="send-request"),
    path("request/inbox/",             views.BattleRequestInboxView.as_view(),   name="inbox"),
    path("request/<uuid:request_id>/respond/", views.RespondBattleRequestView.as_view(), name="respond"),

    # Battle rooms
    path("history/",                   views.BattleHistoryView.as_view(),        name="history"),
    path("my/",                        views.MyBattlesView.as_view(),            name="my-battles"),
    path("<uuid:battle_id>/",          views.BattleDetailView.as_view(),         name="detail"),
    path("<uuid:battle_id>/submit/",   views.BattleSubmitView.as_view(),         name="submit"),
]
