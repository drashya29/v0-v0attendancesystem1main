"""
Celery tasks for facial recognition processing.
"""
from celery import shared_task
from django.utils import timezone
from django.conf import settings
import logging
import json

from api.models import Student, ClassSession, AttendanceLog
from .face_processor import FaceProcessor
from .utils import send_attendance_notification

logger = logging.getLogger(__name__)

@shared_task
def process_student_photo(student_id: str) -> dict:
    """
    Process a student's photo to extract face encoding.
    
    Args:
        student_id: Student ID to process
        
    Returns:
        Dictionary with success status and message
    """
    try:
        student = Student.objects.get(id=student_id)
        
        if not student.photo:
            return {'success': False, 'message': 'No photo found for student'}
        
        # Initialize face processor
        processor = FaceProcessor(
            tolerance=getattr(settings, 'FACE_RECOGNITION_TOLERANCE', 0.6),
            model=getattr(settings, 'FACE_RECOGNITION_MODEL', 'hog')
        )
        
        # Extract face encoding
        face_encoding = processor.extract_face_encoding(student.photo.path)
        
        if face_encoding:
            # Save encoding to database
            student.face_encoding = face_encoding
            student.save()
            
            logger.info(f"Successfully processed photo for student {student.student_id}")
            return {
                'success': True, 
                'message': f'Face encoding generated for {student.full_name}'
            }
        else:
            logger.warning(f"Could not extract face encoding for student {student.student_id}")
            return {
                'success': False, 
                'message': 'Could not detect face in the photo'
            }
            
    except Student.DoesNotExist:
        return {'success': False, 'message': 'Student not found'}
    except Exception as e:
        logger.error(f"Error processing student photo: {str(e)}")
        return {'success': False, 'message': f'Processing error: {str(e)}'}

@shared_task
def process_attendance_recognition(session_id: str, image_data: str) -> dict:
    """
    Process attendance recognition for a class session.
    
    Args:
        session_id: Class session ID
        image_data: Base64 encoded image data
        
    Returns:
        Dictionary with recognition results
    """
    try:
        session = ClassSession.objects.get(id=session_id)
        
        if not session.attendance_started or session.attendance_ended:
            return {'success': False, 'message': 'Attendance not active for this session'}
        
        # Initialize face processor
        processor = FaceProcessor(
            tolerance=getattr(settings, 'FACE_RECOGNITION_TOLERANCE', 0.6),
            model=getattr(settings, 'FACE_RECOGNITION_MODEL', 'hog')
        )
        
        # Load known faces for enrolled students
        enrolled_students = session.course.students.filter(
            enrollment__is_active=True,
            face_encoding__isnull=False
        ).values('id', 'student_id', 'first_name', 'last_name', 'face_encoding')
        
        processor.load_known_faces(list(enrolled_students))
        
        # Decode image data
        import base64
        import io
        from PIL import Image
        
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Recognize face
        result = processor.recognize_face(image)
        
        if result and result['student_id']:
            student = Student.objects.get(id=result['student_id'])
            
            # Check if attendance already recorded
            existing_log = AttendanceLog.objects.filter(
                student=student,
                session=session
            ).first()
            
            if existing_log:
                return {
                    'success': False,
                    'message': f'{student.full_name} already marked present',
                    'student': {
                        'id': str(student.id),
                        'name': student.full_name,
                        'student_id': student.student_id
                    }
                }
            
            # Create attendance log
            attendance_log = AttendanceLog.objects.create(
                student=student,
                session=session,
                confidence_score=result['confidence'],
                method='facial_recognition'
            )
            
            # Send real-time notification
            send_attendance_notification.delay(str(attendance_log.id))
            
            logger.info(f"Attendance recorded for {student.full_name} in {session.session_name}")
            
            return {
                'success': True,
                'message': f'Attendance recorded for {student.full_name}',
                'student': {
                    'id': str(student.id),
                    'name': student.full_name,
                    'student_id': student.student_id,
                    'confidence': result['confidence']
                },
                'attendance_id': str(attendance_log.id)
            }
        else:
            return {
                'success': False,
                'message': 'No recognized student found in the image'
            }
            
    except ClassSession.DoesNotExist:
        return {'success': False, 'message': 'Class session not found'}
    except Exception as e:
        logger.error(f"Error processing attendance recognition: {str(e)}")
        return {'success': False, 'message': f'Recognition error: {str(e)}'}

@shared_task
def cleanup_old_attendance_data():
    """
    Cleanup old attendance data and optimize database.
    """
    try:
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=365)  # Keep 1 year of data
        
        # Archive old attendance logs (implement archiving logic here)
        old_logs_count = AttendanceLog.objects.filter(timestamp__lt=cutoff_date).count()
        
        logger.info(f"Found {old_logs_count} old attendance logs for potential archiving")
        
        return {'success': True, 'message': f'Cleanup completed. {old_logs_count} old records found'}
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return {'success': False, 'message': f'Cleanup error: {str(e)}'}
