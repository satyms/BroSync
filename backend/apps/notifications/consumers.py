"""
Notifications - WebSocket Consumer
=====================================
Delivers real-time notifications to authenticated users.
Each user connects to their own notification channel.
"""

import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("apps")


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for per-user notifications.
    Each authenticated user joins a group named 'user_{user_id}'.
    """

    async def connect(self):
        """Handle WebSocket connection."""
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            logger.warning("WS notification connection rejected: unauthenticated")
            await self.close(code=4001)
            return

        self.group_name = f"user_{user.id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info("WS notification connected: user=%s", user.username)

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name, self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming messages (mark read, etc.)."""
        if text_data:
            try:
                data = json.loads(text_data)
                action = data.get("action")
                if action == "mark_read":
                    # Can be extended to mark notifications as read
                    pass
            except json.JSONDecodeError:
                pass

    async def submission_result(self, event):
        """Broadcast submission result to the user."""
        await self.send(text_data=json.dumps({
            "type": "submission_result",
            "data": event["data"],
        }))

    async def contest_notification(self, event):
        """Broadcast contest notifications (start/end)."""
        await self.send(text_data=json.dumps({
            "type": "contest_notification",
            "data": event["data"],
        }))

    async def system_notification(self, event):
        """Broadcast system-wide notifications."""
        await self.send(text_data=json.dumps({
            "type": "system_notification",
            "data": event["data"],
        }))

    async def notify(self, event):
        """
        Generic battle/system event pushed by the service layer.
        Payload: { type: "notify", event_type: str, payload: dict }
        Forwarded to the client as: { type: <event_type>, ...payload }
        """
        await self.send(text_data=json.dumps({
            "type": event["event_type"],   # e.g. "battle_request" | "battle_started"
            **event["payload"],
        }))
