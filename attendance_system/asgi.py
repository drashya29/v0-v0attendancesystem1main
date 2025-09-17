"""
ASGI config for attendance_system project.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import realtime.routing
from realtime.middleware import TokenAuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddlewareStack(
            URLRouter(
                realtime.routing.websocket_urlpatterns
            )
        )
    ),
})
