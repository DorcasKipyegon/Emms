import os
import django
from datetime import timedelta
from django.utils import timezone
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emms_backend.settings')
django.setup()

from users.models import User, TechnicianProfile
from equipment.models import Equipment, Category
from inventory.models import SparePart
from maintenance.models import RepairTask, DowntimeLog, PartUsage

def generate():
    print("Generating dummy data for analytics...")

    # Create dummy technician if none exists
    tech, created = User.objects.get_or_create(username='dummy_tech', defaults={
        'first_name': 'John',
        'last_name': 'Doe',
        'role': 'TECHNICIAN'
    })
    if created:
        tech.set_password('password123')
        tech.save()
    TechnicianProfile.objects.get_or_create(user=tech, defaults={'hourly_rate': 45.00})

    # Create category
    cat, _ = Category.objects.get_or_create(name='Heavy Machinery')

    # Create equipment
    eq1, _ = Equipment.objects.get_or_create(name='Forklift A', serial_number='FL-001', defaults={
        'category': cat,
        'current_runtime_hours': 1500,
        'purchase_date': timezone.now().date() - timedelta(days=365)
    })
    
    eq2, _ = Equipment.objects.get_or_create(name='Conveyor Belt B', serial_number='CB-002', defaults={
        'category': cat,
        'current_runtime_hours': 3200,
        'purchase_date': timezone.now().date() - timedelta(days=700)
    })

    # Create parts
    part1, _ = SparePart.objects.get_or_create(name='Hydraulic Fluid', sku='HF-1', defaults={'unit_cost': 25.00, 'current_stock': 100})
    part2, _ = SparePart.objects.get_or_create(name='Bearing Set', sku='BS-2', defaults={'unit_cost': 150.00, 'current_stock': 20})

    # Create past reactive tasks & downtime
    now = timezone.now()
    
    # Forklift broke down twice
    for i in range(2):
        start = now - timedelta(days=random.randint(10, 100), hours=random.randint(1, 5))
        end = start + timedelta(hours=random.randint(2, 8))
        
        task = RepairTask.objects.create(
            equipment=eq1,
            technician=tech,
            title=f"Forklift Breakdown {i+1}",
            description="Hydraulic leak fixed.",
            status='COMPLETED',
            source='REACTIVE',
            start_time=start,
            end_time=end
        )
        DowntimeLog.objects.create(
            equipment=eq1,
            repair_task=task,
            start_time=start,
            end_time=end
        )
        PartUsage.objects.create(repair_task=task, spare_part=part1, quantity_used=2, cost_at_time_of_use=25.00)

    # Conveyor belt broke down once, took a long time to fix
    start = now - timedelta(days=45)
    end = start + timedelta(hours=24)
    task2 = RepairTask.objects.create(
        equipment=eq2,
        technician=tech,
        title="Conveyor Belt Jam",
        description="Replaced bearings.",
        status='COMPLETED',
        source='REACTIVE',
        start_time=start,
        end_time=end
    )
    DowntimeLog.objects.create(
        equipment=eq2,
        repair_task=task2,
        start_time=start,
        end_time=end
    )
    PartUsage.objects.create(repair_task=task2, spare_part=part2, quantity_used=1, cost_at_time_of_use=150.00)

    print("Dummy data successfully generated!")

if __name__ == '__main__':
    generate()
