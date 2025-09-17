"""
Custom permissions for the attendance system.
"""
from rest_framework import permissions

class IsInstructorOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow instructors or admins to modify courses.
    """
    
    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for staff users
        return request.user and request.user.is_authenticated and request.user.is_staff

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only to the owner of the object
        return obj.instructor == request.user or request.user.is_staff
