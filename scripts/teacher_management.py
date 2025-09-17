"""
Interactive script for teacher management operations.
"""
import os
import sys
import django
from getpass import getpass

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

def create_teacher_interactive():
    """Interactive teacher creation."""
    print("\n=== Create New Teacher ===")
    
    username = input("Username: ").strip()
    email = input("Email: ").strip()
    first_name = input("First Name (optional): ").strip()
    last_name = input("Last Name (optional): ").strip()
    password = getpass("Password: ")
    confirm_password = getpass("Confirm Password: ")
    
    if password != confirm_password:
        print("❌ Passwords don't match!")
        return
    
    if not all([username, email, password]):
        print("❌ Username, email, and password are required!")
        return
    
    try:
        # Check if user exists
        if User.objects.filter(username=username).exists():
            print(f"❌ Username '{username}' already exists!")
            return
        
        if User.objects.filter(email=email).exists():
            print(f"❌ Email '{email}' already exists!")
            return
        
        # Create teacher
        teacher = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True,
            is_active=True
        )
        
        print(f"✅ Teacher '{username}' created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {first_name} {last_name}")
        
    except ValidationError as e:
        print(f"❌ Validation error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

def list_teachers():
    """List all teachers."""
    print("\n=== All Teachers ===")
    teachers = User.objects.filter(is_staff=True).order_by('last_name', 'first_name')
    
    if not teachers:
        print("No teachers found.")
        return
    
    print(f"{'Username':<20} {'Email':<30} {'Name':<25} {'Active'}")
    print("-" * 80)
    
    for teacher in teachers:
        full_name = f"{teacher.first_name} {teacher.last_name}".strip()
        status = "✅" if teacher.is_active else "❌"
        print(f"{teacher.username:<20} {teacher.email:<30} {full_name:<25} {status}")
    
    print(f"\nTotal: {teachers.count()} teachers")

def deactivate_teacher():
    """Deactivate a teacher account."""
    print("\n=== Deactivate Teacher ===")
    username = input("Enter username to deactivate: ").strip()
    
    try:
        teacher = User.objects.get(username=username, is_staff=True)
        
        if not teacher.is_active:
            print(f"❌ Teacher '{username}' is already inactive!")
            return
        
        confirm = input(f"Are you sure you want to deactivate '{username}'? (y/N): ")
        if confirm.lower() != 'y':
            print("Operation cancelled.")
            return
        
        teacher.is_active = False
        teacher.save()
        
        print(f"✅ Teacher '{username}' has been deactivated.")
        
    except User.DoesNotExist:
        print(f"❌ Teacher '{username}' not found!")
    except Exception as e:
        print(f"❌ Error: {e}")

def reset_teacher_password():
    """Reset a teacher's password."""
    print("\n=== Reset Teacher Password ===")
    username = input("Enter username: ").strip()
    
    try:
        teacher = User.objects.get(username=username, is_staff=True)
        
        new_password = getpass("New Password: ")
        confirm_password = getpass("Confirm Password: ")
        
        if new_password != confirm_password:
            print("❌ Passwords don't match!")
            return
        
        if len(new_password) < 8:
            print("❌ Password must be at least 8 characters long!")
            return
        
        teacher.set_password(new_password)
        teacher.save()
        
        print(f"✅ Password reset for teacher '{username}'")
        
    except User.DoesNotExist:
        print(f"❌ Teacher '{username}' not found!")
    except Exception as e:
        print(f"❌ Error: {e}")

def main_menu():
    """Main menu for teacher management."""
    while True:
        print("\n" + "="*50)
        print("TEACHER MANAGEMENT SYSTEM")
        print("="*50)
        print("1. Create New Teacher")
        print("2. List All Teachers")
        print("3. Deactivate Teacher")
        print("4. Reset Teacher Password")
        print("5. Exit")
        print("-"*50)
        
        choice = input("Select an option (1-5): ").strip()
        
        if choice == '1':
            create_teacher_interactive()
        elif choice == '2':
            list_teachers()
        elif choice == '3':
            deactivate_teacher()
        elif choice == '4':
            reset_teacher_password()
        elif choice == '5':
            print("Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please select 1-5.")

if __name__ == '__main__':
    main_menu()
