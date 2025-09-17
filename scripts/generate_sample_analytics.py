"""
Script to generate sample analytics data for testing.
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone
import random

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from api.models import Student, Course, ClassSession, AttendanceLog
from api.analytics import AttendanceAnalytics, ReportGenerator

def generate_sample_analytics():
    """Generate sample analytics data for demonstration."""
    
    print("Generating sample analytics data...")
    
    # Get existing data
    students = list(Student.objects.filter(is_active=True))
    courses = list(Course.objects.filter(is_active=True))
    
    if not students or not courses:
        print("No students or courses found. Please run create_sample_data.py first.")
        return
    
    # Generate additional sessions and attendance for better analytics
    today = timezone.now().date()
    
    for course in courses:
        # Create sessions for the past 60 days
        for i in range(60):
            session_date = today - timedelta(days=i)
            
            # Skip weekends
            if session_date.weekday() >= 5:
                continue
            
            session, created = ClassSession.objects.get_or_create(
                course=course,
                session_name=f"Session {60-i}",
                session_date=session_date,
                defaults={
                    'start_time': "09:00",
                    'end_time': "10:30",
                    'location': f"Room {101 + courses.index(course)}",
                    'attendance_started': True,
                    'attendance_ended': True
                }
            )
            
            if created:
                # Generate attendance for enrolled students
                enrolled_students = course.students.filter(enrollment__is_active=True)
                
                for student in enrolled_students:
                    # Simulate varying attendance rates
                    attendance_probability = random.uniform(0.6, 0.95)  # 60-95% attendance
                    
                    if random.random() < attendance_probability:
                        AttendanceLog.objects.get_or_create(
                            student=student,
                            session=session,
                            defaults={
                                'confidence_score': random.uniform(0.75, 0.98),
                                'method': random.choice(['facial_recognition', 'manual'])
                            }
                        )
    
    print("Sample analytics data generated successfully!")
    
    # Generate some sample reports
    print("\nGenerating sample analytics reports...")
    
    # Attendance trends
    trends = AttendanceAnalytics.get_attendance_trends()
    print(f"Generated attendance trends for {len(trends.get('daily_attendance', []))} days")
    
    # Student performance
    performance = AttendanceAnalytics.get_student_performance()
    print(f"Generated performance data for {len(performance.get('performance_data', []))} student-course combinations")
    
    # At-risk students
    at_risk = AttendanceAnalytics.get_at_risk_students()
    print(f"Identified {len(at_risk)} at-risk students")
    
    # Course analytics
    for course in courses[:2]:  # Sample first 2 courses
        analytics = AttendanceAnalytics.get_course_analytics(str(course.id))
        print(f"Generated analytics for course {course.course_code}")
    
    print("\nSample analytics generation completed!")

if __name__ == '__main__':
    generate_sample_analytics()
