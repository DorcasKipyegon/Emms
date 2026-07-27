import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emms_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import TechnicianProfile

User = get_user_model()

def create_users():
    print("Seeding test users for each role...")

    users_data = [
        {
            'username': 'admin',
            'email': 'admin@emms.pro',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'ADMIN',
            'is_superuser': True,
            'is_staff': True
        },
        {
            'username': 'manager',
            'email': 'manager@emms.pro',
            'first_name': 'Manager',
            'last_name': 'User',
            'role': 'MANAGER',
            'is_superuser': False,
            'is_staff': False
        },
        {
            'username': 'technician',
            'email': 'technician@emms.pro',
            'first_name': 'Technician',
            'last_name': 'User',
            'role': 'TECHNICIAN',
            'is_superuser': False,
            'is_staff': False
        },
        {
            'username': 'worker',
            'email': 'worker@emms.pro',
            'first_name': 'Worker',
            'last_name': 'User',
            'role': 'WORKER',
            'is_superuser': False,
            'is_staff': False
        }
    ]

    for data in users_data:
        username = data['username']
        role = data['role']
        password = 'password123'
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': role,
                'is_superuser': data['is_superuser'],
                'is_staff': data['is_staff'],
            }
        )
        
        user.set_password(password)
        user.save()
        
        if created:
            print(f"Created user '{username}' with role '{role}'")
        else:
            print(f"Updated user '{username}' (role '{role}') password reset to '{password}'")

        if role == 'TECHNICIAN':
            profile, prof_created = TechnicianProfile.objects.get_or_create(
                user=user,
                defaults={
                    'specialty': 'General Maintenance',
                    'hourly_rate': 45.00,
                    'is_available': True
                }
            )
            if prof_created:
                print(f"Created TechnicianProfile for user '{username}'")

    print("Seeding test users completed successfully!")

if __name__ == '__main__':
    create_users()
