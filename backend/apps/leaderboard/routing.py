"""
Leaderboard - WebSocket Routing
=================================
WebSocket URL patterns for real-time leaderboard updates.
"""

from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r"ws/leaderboard/(?P<contest_id>[0-9a-f-]+)/$",
        consumers.LeaderboardConsumer.as_asgi(),
    ),
]
