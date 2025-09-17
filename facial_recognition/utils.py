"""
Utility functions for facial recognition operations.
"""
import logging
from typing import Dict, List
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

def send_attendance_notification(attendance_log_id: str) -> None:
    """
    Send real-time attendance notification via WebSocket.
    
    Args:
        attendance_log_id: ID of the attendance log
    """
    try:
        from api.models import AttendanceLog
        from api.serializers import AttendanceLogSerializer
        from realtime.utils import send_attendance_notification as send_notification
        from realtime.utils import send_dashboard_update
        
        attendance_log = AttendanceLog.objects.select_related(
            'student', 'session', 'session__course'
        ).get(id=attendance_log_id)
        
        # Serialize attendance data
        serializer = AttendanceLogSerializer(attendance_log)
        
        # Send to session group
        send_notification(str(attendance_log.session.id), serializer.data)
        
        # Update dashboard stats
        from django.utils import timezone
        today_count = AttendanceLog.objects.filter(
            timestamp__date=timezone.now().date()
        ).count()
        
        send_dashboard_update({
            'today_attendance': today_count,
            'recent_attendance': {
                'student_name': attendance_log.student.full_name,
                'session_name': attendance_log.session.session_name,
                'timestamp': attendance_log.timestamp.isoformat()
            }
        })
        
        logger.info(f"Sent attendance notification for {attendance_log.student.full_name}")
        
    except Exception as e:
        logger.error(f"Error sending attendance notification: {str(e)}")

def validate_image_format(image_data) -> bool:
    """
    Validate if the image data is in a supported format.
    
    Args:
        image_data: Image data to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        from PIL import Image
        import io
        
        if hasattr(image_data, 'read'):
            # File-like object
            image = Image.open(image_data)
        elif isinstance(image_data, str) and image_data.startswith('data:image'):
            # Base64 encoded image
            import base64
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(io.BytesIO(image_bytes))
        else:
            return False
        
        # Check if it's a valid image
        image.verify()
        return True
        
    except Exception:
        return False

def get_optimal_face_crop(image, face_location, padding: float = 0.2):
    """
    Extract and crop face region from image with padding.
    
    Args:
        image: PIL Image or numpy array
        face_location: Face location tuple (top, right, bottom, left)
        padding: Padding around face as fraction of face size
        
    Returns:
        Cropped face image
    """
    try:
        from PIL import Image
        import numpy as np
        
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        
        top, right, bottom, left = face_location
        
        # Calculate padding
        face_width = right - left
        face_height = bottom - top
        pad_x = int(face_width * padding)
        pad_y = int(face_height * padding)
        
        # Apply padding with bounds checking
        crop_left = max(0, left - pad_x)
        crop_top = max(0, top - pad_y)
        crop_right = min(image.width, right + pad_x)
        crop_bottom = min(image.height, bottom + pad_y)
        
        # Crop the image
        cropped = image.crop((crop_left, crop_top, crop_right, crop_bottom))
        
        return cropped
        
    except Exception as e:
        logger.error(f"Error cropping face: {str(e)}")
        return None

def calculate_face_quality_score(image, face_location) -> float:
    """
    Calculate a quality score for a detected face.
    
    Args:
        image: Image containing the face
        face_location: Face location tuple
        
    Returns:
        Quality score between 0 and 1
    """
    try:
        import cv2
        import numpy as np
        
        if hasattr(image, 'read'):
            image = np.array(Image.open(image))
        elif not isinstance(image, np.ndarray):
            image = np.array(image)
        
        top, right, bottom, left = face_location
        
        # Extract face region
        face_region = image[top:bottom, left:right]
        
        if face_region.size == 0:
            return 0.0
        
        # Convert to grayscale for analysis
        if len(face_region.shape) == 3:
            gray_face = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        else:
            gray_face = face_region
        
        # Calculate sharpness using Laplacian variance
        laplacian_var = cv2.Laplacian(gray_face, cv2.CV_64F).var()
        sharpness_score = min(laplacian_var / 1000.0, 1.0)  # Normalize
        
        # Calculate brightness
        brightness = np.mean(gray_face) / 255.0
        brightness_score = 1.0 - abs(brightness - 0.5) * 2  # Prefer mid-range brightness
        
        # Calculate size score (prefer larger faces)
        face_area = (right - left) * (bottom - top)
        size_score = min(face_area / (100 * 100), 1.0)  # Normalize to 100x100 pixels
        
        # Combine scores
        quality_score = (sharpness_score * 0.4 + brightness_score * 0.3 + size_score * 0.3)
        
        return float(quality_score)
        
    except Exception as e:
        logger.error(f"Error calculating face quality: {str(e)}")
        return 0.0
