"""
WebSocket URL routing for real-time features.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/attendance/(?P<session_id>[0-9a-f-]+)/$', consumers.AttendanceConsumer.as_asgi()),
    re_path(r'ws/dashboard/$', consumers.DashboardConsumer.as_asgi()),
    re_path(r'ws/system/$', consumers.SystemConsumer.as_asgi()),
]
