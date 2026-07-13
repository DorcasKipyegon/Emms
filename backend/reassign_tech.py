import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emms_backend.settings')
django.setup()

from users.models import User
from maintenance.models import RepairTask

def reassign():
    johns = User.objects.filter(username='dummy_tech')
    if not johns.exists():
        johns = User.objects.filter(first_name='John', last_name='Doe')

    if johns.exists():
        john = johns.first()
        # Find Dorcas
        dorcas = User.objects.filter(first_name__icontains='Dorcas').first()
        if not dorcas:
            dorcas = User.objects.filter(username__icontains='Dorcas').first()
            
        if dorcas:
            # Reassign tasks
            updated_count = RepairTask.objects.filter(technician=john).update(technician=dorcas)
            print(f"Reassigned {updated_count} tasks from {john.username} to {dorcas.username}")
            # Delete John
            john.delete()
            print("Deleted John Doe")
        else:
            print("Could not find user Dorcas.")
    else:
        print("John Doe not found.")

if __name__ == '__main__':
    reassign()
