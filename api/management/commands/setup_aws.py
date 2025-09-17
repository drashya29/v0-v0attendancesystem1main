"""
Management command to help set up AWS S3 integration.
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import boto3
from botocore.exceptions import ClientError, NoCredentialsError


class Command(BaseCommand):
    help = 'Test AWS S3 connection and setup'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-bucket',
            action='store_true',
            help='Create the S3 bucket if it does not exist',
        )
        parser.add_argument(
            '--test-upload',
            action='store_true',
            help='Test file upload to S3',
        )

    def handle(self, *args, **options):
        if not settings.USE_S3:
            self.stdout.write(
                self.style.WARNING('S3 is not enabled. Set USE_S3=True in your environment.')
            )
            return

        try:
            # Initialize S3 client
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )

            bucket_name = settings.AWS_STORAGE_BUCKET_NAME

            # Test connection
            self.stdout.write('Testing AWS S3 connection...')
            try:
                s3_client.head_bucket(Bucket=bucket_name)
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Successfully connected to bucket: {bucket_name}')
                )
            except ClientError as e:
                error_code = int(e.response['Error']['Code'])
                if error_code == 404:
                    self.stdout.write(
                        self.style.WARNING(f'Bucket {bucket_name} does not exist.')
                    )
                    if options['create_bucket']:
                        self.create_bucket(s3_client, bucket_name)
                    else:
                        self.stdout.write('Use --create-bucket to create it.')
                        return
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Error accessing bucket: {e}')
                    )
                    return

            # Test upload if requested
            if options['test_upload']:
                self.test_upload(s3_client, bucket_name)

            # Display configuration
            self.display_config()

        except NoCredentialsError:
            self.stdout.write(
                self.style.ERROR('AWS credentials not found. Please check your environment variables.')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {e}')
            )

    def create_bucket(self, s3_client, bucket_name):
        """Create S3 bucket."""
        try:
            if settings.AWS_S3_REGION_NAME == 'us-east-1':
                s3_client.create_bucket(Bucket=bucket_name)
            else:
                s3_client.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': settings.AWS_S3_REGION_NAME}
                )
            
            # Set bucket policy for public read access to media files
            bucket_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": f"arn:aws:s3:::{bucket_name}/media/*"
                    }
                ]
            }
            
            s3_client.put_bucket_policy(
                Bucket=bucket_name,
                Policy=str(bucket_policy).replace("'", '"')
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created bucket: {bucket_name}')
            )
        except ClientError as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating bucket: {e}')
            )

    def test_upload(self, s3_client, bucket_name):
        """Test file upload to S3."""
        try:
            test_content = b'Test file for attendance system'
            s3_client.put_object(
                Bucket=bucket_name,
                Key='test/test-file.txt',
                Body=test_content,
                ContentType='text/plain'
            )
            self.stdout.write(
                self.style.SUCCESS('✓ Test file uploaded successfully')
            )
            
            # Clean up test file
            s3_client.delete_object(Bucket=bucket_name, Key='test/test-file.txt')
            self.stdout.write('✓ Test file cleaned up')
            
        except ClientError as e:
            self.stdout.write(
                self.style.ERROR(f'Error uploading test file: {e}')
            )

    def display_config(self):
        """Display current S3 configuration."""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('AWS S3 Configuration:')
        self.stdout.write('='*50)
        self.stdout.write(f'Bucket Name: {settings.AWS_STORAGE_BUCKET_NAME}')
        self.stdout.write(f'Region: {settings.AWS_S3_REGION_NAME}')
        self.stdout.write(f'Custom Domain: {getattr(settings, "AWS_S3_CUSTOM_DOMAIN", "None")}')
        self.stdout.write(f'Media URL: {settings.MEDIA_URL}')
        self.stdout.write(f'Static URL: {settings.STATIC_URL}')
        self.stdout.write('='*50)
