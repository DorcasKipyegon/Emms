import os
import django
import sys

# Setup Django environment to load settings and apps
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emms_backend.settings')
django.setup()

from emms_backend.notifications import send_system_sms
from decouple import Config, RepositoryEnv
import os

env_path = os.path.join(os.path.dirname(__file__), '.env')
env_config = Config(RepositoryEnv(env_path)) if os.path.exists(env_path) else None

# Replace this with a valid test number in international format
test_number = "+254712345678" 
result = send_system_sms(test_number, "Test message from emms backend")
print(f"Result: {result}")
