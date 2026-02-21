"""
WebSocket JWT Authentication Middleware
=======================================
Authenticates WebSocket connections using JWT tokens
passed as query parameters: ws://host/ws/path/?token=<jwt>
"""

import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

logger = logging.getLogger("core")
User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom Channels middleware that extracts and validates a JWT token
    from the WebSocket connection's query string.
    """

    async def __call__(self, scope, receive, send):
        # Extract token from query string
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await self._authenticate(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def _authenticate(self, raw_token: str):
        """
        Validate the JWT token and return the associated user.
        Returns AnonymousUser if the token is invalid.
        """
        try:
            validated_token = AccessToken(raw_token)
            user_id = validated_token.get("user_id")
            user = User.objects.get(id=user_id)
            logger.debug("WebSocket authenticated: user=%s", user.username)
            return user
        except (InvalidToken, TokenError) as e:
            logger.warning("WebSocket auth failed: invalid token — %s", str(e))
            return AnonymousUser()
        except User.DoesNotExist:
            logger.warning("WebSocket auth failed: user not found")
            return AnonymousUser()
        except Exception as e:
            logger.error("WebSocket auth unexpected error: %s", str(e))
            return AnonymousUser()
