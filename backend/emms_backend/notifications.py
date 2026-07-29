import africastalking
from django.core.mail import send_mail
from django.conf import settings
from decouple import config

import os
from decouple import Config, RepositoryEnv
import requests

env_path = os.path.join(settings.BASE_DIR, '.env')
env_config = Config(RepositoryEnv(env_path)) if os.path.exists(env_path) else config

# Initialize Africa's Talking
username = env_config('AT_USERNAME', default='sandbox')
api_key = env_config('AT_API_KEY', default='')

if api_key:
    africastalking.initialize(username, api_key)
    sms = africastalking.SMS
else:
    sms = None

def send_system_sms(to_phone, message):
    if not sms:
        print("Africa's Talking not configured. SMS not sent.")
        return False
    if not to_phone:
        return False
    try:
        # AT expects numbers in international format e.g., +254...
        response = sms.send(message, [to_phone])
        print(f"SMS Sent to {to_phone}: {response}")
        return True
    except Exception as e:
        print(f"Error sending SMS to {to_phone}: {str(e)}")
        return False

def send_system_email(to_email, subject, message):
    if not to_email:
        return False
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        print(f"Email Sent to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {str(e)}")
        return False
