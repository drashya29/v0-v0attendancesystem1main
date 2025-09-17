#!/usr/bin/env python
"""
Script to create an admin user for the attendance system.
Run this to create your first admin account.
"""

import os
import sys
import django
from django.contrib.auth.models import User
from django.core.management import execute_from_command_line

def create_admin_user():
    """Create an admin user interactively."""
    print("=== Attendance System Admin User Creation ===\n")
    
    # Get admin details
    username = input("Enter admin username: ").strip()
    if not username:
        print("Username cannot be empty!")
        return
    
    email = input("Enter admin email: ").strip()
    if not email:
        print("Email cannot be empty!")
        return
    
    password = input("Enter admin password: ").strip()
    if not password:
        print("Password cannot be empty!")
        return
    
    first_name = input("Enter first name (optional): ").strip()
    last_name = input("Enter last name (optional): ").strip()
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        print(f"❌ User '{username}' already exists!")
        return
    
    if User.objects.filter(email=email).exists():
        print(f"❌ User with email '{email}' already exists!")
        return
    
    try:
        # Create superuser
        admin_user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        print(f"\n✅ Admin user '{username}' created successfully!")
        print(f"📧 Email: {email}")
        print(f"👤 Name: {first_name} {last_name}")
        print(f"🔑 Role: Administrator (Superuser)")
        print(f"\n🚀 You can now login at the admin dashboard!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")

def create_sample_teacher():
    """Create a sample teacher for testing."""
    try:
        if not User.objects.filter(username="teacher1").exists():
            teacher = User.objects.create_user(
                username="teacher1",
                email="teacher@school.edu",
                password="teacher123",
                first_name="John",
                last_name="Teacher",
                is_staff=True,
                is_active=True
            )
            print(f"✅ Sample teacher 'teacher1' created!")
            print(f"📧 Email: teacher@school.edu")
            print(f"🔑 Password: teacher123")
        else:
            print("ℹ️  Sample teacher already exists")
    except Exception as e:
        print(f"❌ Error creating sample teacher: {str(e)}")

if __name__ == "__main__":
    # Setup Django environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
    django.setup()
    
    print("Creating admin user...")
    create_admin_user()
    
    print("\n" + "="*50)
    create_sample = input("\nCreate sample teacher account? (y/n): ").strip().lower()
    if create_sample in ['y', 'yes']:
        create_sample_teacher()
    
    print("\n🎉 Setup complete! You can now login to the system.")
