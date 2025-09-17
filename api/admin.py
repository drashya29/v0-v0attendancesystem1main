"""
Django admin configuration for the attendance system.
"""
from django.contrib import admin
from .models import Student, Course, Enrollment, ClassSession, AttendanceLog, SystemSettings

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'first_name', 'last_name', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'enrollment_date']
    search_fields = ['student_id', 'first_name', 'last_name', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_name', 'instructor', 'semester', 'year', 'is_active']
    list_filter = ['semester', 'year', 'is_active']
    search_fields = ['course_code', 'course_name']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'enrollment_date', 'is_active']
    list_filter = ['enrollment_date', 'is_active']
    search_fields = ['student__student_id', 'course__course_code']

@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ['course', 'session_name', 'session_date', 'start_time', 'attendance_started', 'attendance_ended']
    list_filter = ['session_date', 'attendance_started', 'attendance_ended']
    search_fields = ['course__course_code', 'session_name']
    readonly_fields = ['id', 'created_at']

@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ['student', 'session', 'timestamp', 'confidence_score', 'method']
    list_filter = ['timestamp', 'method']
    search_fields = ['student__student_id', 'session__session_name']
    readonly_fields = ['id', 'timestamp']

@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'updated_at', 'updated_by']
    search_fields = ['key', 'description']
    readonly_fields = ['updated_at']
