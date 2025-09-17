"""
Script to bulk import teachers from CSV file.
CSV format: username,email,password,first_name,last_name
"""
import os
import sys
import django
import csv
from django.core.exceptions import ValidationError

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from django.contrib.auth.models import User

def bulk_import_teachers(csv_file_path):
    """
    Import teachers from CSV file.
    
    CSV format:
    username,email,password,first_name,last_name
    john_doe,john@school.edu,password123,John,Doe
    """
    if not os.path.exists(csv_file_path):
        print(f"Error: File {csv_file_path} not found")
        return
    
    created_count = 0
    error_count = 0
    
    with open(csv_file_path, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        # Validate headers
        required_headers = ['username', 'email', 'password']
        if not all(header in reader.fieldnames for header in required_headers):
            print(f"Error: CSV must contain headers: {', '.join(required_headers)}")
            print(f"Optional headers: first_name, last_name")
            return
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 because of header
            try:
                username = row['username'].strip()
                email = row['email'].strip()
                password = row['password'].strip()
                first_name = row.get('first_name', '').strip()
                last_name = row.get('last_name', '').strip()
                
                # Validate required fields
                if not all([username, email, password]):
                    print(f"Row {row_num}: Missing required fields (username, email, password)")
                    error_count += 1
                    continue
                
                # Check if user already exists
                if User.objects.filter(username=username).exists():
                    print(f"Row {row_num}: User '{username}' already exists - skipping")
                    error_count += 1
                    continue
                
                if User.objects.filter(email=email).exists():
                    print(f"Row {row_num}: Email '{email}' already exists - skipping")
                    error_count += 1
                    continue
                
                # Create teacher
                teacher = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_staff=True,  # Teachers need staff permissions
                    is_active=True
                )
                
                print(f"✓ Created teacher: {username} ({email})")
                created_count += 1
                
            except ValidationError as e:
                print(f"Row {row_num}: Validation error - {e}")
                error_count += 1
            except Exception as e:
                print(f"Row {row_num}: Unexpected error - {e}")
                error_count += 1
    
    print(f"\nImport completed:")
    print(f"✓ Successfully created: {created_count} teachers")
    print(f"✗ Errors: {error_count}")

def create_sample_csv():
    """Create a sample CSV file for reference."""
    sample_data = [
        ['username', 'email', 'password', 'first_name', 'last_name'],
        ['john_smith', 'john.smith@school.edu', 'password123', 'John', 'Smith'],
        ['mary_johnson', 'mary.johnson@school.edu', 'secure456', 'Mary', 'Johnson'],
        ['david_brown', 'david.brown@school.edu', 'teacher789', 'David', 'Brown'],
    ]
    
    with open('sample_teachers.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(sample_data)
    
    print("Created sample_teachers.csv with example data")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Bulk import teachers from CSV')
    parser.add_argument('csv_file', nargs='?', help='Path to CSV file containing teacher data')
    parser.add_argument('--create-sample', action='store_true', help='Create a sample CSV file')
    
    args = parser.parse_args()
    
    if args.create_sample:
        create_sample_csv()
    elif args.csv_file:
        bulk_import_teachers(args.csv_file)
    else:
        print("Usage:")
        print("  python scripts/bulk_import_teachers.py teachers.csv")
        print("  python scripts/bulk_import_teachers.py --create-sample")
