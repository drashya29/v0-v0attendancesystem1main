"""
API views for facial recognition operations.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
import logging
import json

from api.models import Student, ClassSession
from .tasks import process_student_photo, process_attendance_recognition
from .face_processor import FaceProcessor
from .utils import validate_image_format

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_student_face(request):
    """
    Process a student's photo to extract face encoding.
    """
    student_id = request.data.get('student_id')
    
    if not student_id:
        return Response(
            {'error': 'Student ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        student = Student.objects.get(id=student_id)
        
        if not student.photo:
            return Response(
                {'error': 'No photo found for this student'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process asynchronously
        task = process_student_photo.delay(student_id)
        
        return Response({
            'message': 'Face processing started',
            'task_id': task.id,
            'student': {
                'id': str(student.id),
                'name': student.full_name,
                'student_id': student.student_id
            }
        })
        
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recognize_attendance(request):
    """
    Process attendance recognition from camera image.
    """
    session_id = request.data.get('session_id')
    image_data = request.data.get('image_data')
    
    if not session_id or not image_data:
        return Response(
            {'error': 'Session ID and image data are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate image format
    if not validate_image_format(image_data):
        return Response(
            {'error': 'Invalid image format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        session = ClassSession.objects.get(id=session_id)
        
        if not session.attendance_started:
            return Response(
                {'error': 'Attendance monitoring not started for this session'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if session.attendance_ended:
            return Response(
                {'error': 'Attendance monitoring has ended for this session'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process recognition asynchronously
        task = process_attendance_recognition.delay(session_id, image_data)
        
        return Response({
            'message': 'Recognition processing started',
            'task_id': task.id,
            'session': {
                'id': str(session.id),
                'name': session.session_name,
                'course': session.course.course_name
            }
        })
        
    except ClassSession.DoesNotExist:
        return Response(
            {'error': 'Class session not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recognition_status(request, task_id):
    """
    Check the status of a recognition task.
    """
    from celery.result import AsyncResult
    
    try:
        task = AsyncResult(task_id)
        
        if task.ready():
            result = task.get()
            return Response({
                'status': 'completed',
                'result': result
            })
        else:
            return Response({
                'status': 'processing',
                'message': 'Task is still processing'
            })
            
    except Exception as e:
        return Response(
            {'error': f'Error checking task status: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_process_students(request):
    """
    Process face encodings for multiple students.
    """
    student_ids = request.data.get('student_ids', [])
    
    if not student_ids:
        return Response(
            {'error': 'Student IDs list is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate students exist
    existing_students = Student.objects.filter(
        id__in=student_ids,
        photo__isnull=False
    ).values_list('id', flat=True)
    
    if not existing_students:
        return Response(
            {'error': 'No valid students with photos found'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Start batch processing
    task_ids = []
    for student_id in existing_students:
        task = process_student_photo.delay(str(student_id))
        task_ids.append(task.id)
    
    return Response({
        'message': f'Batch processing started for {len(task_ids)} students',
        'task_ids': task_ids,
        'student_count': len(task_ids)
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_status(request):
    """
    Get facial recognition system status and statistics.
    """
    try:
        # Count students with face encodings
        total_students = Student.objects.filter(is_active=True).count()
        students_with_encodings = Student.objects.filter(
            is_active=True,
            face_encoding__isnull=False
        ).count()
        
        # Get system settings
        tolerance = getattr(settings, 'FACE_RECOGNITION_TOLERANCE', 0.6)
        model = getattr(settings, 'FACE_RECOGNITION_MODEL', 'hog')
        
        return Response({
            'system_status': 'active',
            'statistics': {
                'total_students': total_students,
                'students_with_encodings': students_with_encodings,
                'encoding_coverage': (students_with_encodings / total_students * 100) if total_students > 0 else 0
            },
            'settings': {
                'tolerance': tolerance,
                'model': model
            }
        })
        
    except Exception as e:
        return Response(
            {'error': f'Error getting system status: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
