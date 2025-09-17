"""
API views for the attendance system.
"""
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import Student, Course, Enrollment, ClassSession, AttendanceLog
from .serializers import (
    LoginSerializer, UserSerializer, StudentSerializer, CourseSerializer,
    EnrollmentSerializer, ClassSessionSerializer, AttendanceLogSerializer
)
from .analytics import AttendanceAnalytics, ReportGenerator

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    User login endpoint.
    Returns authentication token on successful login.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        login(request, user)
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """User logout endpoint."""
    try:
        # Delete the user's token
        request.user.auth_token.delete()
        logout(request)
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except:
        return Response({'error': 'Error during logout'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """Get current user profile."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing students."""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Student.objects.all()
        search = self.request.query_params.get('search', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if search:
            queryset = queryset.filter(
                Q(student_id__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('last_name', 'first_name')

class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing courses."""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Course.objects.all()
        search = self.request.query_params.get('search', None)
        semester = self.request.query_params.get('semester', None)
        year = self.request.query_params.get('year', None)
        instructor = self.request.query_params.get('instructor', None)
        
        if search:
            queryset = queryset.filter(
                Q(course_code__icontains=search) |
                Q(course_name__icontains=search)
            )
        
        if semester:
            queryset = queryset.filter(semester=semester)
        
        if year:
            queryset = queryset.filter(year=year)
        
        if instructor:
            queryset = queryset.filter(instructor=instructor)
        
        return queryset.order_by('course_code')
    
    @action(detail=True, methods=['post'])
    def enroll_student(self, request, pk=None):
        """Enroll a student in this course."""
        course = self.get_object()
        student_id = request.data.get('student_id')
        
        try:
            student = Student.objects.get(id=student_id)
            enrollment, created = Enrollment.objects.get_or_create(
                student=student,
                course=course,
                defaults={'is_active': True}
            )
            
            if not created and not enrollment.is_active:
                enrollment.is_active = True
                enrollment.save()
            
            return Response({
                'message': f'Student {student.full_name} enrolled successfully',
                'enrollment': EnrollmentSerializer(enrollment).data
            })
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

class ClassSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing class sessions."""
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ClassSession.objects.all()
        course = self.request.query_params.get('course', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if course:
            queryset = queryset.filter(course=course)
        
        if date_from:
            queryset = queryset.filter(session_date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(session_date__lte=date_to)
        
        return queryset.order_by('-session_date', '-start_time')
    
    @action(detail=True, methods=['post'])
    def start_attendance(self, request, pk=None):
        """Start attendance monitoring for this session."""
        session = self.get_object()
        session.attendance_started = True
        session.save()
        
        return Response({
            'message': f'Attendance started for {session.session_name}',
            'session': ClassSessionSerializer(session).data
        })
    
    @action(detail=True, methods=['post'])
    def stop_attendance(self, request, pk=None):
        """Stop attendance monitoring for this session."""
        session = self.get_object()
        session.attendance_ended = True
        session.save()
        
        return Response({
            'message': f'Attendance stopped for {session.session_name}',
            'session': ClassSessionSerializer(session).data
        })

class AttendanceLogViewSet(viewsets.ModelViewSet):
    """ViewSet for managing attendance logs."""
    queryset = AttendanceLog.objects.all()
    serializer_class = AttendanceLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = AttendanceLog.objects.all()
        student = self.request.query_params.get('student', None)
        session = self.request.query_params.get('session', None)
        course = self.request.query_params.get('course', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if student:
            queryset = queryset.filter(student=student)
        
        if session:
            queryset = queryset.filter(session=session)
        
        if course:
            queryset = queryset.filter(session__course=course)
        
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        
        return queryset.order_by('-timestamp')

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics."""
    today = timezone.now().date()
    
    # Basic counts
    total_students = Student.objects.filter(is_active=True).count()
    total_courses = Course.objects.filter(is_active=True).count()
    active_sessions = ClassSession.objects.filter(
        session_date=today,
        attendance_started=True,
        attendance_ended=False
    ).count()
    
    # Today's attendance
    today_attendance = AttendanceLog.objects.filter(
        timestamp__date=today
    ).count()
    
    # Weekly attendance trend
    week_ago = today - timedelta(days=7)
    weekly_attendance = AttendanceLog.objects.filter(
        timestamp__date__gte=week_ago
    ).values('timestamp__date').annotate(
        count=Count('id')
    ).order_by('timestamp__date')
    
    return Response({
        'total_students': total_students,
        'total_courses': total_courses,
        'active_sessions': active_sessions,
        'today_attendance': today_attendance,
        'weekly_attendance': list(weekly_attendance)
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def attendance_trends(request):
    """Get attendance trends and analytics."""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    course_id = request.GET.get('course_id')
    
    # Parse dates
    try:
        if start_date:
            start_date = datetime.fromisoformat(start_date).date()
        if end_date:
            end_date = datetime.fromisoformat(end_date).date()
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    trends_data = AttendanceAnalytics.get_attendance_trends(
        start_date=start_date,
        end_date=end_date,
        course_id=course_id
    )
    
    return Response(trends_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def student_performance(request):
    """Get student performance analytics."""
    student_id = request.GET.get('student_id')
    course_id = request.GET.get('course_id')
    
    performance_data = AttendanceAnalytics.get_student_performance(
        student_id=student_id,
        course_id=course_id
    )
    
    return Response(performance_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def at_risk_students(request):
    """Get list of at-risk students."""
    threshold = float(request.GET.get('threshold', 75.0))
    
    at_risk_data = AttendanceAnalytics.get_at_risk_students(threshold=threshold)
    
    return Response({
        'threshold': threshold,
        'at_risk_students': at_risk_data,
        'count': len(at_risk_data)
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def course_analytics(request, course_id):
    """Get comprehensive analytics for a specific course."""
    analytics_data = AttendanceAnalytics.get_course_analytics(course_id)
    
    if 'error' in analytics_data:
        return Response(analytics_data, status=status.HTTP_404_NOT_FOUND)
    
    return Response(analytics_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_attendance_report(request):
    """Export attendance report as CSV."""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    course_id = request.GET.get('course_id')
    
    if not start_date or not end_date:
        return Response(
            {'error': 'start_date and end_date are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_date = datetime.fromisoformat(start_date).date()
        end_date = datetime.fromisoformat(end_date).date()
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return ReportGenerator.generate_attendance_report_csv(
        start_date=start_date,
        end_date=end_date,
        course_id=course_id
    )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_student_summary(request):
    """Export student attendance summary as CSV."""
    course_id = request.GET.get('course_id')
    
    return ReportGenerator.generate_student_summary_csv(course_id=course_id)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def system_analytics(request):
    """Get system-wide analytics and statistics."""
    try:
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Basic counts
        total_students = Student.objects.filter(is_active=True).count()
        total_courses = Course.objects.filter(is_active=True).count()
        total_sessions = ClassSession.objects.count()
        total_attendance = AttendanceLog.objects.count()
        
        # Recent activity
        today_attendance = AttendanceLog.objects.filter(timestamp__date=today).count()
        week_attendance = AttendanceLog.objects.filter(timestamp__date__gte=week_ago).count()
        month_attendance = AttendanceLog.objects.filter(timestamp__date__gte=month_ago).count()
        
        # Active sessions
        active_sessions = ClassSession.objects.filter(
            session_date=today,
            attendance_started=True,
            attendance_ended=False
        ).count()
        
        # Recognition method stats
        method_stats = AttendanceLog.objects.values('method').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Top courses by attendance
        top_courses = AttendanceLog.objects.values(
            'session__course__course_code',
            'session__course__course_name'
        ).annotate(
            attendance_count=Count('id')
        ).order_by('-attendance_count')[:10]
        
        # Face recognition coverage
        students_with_encodings = Student.objects.filter(
            is_active=True,
            face_encoding__isnull=False
        ).count()
        
        encoding_coverage = (students_with_encodings / total_students * 100) if total_students > 0 else 0
        
        return Response({
            'basic_stats': {
                'total_students': total_students,
                'total_courses': total_courses,
                'total_sessions': total_sessions,
                'total_attendance': total_attendance
            },
            'recent_activity': {
                'today_attendance': today_attendance,
                'week_attendance': week_attendance,
                'month_attendance': month_attendance,
                'active_sessions': active_sessions
            },
            'method_stats': list(method_stats),
            'top_courses': list(top_courses),
            'face_recognition': {
                'students_with_encodings': students_with_encodings,
                'encoding_coverage': round(encoding_coverage, 2)
            }
        })
        
    except Exception as e:
        return Response(
            {'error': f'Error generating system analytics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def register_teacher(request):
    """
    Register a new teacher account.
    Only admin users can create teacher accounts.
    """
    if not request.user.is_superuser:
        return Response(
            {'error': 'Only administrators can register teachers'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    # Validate required fields
    if not all([username, email, password]):
        return Response(
            {'error': 'Username, email, and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Enhanced validation
    if len(password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters long'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': f'User with username "{username}" already exists'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': f'User with email "{email}" already exists'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create teacher user
        teacher = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True,  # Teachers need staff permissions
            is_active=True
        )
        
        return Response({
            'message': f'Teacher {teacher.username} created successfully',
            'teacher': UserSerializer(teacher).data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Error creating teacher: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_register_teachers(request):
    """
    Bulk register multiple teachers from CSV data.
    Only admin users can bulk create teacher accounts.
    """
    if not request.user.is_superuser:
        return Response(
            {'error': 'Only administrators can bulk register teachers'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    teachers_data = request.data.get('teachers', [])
    if not teachers_data:
        return Response(
            {'error': 'No teacher data provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    created_teachers = []
    errors = []
    
    for teacher_data in teachers_data:
        try:
            username = teacher_data.get('username')
            email = teacher_data.get('email')
            password = teacher_data.get('password', 'TempPass123!')
            first_name = teacher_data.get('first_name', '')
            last_name = teacher_data.get('last_name', '')
            
            if not all([username, email]):
                errors.append(f'Missing required fields for {username or email}')
                continue
            
            if User.objects.filter(username=username).exists():
                errors.append(f'Username {username} already exists')
                continue
                
            if User.objects.filter(email=email).exists():
                errors.append(f'Email {email} already exists')
                continue
            
            teacher = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=True,
                is_active=True
            )
            
            created_teachers.append(UserSerializer(teacher).data)
            
        except Exception as e:
            errors.append(f'Error creating {username}: {str(e)}')
    
    return Response({
        'created_teachers': created_teachers,
        'created_count': len(created_teachers),
        'errors': errors,
        'error_count': len(errors)
    }, status=status.HTTP_201_CREATED if created_teachers else status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_teachers(request):
    """Get list of all teachers (staff users)."""
    teachers = User.objects.filter(is_staff=True, is_active=True).order_by('last_name', 'first_name')
    serializer = UserSerializer(teachers, many=True)
    return Response({
        'teachers': serializer.data,
        'count': teachers.count()
    })

@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_teacher(request, teacher_id):
    """Update teacher information. Only admins or the teacher themselves can update."""
    try:
        teacher = User.objects.get(id=teacher_id, is_staff=True)
    except User.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check permissions
    if not (request.user.is_superuser or request.user.id == teacher.id):
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update fields
    teacher.first_name = request.data.get('first_name', teacher.first_name)
    teacher.last_name = request.data.get('last_name', teacher.last_name)
    teacher.email = request.data.get('email', teacher.email)
    
    # Only admins can change active status
    if request.user.is_superuser:
        teacher.is_active = request.data.get('is_active', teacher.is_active)
    
    try:
        teacher.save()
        return Response({
            'message': 'Teacher updated successfully',
            'teacher': UserSerializer(teacher).data
        })
    except Exception as e:
        return Response(
            {'error': f'Error updating teacher: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
