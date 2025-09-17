"""
Serializers for the attendance system API.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Student, Course, Enrollment, ClassSession, AttendanceLog

class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user information."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        read_only_fields = ['id']

class StudentSerializer(serializers.ModelSerializer):
    """Serializer for student model."""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'date_of_birth', 'enrollment_date',
            'photo', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'face_encoding']

class CourseSerializer(serializers.ModelSerializer):
    """Serializer for course model."""
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'course_code', 'course_name', 'description',
            'instructor', 'instructor_name', 'credits', 'semester',
            'year', 'is_active', 'student_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_student_count(self, obj):
        return obj.students.filter(enrollment__is_active=True).count()

class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for enrollment model."""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'student', 'course', 'student_name', 'course_name',
            'enrollment_date', 'is_active'
        ]

class ClassSessionSerializer(serializers.ModelSerializer):
    """Serializer for class session model."""
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    attendance_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassSession
        fields = [
            'id', 'course', 'course_name', 'session_name',
            'session_date', 'start_time', 'end_time', 'location',
            'is_active', 'attendance_started', 'attendance_ended',
            'attendance_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_attendance_count(self, obj):
        return obj.attendance_logs.count()

class AttendanceLogSerializer(serializers.ModelSerializer):
    """Serializer for attendance log model."""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    session_name = serializers.CharField(source='session.session_name', read_only=True)
    course_name = serializers.CharField(source='session.course.course_name', read_only=True)
    
    class Meta:
        model = AttendanceLog
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'session', 'session_name', 'course_name',
            'timestamp', 'confidence_score', 'method',
            'verified_by', 'notes'
        ]
        read_only_fields = ['id', 'timestamp']
