import json
from datetime import datetime, timedelta
from django.utils import timezone
from equipment.models import Equipment
from maintenance.models import RepairTask, MaintenanceSchedule

def get_equipment_breakdowns(limit: int = 5) -> str:
    """
    Get a list of recent breakdown tasks.
    """
    tasks = RepairTask.objects.filter(source='REACTIVE').order_by('-created_at')[:limit]
    results = []
    for t in tasks:
        results.append({
            "task_id": t.id,
            "title": t.title,
            "equipment": t.equipment.name,
            "status": t.status,
            "priority": t.priority,
            "date": t.created_at.strftime('%Y-%m-%d')
        })
    return json.dumps(results)

def get_overdue_inspections() -> str:
    """
    Get a list of overdue preventive maintenance schedules.
    """
    today = timezone.now().date()
    schedules = MaintenanceSchedule.objects.filter(is_active=True, next_due_date__lt=today)
    results = []
    for s in schedules:
        results.append({
            "schedule_id": s.id,
            "title": s.title,
            "equipment": s.equipment.name,
            "due_date": s.next_due_date.strftime('%Y-%m-%d') if s.next_due_date else None,
            "days_overdue": (today - s.next_due_date).days if s.next_due_date else 0
        })
    return json.dumps(results)

def get_my_assigned_tasks(user_id: int) -> str:
    """
    Get pending or in-progress tasks assigned to the specific user.
    """
    tasks = RepairTask.objects.filter(technician_id=user_id, status__in=['PENDING', 'IN_PROGRESS', 'ON_HOLD']).order_by('-created_at')
    results = []
    for t in tasks:
        results.append({
            "task_id": t.id,
            "title": t.title,
            "equipment": t.equipment.name,
            "status": t.status,
            "priority": t.priority,
            "date": t.created_at.strftime('%Y-%m-%d')
        })
    return json.dumps(results)

def get_all_pending_tasks() -> str:
    """
    Get all pending or in-progress tasks across the entire system.
    """
    tasks = RepairTask.objects.filter(status__in=['PENDING', 'IN_PROGRESS', 'ON_HOLD']).order_by('-created_at')
    results = []
    for t in tasks:
        results.append({
            "task_id": t.id,
            "title": t.title,
            "equipment": t.equipment.name,
            "status": t.status,
            "priority": t.priority,
            "assigned_to": f"{t.technician.first_name} {t.technician.last_name}" if t.technician else "Unassigned",
            "date": t.created_at.strftime('%Y-%m-%d')
        })
    return json.dumps(results)

def get_equipment_details(equipment_name: str) -> str:
    """
    Search for equipment details by name.
    """
    equipments = Equipment.objects.filter(name__icontains=equipment_name)[:3]
    if not equipments:
        return json.dumps({"error": f"No equipment found matching '{equipment_name}'"})
    
    results = []
    for e in equipments:
        results.append({
            "equipment_id": e.id,
            "name": e.name,
            "serial_number": e.serial_number,
            "status": e.status,
            "location": e.location,
            "installation_date": e.installation_date.strftime('%Y-%m-%d') if e.installation_date else None
        })
    return json.dumps(results)

# Map of tool names to actual python functions
AVAILABLE_TOOLS = {
    "get_equipment_breakdowns": get_equipment_breakdowns,
    "get_overdue_inspections": get_overdue_inspections,
    "get_my_assigned_tasks": get_my_assigned_tasks,
    "get_all_pending_tasks": get_all_pending_tasks,
    "get_equipment_details": get_equipment_details
}

# Define the function declarations for Gemini
GEMINI_TOOLS = [
    {
        "name": "get_equipment_breakdowns",
        "description": "Get a list of recent reactive/breakdown repair tasks.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "limit": {
                    "type": "INTEGER",
                    "description": "Number of breakdown tasks to return (default 5)"
                }
            }
        }
    },
    {
        "name": "get_overdue_inspections",
        "description": "Get a list of preventive maintenance schedules that are past their due date."
    },
    {
        "name": "get_my_assigned_tasks",
        "description": "Get a list of active repair tasks currently assigned to the user asking the question. Only use this if the user is asking about THEIR OWN tasks."
    },
    {
        "name": "get_all_pending_tasks",
        "description": "Get a list of ALL active, pending, or in-progress repair tasks across the entire system. Use this when a manager asks for pending tasks generally."
    },
    {
        "name": "get_equipment_details",
        "description": "Search for specific equipment details, status, and location by name.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "equipment_name": {
                    "type": "STRING",
                    "description": "The name or partial name of the equipment to search for."
                }
            },
            "required": ["equipment_name"]
        }
    }
]
