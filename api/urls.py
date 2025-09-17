"""
URL configuration for the API app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'students', views.StudentViewSet)
router.register(r'courses', views.CourseViewSet)
router.register(r'sessions', views.ClassSessionViewSet)
router.register(r'attendance', views.AttendanceLogViewSet)

urlpatterns = [
    # Authentication endpoints
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.user_profile, name='user_profile'),
    
    # Teacher management endpoints
    path('teachers/register/', views.register_teacher, name='register_teacher'),
    path('teachers/', views.list_teachers, name='list_teachers'),
    path('teachers/<int:teacher_id>/', views.update_teacher, name='update_teacher'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    
    # Analytics and reporting endpoints
    path('analytics/trends/', views.attendance_trends, name='attendance_trends'),
    path('analytics/student-performance/', views.student_performance, name='student_performance'),
    path('analytics/at-risk-students/', views.at_risk_students, name='at_risk_students'),
    path('analytics/course/<uuid:course_id>/', views.course_analytics, name='course_analytics'),
    path('analytics/system/', views.system_analytics, name='system_analytics'),
    
    # Export endpoints
    path('reports/attendance/export/', views.export_attendance_report, name='export_attendance_report'),
    path('reports/students/export/', views.export_student_summary, name='export_student_summary'),
    
    # Facial recognition endpoints
    path('face-recognition/', include('facial_recognition.urls')),
    
    # Include router URLs
    path('', include(router.urls)),
]
