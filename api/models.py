"""
Database models for the attendance system.
"""
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
import uuid

if settings.USE_S3:
    from attendance_system.storage_backends import MediaStorage, PrivateMediaStorage
    student_photo_storage = MediaStorage()
else:
    student_photo_storage = None

class Student(models.Model):
    """Model for storing student information and facial encodings."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    enrollment_date = models.DateField(auto_now_add=True)
    photo = models.ImageField(
        upload_to='student_photos/', 
        null=True, 
        blank=True,
        storage=student_photo_storage
    )
    face_encoding = models.JSONField(null=True, blank=True)  # Store face encoding as JSON
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_photo_url(self):
        """Get the full URL for the student photo."""
        if self.photo:
            if settings.USE_S3:
                return self.photo.url
            else:
                return f"{settings.MEDIA_URL}{self.photo.name}"
        return None

class Course(models.Model):
    """Model for storing course information."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course_code = models.CharField(max_length=20, unique=True)
    course_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    students = models.ManyToManyField(Student, through='Enrollment', related_name='courses')
    credits = models.IntegerField(default=3)
    semester = models.CharField(max_length=20)
    year = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course_code']
        unique_together = ['course_code', 'semester', 'year']

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

class Enrollment(models.Model):
    """Model for student course enrollments."""
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrollment_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['student', 'course']

    def __str__(self):
        return f"{self.student.full_name} - {self.course.course_code}"

class ClassSession(models.Model):
    """Model for individual class sessions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    session_name = models.CharField(max_length=100)
    session_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    attendance_started = models.BooleanField(default=False)
    attendance_ended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-session_date', '-start_time']

    def __str__(self):
        return f"{self.course.course_code} - {self.session_name} ({self.session_date})"

class AttendanceLog(models.Model):
    """Model for storing attendance records."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_logs')
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='attendance_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    confidence_score = models.FloatField(default=0.0)  # Face recognition confidence
    method = models.CharField(max_length=20, choices=[
        ('facial_recognition', 'Facial Recognition'),
        ('manual', 'Manual Entry'),
        ('rfid', 'RFID Card'),
    ], default='facial_recognition')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['student', 'session']
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.student.full_name} - {self.session.session_name} ({self.timestamp})"

class SystemSettings(models.Model):
    """Model for storing system configuration."""
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.key}: {self.value[:50]}"
