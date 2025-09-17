"""
URL configuration for facial recognition app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('process-student/', views.process_student_face, name='process_student_face'),
    path('recognize-attendance/', views.recognize_attendance, name='recognize_attendance'),
    path('status/<str:task_id>/', views.recognition_status, name='recognition_status'),
    path('batch-process/', views.batch_process_students, name='batch_process_students'),
    path('system-status/', views.system_status, name='system_status'),
]
