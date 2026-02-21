"""Notifications - Views."""
import logging

from rest_framework import permissions
from rest_framework.views import APIView

from core.utils.responses import error_response, success_response

from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger("apps")


class NotificationListView(APIView):
    """GET /api/v1/notifications/ — list notifications for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(user=request.user)
        unread_only = request.query_params.get("unread")
        if unread_only == "true":
            notifs = notifs.filter(is_read=False)
        serializer = NotificationSerializer(notifs[:50], many=True)
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return success_response(data={
            "results": serializer.data,
            "unread_count": unread_count,
        })


class MarkNotificationReadView(APIView):
    """POST /api/v1/notifications/<id>/read/ — mark a single notification as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return error_response("Notification not found.", status_code=404)
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return success_response(data=NotificationSerializer(notif).data)


class MarkAllReadView(APIView):
    """POST /api/v1/notifications/read-all/ — mark all notifications as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return success_response(data={"marked_read": True})
