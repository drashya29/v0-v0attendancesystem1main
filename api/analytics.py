"""
Analytics and reporting functionality for the attendance system.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from django.http import HttpResponse
import csv
import json

from .models import Student, Course, ClassSession, AttendanceLog, Enrollment

logger = logging.getLogger(__name__)

class AttendanceAnalytics:
    """
    Class for generating attendance analytics and reports.
    """
    
    @staticmethod
    def get_attendance_trends(
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        course_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get attendance trends over time.
        
        Args:
            start_date: Start date for analysis
            end_date: End date for analysis
            course_id: Optional course filter
            
        Returns:
            Dictionary with trend data
        """
        try:
            # Default to last 30 days if no dates provided
            if not end_date:
                end_date = timezone.now().date()
            if not start_date:
                start_date = end_date - timedelta(days=30)
            
            # Base queryset
            queryset = AttendanceLog.objects.filter(
                timestamp__date__gte=start_date,
                timestamp__date__lte=end_date
            )
            
            if course_id:
                queryset = queryset.filter(session__course_id=course_id)
            
            # Daily attendance counts
            daily_attendance = queryset.extra(
                select={'date': 'DATE(timestamp)'}
            ).values('date').annotate(
                count=Count('id')
            ).order_by('date')
            
            # Weekly attendance averages
            weekly_data = []
            current_date = start_date
            while current_date <= end_date:
                week_end = min(current_date + timedelta(days=6), end_date)
                week_attendance = queryset.filter(
                    timestamp__date__gte=current_date,
                    timestamp__date__lte=week_end
                ).count()
                
                weekly_data.append({
                    'week_start': current_date.isoformat(),
                    'week_end': week_end.isoformat(),
                    'attendance_count': week_attendance
                })
                
                current_date = week_end + timedelta(days=1)
            
            # Course-wise breakdown
            course_breakdown = queryset.values(
                'session__course__course_code',
                'session__course__course_name'
            ).annotate(
                attendance_count=Count('id'),
                unique_students=Count('student', distinct=True)
            ).order_by('-attendance_count')
            
            return {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                },
                'daily_attendance': list(daily_attendance),
                'weekly_attendance': weekly_data,
                'course_breakdown': list(course_breakdown),
                'total_attendance': queryset.count()
            }
            
        except Exception as e:
            logger.error(f"Error generating attendance trends: {str(e)}")
            return {}
    
    @staticmethod
    def get_student_performance(
        student_id: Optional[str] = None,
        course_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get student attendance performance metrics.
        
        Args:
            student_id: Optional student filter
            course_id: Optional course filter
            
        Returns:
            Dictionary with performance data
        """
        try:
            # Base queryset for enrollments
            enrollments = Enrollment.objects.filter(is_active=True)
            
            if student_id:
                enrollments = enrollments.filter(student_id=student_id)
            if course_id:
                enrollments = enrollments.filter(course_id=course_id)
            
            performance_data = []
            
            for enrollment in enrollments.select_related('student', 'course'):
                # Get all sessions for this course
                total_sessions = ClassSession.objects.filter(
                    course=enrollment.course,
                    attendance_ended=True
                ).count()
                
                # Get attended sessions
                attended_sessions = AttendanceLog.objects.filter(
                    student=enrollment.student,
                    session__course=enrollment.course
                ).count()
                
                # Calculate attendance rate
                attendance_rate = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0
                
                # Get recent attendance pattern (last 10 sessions)
                recent_sessions = ClassSession.objects.filter(
                    course=enrollment.course,
                    attendance_ended=True
                ).order_by('-session_date')[:10]
                
                recent_attendance = []
                for session in recent_sessions:
                    attended = AttendanceLog.objects.filter(
                        student=enrollment.student,
                        session=session
                    ).exists()
                    recent_attendance.append({
                        'session_date': session.session_date.isoformat(),
                        'session_name': session.session_name,
                        'attended': attended
                    })
                
                performance_data.append({
                    'student': {
                        'id': str(enrollment.student.id),
                        'name': enrollment.student.full_name,
                        'student_id': enrollment.student.student_id
                    },
                    'course': {
                        'id': str(enrollment.course.id),
                        'code': enrollment.course.course_code,
                        'name': enrollment.course.course_name
                    },
                    'attendance_stats': {
                        'total_sessions': total_sessions,
                        'attended_sessions': attended_sessions,
                        'attendance_rate': round(attendance_rate, 2)
                    },
                    'recent_attendance': recent_attendance
                })
            
            return {
                'performance_data': performance_data,
                'summary': {
                    'total_students': len(performance_data),
                    'average_attendance_rate': round(
                        sum(p['attendance_stats']['attendance_rate'] for p in performance_data) / len(performance_data)
                        if performance_data else 0, 2
                    )
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating student performance: {str(e)}")
            return {}
    
    @staticmethod
    def get_at_risk_students(threshold: float = 75.0) -> List[Dict[str, Any]]:
        """
        Identify students with low attendance rates.
        
        Args:
            threshold: Attendance rate threshold (default 75%)
            
        Returns:
            List of at-risk students
        """
        try:
            at_risk_students = []
            
            # Get all active enrollments
            enrollments = Enrollment.objects.filter(
                is_active=True
            ).select_related('student', 'course')
            
            for enrollment in enrollments:
                # Calculate attendance rate
                total_sessions = ClassSession.objects.filter(
                    course=enrollment.course,
                    attendance_ended=True
                ).count()
                
                if total_sessions == 0:
                    continue
                
                attended_sessions = AttendanceLog.objects.filter(
                    student=enrollment.student,
                    session__course=enrollment.course
                ).count()
                
                attendance_rate = (attended_sessions / total_sessions * 100)
                
                if attendance_rate < threshold:
                    # Get recent absences
                    recent_absences = ClassSession.objects.filter(
                        course=enrollment.course,
                        attendance_ended=True
                    ).exclude(
                        attendance_logs__student=enrollment.student
                    ).order_by('-session_date')[:5]
                    
                    at_risk_students.append({
                        'student': {
                            'id': str(enrollment.student.id),
                            'name': enrollment.student.full_name,
                            'student_id': enrollment.student.student_id,
                            'email': enrollment.student.email
                        },
                        'course': {
                            'id': str(enrollment.course.id),
                            'code': enrollment.course.course_code,
                            'name': enrollment.course.course_name
                        },
                        'attendance_stats': {
                            'total_sessions': total_sessions,
                            'attended_sessions': attended_sessions,
                            'attendance_rate': round(attendance_rate, 2),
                            'sessions_missed': total_sessions - attended_sessions
                        },
                        'recent_absences': [
                            {
                                'session_date': session.session_date.isoformat(),
                                'session_name': session.session_name
                            }
                            for session in recent_absences
                        ]
                    })
            
            # Sort by attendance rate (lowest first)
            at_risk_students.sort(key=lambda x: x['attendance_stats']['attendance_rate'])
            
            return at_risk_students
            
        except Exception as e:
            logger.error(f"Error identifying at-risk students: {str(e)}")
            return []
    
    @staticmethod
    def get_course_analytics(course_id: str) -> Dict[str, Any]:
        """
        Get comprehensive analytics for a specific course.
        
        Args:
            course_id: Course ID
            
        Returns:
            Dictionary with course analytics
        """
        try:
            course = Course.objects.get(id=course_id)
            
            # Basic stats
            total_students = course.students.filter(enrollment__is_active=True).count()
            total_sessions = course.sessions.count()
            completed_sessions = course.sessions.filter(attendance_ended=True).count()
            
            # Attendance stats
            total_attendance_records = AttendanceLog.objects.filter(
                session__course=course
            ).count()
            
            average_attendance_per_session = (
                total_attendance_records / completed_sessions
                if completed_sessions > 0 else 0
            )
            
            # Session-wise attendance
            session_attendance = []
            for session in course.sessions.filter(attendance_ended=True).order_by('session_date'):
                attendance_count = session.attendance_logs.count()
                attendance_rate = (attendance_count / total_students * 100) if total_students > 0 else 0
                
                session_attendance.append({
                    'session_id': str(session.id),
                    'session_name': session.session_name,
                    'session_date': session.session_date.isoformat(),
                    'attendance_count': attendance_count,
                    'attendance_rate': round(attendance_rate, 2)
                })
            
            # Top attending students
            top_students = AttendanceLog.objects.filter(
                session__course=course
            ).values(
                'student__id',
                'student__student_id',
                'student__first_name',
                'student__last_name'
            ).annotate(
                attendance_count=Count('id')
            ).order_by('-attendance_count')[:10]
            
            # Recognition method breakdown
            method_breakdown = AttendanceLog.objects.filter(
                session__course=course
            ).values('method').annotate(
                count=Count('id')
            ).order_by('-count')
            
            return {
                'course_info': {
                    'id': str(course.id),
                    'code': course.course_code,
                    'name': course.course_name,
                    'instructor': course.instructor.get_full_name()
                },
                'basic_stats': {
                    'total_students': total_students,
                    'total_sessions': total_sessions,
                    'completed_sessions': completed_sessions,
                    'average_attendance_per_session': round(average_attendance_per_session, 2)
                },
                'session_attendance': session_attendance,
                'top_students': list(top_students),
                'method_breakdown': list(method_breakdown)
            }
            
        except Course.DoesNotExist:
            return {'error': 'Course not found'}
        except Exception as e:
            logger.error(f"Error generating course analytics: {str(e)}")
            return {'error': str(e)}

class ReportGenerator:
    """
    Class for generating various types of reports.
    """
    
    @staticmethod
    def generate_attendance_report_csv(
        start_date: datetime,
        end_date: datetime,
        course_id: Optional[str] = None
    ) -> HttpResponse:
        """
        Generate CSV attendance report.
        
        Args:
            start_date: Report start date
            end_date: Report end date
            course_id: Optional course filter
            
        Returns:
            HTTP response with CSV file
        """
        try:
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="attendance_report_{start_date}_{end_date}.csv"'
            
            writer = csv.writer(response)
            
            # Write header
            writer.writerow([
                'Date', 'Time', 'Student ID', 'Student Name',
                'Course Code', 'Course Name', 'Session Name',
                'Confidence Score', 'Method'
            ])
            
            # Query attendance logs
            queryset = AttendanceLog.objects.filter(
                timestamp__date__gte=start_date,
                timestamp__date__lte=end_date
            ).select_related('student', 'session', 'session__course')
            
            if course_id:
                queryset = queryset.filter(session__course_id=course_id)
            
            # Write data rows
            for log in queryset.order_by('timestamp'):
                writer.writerow([
                    log.timestamp.date(),
                    log.timestamp.time(),
                    log.student.student_id,
                    log.student.full_name,
                    log.session.course.course_code,
                    log.session.course.course_name,
                    log.session.session_name,
                    log.confidence_score,
                    log.method
                ])
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating CSV report: {str(e)}")
            response = HttpResponse("Error generating report", status=500)
            return response
    
    @staticmethod
    def generate_student_summary_csv(course_id: Optional[str] = None) -> HttpResponse:
        """
        Generate CSV student attendance summary.
        
        Args:
            course_id: Optional course filter
            
        Returns:
            HTTP response with CSV file
        """
        try:
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="student_attendance_summary.csv"'
            
            writer = csv.writer(response)
            
            # Write header
            writer.writerow([
                'Student ID', 'Student Name', 'Email',
                'Course Code', 'Course Name',
                'Total Sessions', 'Attended Sessions',
                'Attendance Rate (%)', 'Status'
            ])
            
            # Query enrollments
            enrollments = Enrollment.objects.filter(is_active=True)
            if course_id:
                enrollments = enrollments.filter(course_id=course_id)
            
            # Write data rows
            for enrollment in enrollments.select_related('student', 'course'):
                total_sessions = ClassSession.objects.filter(
                    course=enrollment.course,
                    attendance_ended=True
                ).count()
                
                attended_sessions = AttendanceLog.objects.filter(
                    student=enrollment.student,
                    session__course=enrollment.course
                ).count()
                
                attendance_rate = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0
                
                status = 'Good' if attendance_rate >= 75 else 'At Risk' if attendance_rate >= 50 else 'Critical'
                
                writer.writerow([
                    enrollment.student.student_id,
                    enrollment.student.full_name,
                    enrollment.student.email,
                    enrollment.course.course_code,
                    enrollment.course.course_name,
                    total_sessions,
                    attended_sessions,
                    round(attendance_rate, 2),
                    status
                ])
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating student summary CSV: {str(e)}")
            response = HttpResponse("Error generating report", status=500)
            return response
