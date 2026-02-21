"""
Leaderboard - WebSocket Consumer
==================================
Broadcasts real-time leaderboard updates to connected clients.
"""

import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("apps")


class LeaderboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for contest leaderboard.
    Clients join a contest-specific group and receive live score updates.
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.contest_id = self.scope["url_route"]["kwargs"]["contest_id"]
        self.group_name = f"leaderboard_{self.contest_id}"

        # Reject unauthenticated connections
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            logger.warning("WS leaderboard connection rejected: unauthenticated")
            await self.close(code=4001)
            return

        # Join the contest's leaderboard group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info(
            "WS leaderboard connected: user=%s contest=%s",
            user.username,
            self.contest_id,
        )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming messages from clients (ping/pong only)."""
        # Leaderboard is broadcast-only; ignore client messages
        pass

    async def leaderboard_update(self, event):
        """
        Handler for 'leaderboard_update' messages sent to the group.
        Broadcasts the updated leaderboard data to the client.
        """
        await self.send(text_data=json.dumps({
            "type": "leaderboard_update",
            "data": event["data"],
        }))
