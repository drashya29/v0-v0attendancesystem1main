"""
WebSocket consumers for real-time attendance monitoring.
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from api.models import ClassSession, AttendanceLog, Student

logger = logging.getLogger(__name__)

class AttendanceConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time attendance updates.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.group_name = f"session_{self.session_id}"
        
        # Check if user is authenticated
        user = self.scope.get('user')
        if user is None or isinstance(user, AnonymousUser):
            await self.close(code=4001)
            return
        
        # Verify session exists and user has access
        session_exists = await self.check_session_access(self.session_id, user)
        if not session_exists:
            await self.close(code=4004)
            return
        
        # Join session group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial session data
        await self.send_session_status()
        
        logger.info(f"User {user.username} connected to session {self.session_id}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave session group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
        logger.info(f"User disconnected from session {self.session_id} with code {close_code}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
            elif message_type == 'request_session_status':
                await self.send_session_status()
            
            elif message_type == 'request_attendance_list':
                await self.send_attendance_list()
            
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received from WebSocket")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
    
    async def attendance_event(self, event):
        """Handle attendance event from group."""
        await self.send(text_data=json.dumps({
            'type': 'attendance_event',
            'data': event['data']
        }))
    
    async def session_update(self, event):
        """Handle session update event from group."""
        await self.send(text_data=json.dumps({
            'type': 'session_update',
            'data': event['data']
        }))
    
    async def system_notification(self, event):
        """Handle system notification event from group."""
        await self.send(text_data=json.dumps({
            'type': 'system_notification',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def check_session_access(self, session_id, user):
        """Check if user has access to the session."""
        try:
            session = ClassSession.objects.get(id=session_id)
            # Check if user is instructor or admin
            return user.is_staff or session.course.instructor == user
        except ClassSession.DoesNotExist:
            return False
    
    async def send_session_status(self):
        """Send current session status to client."""
        session_data = await self.get_session_data(self.session_id)
        if session_data:
            await self.send(text_data=json.dumps({
                'type': 'session_status',
                'data': session_data
            }))
    
    async def send_attendance_list(self):
        """Send current attendance list to client."""
        attendance_data = await self.get_attendance_data(self.session_id)
        await self.send(text_data=json.dumps({
            'type': 'attendance_list',
            'data': attendance_data
        }))
    
    @database_sync_to_async
    def get_session_data(self, session_id):
        """Get session data from database."""
        try:
            session = ClassSession.objects.select_related('course').get(id=session_id)
            return {
                'id': str(session.id),
                'session_name': session.session_name,
                'course_name': session.course.course_name,
                'course_code': session.course.course_code,
                'session_date': session.session_date.isoformat(),
                'start_time': session.start_time.isoformat(),
                'end_time': session.end_time.isoformat(),
                'location': session.location,
                'attendance_started': session.attendance_started,
                'attendance_ended': session.attendance_ended,
                'total_enrolled': session.course.students.filter(enrollment__is_active=True).count(),
                'total_present': session.attendance_logs.count()
            }
        except ClassSession.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_attendance_data(self, session_id):
        """Get attendance data from database."""
        try:
            attendance_logs = AttendanceLog.objects.filter(
                session_id=session_id
            ).select_related('student').order_by('-timestamp')
            
            return [
                {
                    'id': str(log.id),
                    'student': {
                        'id': str(log.student.id),
                        'name': log.student.full_name,
                        'student_id': log.student.student_id
                    },
                    'timestamp': log.timestamp.isoformat(),
                    'confidence_score': log.confidence_score,
                    'method': log.method
                }
                for log in attendance_logs
            ]
        except Exception as e:
            logger.error(f"Error getting attendance data: {str(e)}")
            return []

class DashboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time dashboard updates.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        # Check if user is authenticated
        user = self.scope.get('user')
        if user is None or isinstance(user, AnonymousUser):
            await self.close(code=4001)
            return
        
        self.group_name = "dashboard_updates"
        
        # Join dashboard group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial dashboard data
        await self.send_dashboard_stats()
        
        logger.info(f"User {user.username} connected to dashboard updates")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave dashboard group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
        logger.info(f"User disconnected from dashboard with code {close_code}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
            elif message_type == 'request_dashboard_stats':
                await self.send_dashboard_stats()
            
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received from WebSocket")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
    
    async def dashboard_update(self, event):
        """Handle dashboard update event from group."""
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data']
        }))
    
    async def attendance_summary(self, event):
        """Handle attendance summary event from group."""
        await self.send(text_data=json.dumps({
            'type': 'attendance_summary',
            'data': event['data']
        }))
    
    async def send_dashboard_stats(self):
        """Send current dashboard statistics to client."""
        stats_data = await self.get_dashboard_stats()
        await self.send(text_data=json.dumps({
            'type': 'dashboard_stats',
            'data': stats_data
        }))
    
    @database_sync_to_async
    def get_dashboard_stats(self):
        """Get dashboard statistics from database."""
        try:
            from django.utils import timezone
            from datetime import timedelta
            from django.db.models import Count
            
            today = timezone.now().date()
            
            # Basic counts
            total_students = Student.objects.filter(is_active=True).count()
            total_courses = ClassSession.objects.filter(
                session_date=today
            ).values('course').distinct().count()
            
            active_sessions = ClassSession.objects.filter(
                session_date=today,
                attendance_started=True,
                attendance_ended=False
            ).count()
            
            # Today's attendance
            today_attendance = AttendanceLog.objects.filter(
                timestamp__date=today
            ).count()
            
            # Recent activity
            recent_attendance = AttendanceLog.objects.filter(
                timestamp__gte=timezone.now() - timedelta(hours=1)
            ).select_related('student', 'session').order_by('-timestamp')[:10]
            
            recent_activity = [
                {
                    'id': str(log.id),
                    'student_name': log.student.full_name,
                    'session_name': log.session.session_name,
                    'timestamp': log.timestamp.isoformat(),
                    'confidence': log.confidence_score
                }
                for log in recent_attendance
            ]
            
            return {
                'total_students': total_students,
                'total_courses': total_courses,
                'active_sessions': active_sessions,
                'today_attendance': today_attendance,
                'recent_activity': recent_activity,
                'last_updated': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            return {}

class SystemConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for system-wide notifications and updates.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        # Check if user is authenticated and is staff
        user = self.scope.get('user')
        if user is None or isinstance(user, AnonymousUser) or not user.is_staff:
            await self.close(code=4001)
            return
        
        self.group_name = "system_notifications"
        
        # Join system notifications group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        logger.info(f"Admin user {user.username} connected to system notifications")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave system notifications group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
        logger.info(f"Admin user disconnected from system notifications with code {close_code}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received from WebSocket")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
    
    async def system_alert(self, event):
        """Handle system alert event from group."""
        await self.send(text_data=json.dumps({
            'type': 'system_alert',
            'data': event['data']
        }))
    
    async def face_recognition_status(self, event):
        """Handle face recognition status event from group."""
        await self.send(text_data=json.dumps({
            'type': 'face_recognition_status',
            'data': event['data']
        }))
    
    async def batch_processing_update(self, event):
        """Handle batch processing update event from group."""
        await self.send(text_data=json.dumps({
            'type': 'batch_processing_update',
            'data': event['data']
        }))
