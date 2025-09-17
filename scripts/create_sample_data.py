"""
Script to create sample data for testing the attendance system.
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Student, Course, Enrollment, ClassSession, AttendanceLog

def create_sample_data():
    """Create sample data for testing."""
    
    # Create admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"Created admin user: {admin_user.username}")
    
    # Create instructor user
    instructor, created = User.objects.get_or_create(
        username='instructor',
        defaults={
            'email': 'instructor@example.com',
            'first_name': 'John',
            'last_name': 'Smith',
            'is_staff': True
        }
    )
    if created:
        instructor.set_password('instructor123')
        instructor.save()
        print(f"Created instructor: {instructor.username}")
    
    # Create sample students
    students_data = [
        {'student_id': 'STU001', 'first_name': 'Alice', 'last_name': 'Johnson', 'email': 'alice@example.com'},
        {'student_id': 'STU002', 'first_name': 'Bob', 'last_name': 'Williams', 'email': 'bob@example.com'},
        {'student_id': 'STU003', 'first_name': 'Charlie', 'last_name': 'Brown', 'email': 'charlie@example.com'},
        {'student_id': 'STU004', 'first_name': 'Diana', 'last_name': 'Davis', 'email': 'diana@example.com'},
        {'student_id': 'STU005', 'first_name': 'Eve', 'last_name': 'Miller', 'email': 'eve@example.com'},
    ]
    
    students = []
    for student_data in students_data:
        student, created = Student.objects.get_or_create(
            student_id=student_data['student_id'],
            defaults=student_data
        )
        students.append(student)
        if created:
            print(f"Created student: {student.full_name}")
    
    # Create sample courses
    courses_data = [
        {
            'course_code': 'CS101',
            'course_name': 'Introduction to Computer Science',
            'description': 'Basic concepts of computer science and programming.',
            'credits': 3,
            'semester': 'Fall',
            'year': 2024
        },
        {
            'course_code': 'MATH201',
            'course_name': 'Calculus II',
            'description': 'Advanced calculus concepts and applications.',
            'credits': 4,
            'semester': 'Fall',
            'year': 2024
        },
        {
            'course_code': 'ENG101',
            'course_name': 'English Composition',
            'description': 'Writing and communication skills.',
            'credits': 3,
            'semester': 'Fall',
            'year': 2024
        }
    ]
    
    courses = []
    for course_data in courses_data:
        course_data['instructor'] = instructor
        course, created = Course.objects.get_or_create(
            course_code=course_data['course_code'],
            semester=course_data['semester'],
            year=course_data['year'],
            defaults=course_data
        )
        courses.append(course)
        if created:
            print(f"Created course: {course.course_name}")
    
    # Enroll students in courses
    for course in courses:
        for student in students[:3]:  # Enroll first 3 students in each course
            enrollment, created = Enrollment.objects.get_or_create(
                student=student,
                course=course
            )
            if created:
                print(f"Enrolled {student.full_name} in {course.course_code}")
    
    # Create sample class sessions
    today = timezone.now().date()
    for i, course in enumerate(courses):
        for j in range(5):  # 5 sessions per course
            session_date = today - timedelta(days=j)
            session, created = ClassSession.objects.get_or_create(
                course=course,
                session_name=f"Lecture {5-j}",
                session_date=session_date,
                defaults={
                    'start_time': f"{9 + i}:00",
                    'end_time': f"{10 + i}:30",
                    'location': f"Room {101 + i}",
                    'attendance_started': j < 2,  # Last 2 sessions have started
                    'attendance_ended': j > 2     # First 3 sessions have ended
                }
            )
            if created:
                print(f"Created session: {session.session_name} for {course.course_code}")
    
    # Create sample attendance logs
    sessions = ClassSession.objects.all()
    for session in sessions:
        enrolled_students = session.course.students.filter(enrollment__is_active=True)
        for student in enrolled_students:
            # 80% attendance rate
            if hash(f"{student.id}{session.id}") % 10 < 8:
                attendance, created = AttendanceLog.objects.get_or_create(
                    student=student,
                    session=session,
                    defaults={
                        'confidence_score': 0.85 + (hash(f"{student.id}{session.id}") % 15) / 100,
                        'method': 'facial_recognition'
                    }
                )
                if created:
                    print(f"Created attendance: {student.full_name} - {session.session_name}")
    
    print("\nSample data creation completed!")
    print("Login credentials:")
    print("Admin: username='admin', password='admin123'")
    print("Instructor: username='instructor', password='instructor123'")

if __name__ == '__main__':
    create_sample_data()
