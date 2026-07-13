from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import MaintenanceSchedule, RepairTask
import logging

logger = logging.getLogger(__name__)

@shared_task
def generate_preventive_maintenance_tasks():
    logger.info("Starting Preventive Maintenance Task Generation...")
    
    # Get the current date
    today = timezone.now().date()
    
    # 1. TIME-BASED SCHEDULES
    # Find active schedules triggered by TIME where the next due date is today or in the past
    time_schedules = MaintenanceSchedule.objects.filter(
        is_active=True,
        trigger_type='TIME',
        next_due_date__lte=today
    )
    
    time_tasks_created = 0
    for schedule in time_schedules:
        # Create the repair task
        RepairTask.objects.create(
            equipment=schedule.equipment,
            schedule=schedule,
            source='PREVENTIVE',
            status='PENDING',
            title=f"PM: {schedule.title}",
            description=f"Auto-generated preventive maintenance.\n{schedule.description or ''}"
        )
        
        # Advance the schedule's next due date
        if schedule.frequency_days:
            schedule.next_due_date = today + timedelta(days=schedule.frequency_days)
            schedule.save()
            time_tasks_created += 1
            
    # 2. USAGE-BASED SCHEDULES
    # Find active schedules triggered by USAGE
    # We must join with the equipment to check if current_runtime_hours >= next_due_hours
    usage_schedules = MaintenanceSchedule.objects.filter(
        is_active=True,
        trigger_type='USAGE'
    ).select_related('equipment')
    
    usage_tasks_created = 0
    for schedule in usage_schedules:
        if schedule.next_due_hours and schedule.equipment.current_runtime_hours >= schedule.next_due_hours:
            # Create the repair task
            RepairTask.objects.create(
                equipment=schedule.equipment,
                schedule=schedule,
                source='PREVENTIVE',
                status='PENDING',
                title=f"Usage PM: {schedule.title}",
                description=f"Auto-generated usage maintenance. Triggered at {schedule.equipment.current_runtime_hours} hours.\n{schedule.description or ''}"
            )
            
            # Advance the schedule's next due hours
            if schedule.frequency_hours:
                schedule.next_due_hours = schedule.equipment.current_runtime_hours + Decimal(schedule.frequency_hours)
                schedule.save()
                usage_tasks_created += 1
                
    total_created = time_tasks_created + usage_tasks_created
    logger.info(f"PM Generation Complete. Created {total_created} new tasks.")
    return f"Created {time_tasks_created} time-based and {usage_tasks_created} usage-based tasks."
