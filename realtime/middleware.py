"""
WebSocket middleware for authentication and session management.
"""
import logging
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token

logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_from_token(token_key):
    """Get user from authentication token."""
    try:
        token = Token.objects.select_related('user').get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using tokens.
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string or headers
        token_key = None
        
        # Try to get token from query string
        query_string = scope.get('query_string', b'').decode()
        if 'token=' in query_string:
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token_key = param.split('=')[1]
                    break
        
        # Try to get token from headers
        if not token_key:
            headers = dict(scope.get('headers', []))
            auth_header = headers.get(b'authorization', b'').decode()
            if auth_header.startswith('Token '):
                token_key = auth_header[6:]
        
        # Authenticate user
        if token_key:
            scope['user'] = await get_user_from_token(token_key)
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)

def TokenAuthMiddlewareStack(inner):
    """
    Middleware stack for token authentication.
    """
    return TokenAuthMiddleware(inner)
