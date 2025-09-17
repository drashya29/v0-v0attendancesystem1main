"""
Utility functions for real-time operations.
"""
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from typing import Dict, Any

logger = logging.getLogger(__name__)

def send_attendance_notification(session_id: str, attendance_data: Dict[str, Any]) -> None:
    """
    Send real-time attendance notification to session group.
    
    Args:
        session_id: Class session ID
        attendance_data: Attendance event data
    """
    try:
        channel_layer = get_channel_layer()
        group_name = f"session_{session_id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'attendance_event',
                'data': {
                    'event_type': 'new_attendance',
                    'attendance': attendance_data,
                    'timestamp': attendance_data.get('timestamp')
                }
            }
        )
        
        logger.info(f"Sent attendance notification to session {session_id}")
        
    except Exception as e:
        logger.error(f"Error sending attendance notification: {str(e)}")

def send_session_update(session_id: str, update_data: Dict[str, Any]) -> None:
    """
    Send session update notification to session group.
    
    Args:
        session_id: Class session ID
        update_data: Session update data
    """
    try:
        channel_layer = get_channel_layer()
        group_name = f"session_{session_id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'session_update',
                'data': update_data
            }
        )
        
        logger.info(f"Sent session update to session {session_id}")
        
    except Exception as e:
        logger.error(f"Error sending session update: {str(e)}")

def send_dashboard_update(stats_data: Dict[str, Any]) -> None:
    """
    Send dashboard update to all connected dashboard clients.
    
    Args:
        stats_data: Dashboard statistics data
    """
    try:
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            "dashboard_updates",
            {
                'type': 'dashboard_update',
                'data': stats_data
            }
        )
        
        logger.info("Sent dashboard update to all clients")
        
    except Exception as e:
        logger.error(f"Error sending dashboard update: {str(e)}")

def send_system_alert(alert_type: str, message: str, severity: str = 'info') -> None:
    """
    Send system alert to admin users.
    
    Args:
        alert_type: Type of alert
        message: Alert message
        severity: Alert severity (info, warning, error)
    """
    try:
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            "system_notifications",
            {
                'type': 'system_alert',
                'data': {
                    'alert_type': alert_type,
                    'message': message,
                    'severity': severity,
                    'timestamp': timezone.now().isoformat()
                }
            }
        )
        
        logger.info(f"Sent system alert: {alert_type} - {message}")
        
    except Exception as e:
        logger.error(f"Error sending system alert: {str(e)}")

def send_face_recognition_status(status_data: Dict[str, Any]) -> None:
    """
    Send face recognition processing status update.
    
    Args:
        status_data: Face recognition status data
    """
    try:
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            "system_notifications",
            {
                'type': 'face_recognition_status',
                'data': status_data
            }
        )
        
        logger.info("Sent face recognition status update")
        
    except Exception as e:
        logger.error(f"Error sending face recognition status: {str(e)}")

def send_batch_processing_update(batch_id: str, progress_data: Dict[str, Any]) -> None:
    """
    Send batch processing progress update.
    
    Args:
        batch_id: Batch processing ID
        progress_data: Progress data
    """
    try:
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            "system_notifications",
            {
                'type': 'batch_processing_update',
                'data': {
                    'batch_id': batch_id,
                    'progress': progress_data,
                    'timestamp': timezone.now().isoformat()
                }
            }
        )
        
        logger.info(f"Sent batch processing update for batch {batch_id}")
        
    except Exception as e:
        logger.error(f"Error sending batch processing update: {str(e)}")
