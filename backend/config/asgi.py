"""
BroSync - ASGI Configuration
=============================
Configures Django Channels with WebSocket routing.
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

# Initialize Django ASGI application early to populate AppRegistry
django_asgi_app = get_asgi_application()

# Import websocket routes after Django setup
from apps.notifications.routing import websocket_urlpatterns as notification_ws  # noqa: E402
from apps.leaderboard.routing import websocket_urlpatterns as leaderboard_ws  # noqa: E402
from core.middleware.ws_auth import JWTAuthMiddleware  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddleware(
                URLRouter(
                    notification_ws + leaderboard_ws
                )
            )
        ),
    }
)
