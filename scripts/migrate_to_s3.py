"""
Script to migrate existing local media files to S3.
"""
import os
import boto3
from django.conf import settings
from django.core.files.storage import default_storage
from api.models import Student


def migrate_student_photos_to_s3():
    """Migrate existing student photos from local storage to S3."""
    if not settings.USE_S3:
        print("S3 is not enabled. Please set USE_S3=True in your environment.")
        return

    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )

    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    migrated_count = 0
    error_count = 0

    print("Starting migration of student photos to S3...")

    for student in Student.objects.filter(photo__isnull=False):
        try:
            # Get the local file path
            local_path = student.photo.path
            
            if os.path.exists(local_path):
                # Upload to S3
                s3_key = f"media/{student.photo.name}"
                
                with open(local_path, 'rb') as file_data:
                    s3_client.upload_fileobj(
                        file_data,
                        bucket_name,
                        s3_key,
                        ExtraArgs={
                            'ContentType': 'image/jpeg',
                            'ACL': 'public-read'
                        }
                    )
                
                print(f"✓ Migrated photo for {student.full_name}")
                migrated_count += 1
            else:
                print(f"✗ Local file not found for {student.full_name}: {local_path}")
                error_count += 1
                
        except Exception as e:
            print(f"✗ Error migrating photo for {student.full_name}: {e}")
            error_count += 1

    print(f"\nMigration completed:")
    print(f"Successfully migrated: {migrated_count} photos")
    print(f"Errors: {error_count}")


if __name__ == "__main__":
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
    django.setup()
    
    migrate_student_photos_to_s3()
