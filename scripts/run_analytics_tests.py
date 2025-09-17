"""
Script to test analytics functionality.
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from api.analytics import AttendanceAnalytics, ReportGenerator
from api.models import Course

def test_analytics():
    """Test all analytics functions."""
    
    print("Testing Analytics Functions")
    print("=" * 50)
    
    # Test attendance trends
    print("\n1. Testing Attendance Trends...")
    trends = AttendanceAnalytics.get_attendance_trends()
    print(f"   - Total attendance records: {trends.get('total_attendance', 0)}")
    print(f"   - Daily data points: {len(trends.get('daily_attendance', []))}")
    print(f"   - Weekly data points: {len(trends.get('weekly_attendance', []))}")
    print(f"   - Course breakdown: {len(trends.get('course_breakdown', []))}")
    
    # Test student performance
    print("\n2. Testing Student Performance...")
    performance = AttendanceAnalytics.get_student_performance()
    print(f"   - Students analyzed: {len(performance.get('performance_data', []))}")
    print(f"   - Average attendance rate: {performance.get('summary', {}).get('average_attendance_rate', 0)}%")
    
    # Test at-risk students
    print("\n3. Testing At-Risk Students...")
    at_risk = AttendanceAnalytics.get_at_risk_students()
    print(f"   - At-risk students found: {len(at_risk)}")
    if at_risk:
        print(f"   - Lowest attendance rate: {at_risk[0]['attendance_stats']['attendance_rate']}%")
    
    # Test course analytics
    print("\n4. Testing Course Analytics...")
    courses = Course.objects.filter(is_active=True)[:2]
    for course in courses:
        analytics = AttendanceAnalytics.get_course_analytics(str(course.id))
        if 'error' not in analytics:
            print(f"   - Course {course.course_code}:")
            print(f"     * Total students: {analytics['basic_stats']['total_students']}")
            print(f"     * Completed sessions: {analytics['basic_stats']['completed_sessions']}")
            print(f"     * Avg attendance/session: {analytics['basic_stats']['average_attendance_per_session']}")
    
    print("\n" + "=" * 50)
    print("Analytics testing completed!")

if __name__ == '__main__':
    test_analytics()
