"""
Management command to create teacher accounts.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class Command(BaseCommand):
    help = 'Create a new teacher account'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username for the teacher')
        parser.add_argument('email', type=str, help='Email for the teacher')
        parser.add_argument('--first-name', type=str, help='First name')
        parser.add_argument('--last-name', type=str, help='Last name')
        parser.add_argument('--password', type=str, help='Password (will prompt if not provided)')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        first_name = options.get('first_name', '')
        last_name = options.get('last_name', '')
        password = options.get('password')

        if not password:
            password = input('Enter password for teacher: ')

        try:
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.ERROR(f'User with username "{username}" already exists')
                )
                return

            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.ERROR(f'User with email "{email}" already exists')
                )
                return

            # Create teacher user
            teacher = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=True,  # Teachers need staff permissions
                is_active=True
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created teacher: {teacher.username} ({teacher.email})'
                )
            )

        except ValidationError as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating teacher: {e}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Unexpected error: {e}')
            )
