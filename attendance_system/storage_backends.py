from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class StaticStorage(S3Boto3Storage):
    """Custom storage class for static files on S3"""
    location = 'static'
    default_acl = 'public-read'


class MediaStorage(S3Boto3Storage):
    """Custom storage class for media files on S3"""
    location = 'media'
    default_acl = 'public-read'
    file_overwrite = False


class PrivateMediaStorage(S3Boto3Storage):
    """Custom storage class for private media files on S3"""
    location = 'private'
    default_acl = 'private'
    file_overwrite = False
    custom_domain = False
