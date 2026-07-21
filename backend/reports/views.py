from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from equipment.models import Equipment
from maintenance.models import RepairTask, DowntimeLog, PartUsage
from inventory.models import SparePart
from users.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_kpis(request):
    # Basic Stats
    equipment_count = Equipment.objects.count()
    technicians_count = User.objects.filter(role='TECHNICIAN').count()
    low_stock_parts = SparePart.objects.filter(current_stock__lte=F('reorder_level')).count()

    # MTTR & MTBF Logic
    downtimes = DowntimeLog.objects.filter(start_time__isnull=False, end_time__isnull=False)
    total_downtime_hours = 0
    total_breakdowns = downtimes.count()

    for dt in downtimes:
        duration = (dt.end_time - dt.start_time).total_seconds() / 3600
        total_downtime_hours += duration
    
    mttr = total_downtime_hours / total_breakdowns if total_breakdowns > 0 else 0

    # Total Operational Hours
    total_runtime = Equipment.objects.aggregate(Sum('current_runtime_hours'))['current_runtime_hours__sum'] or 0
    mtbf = float(total_runtime) / total_breakdowns if total_breakdowns > 0 else 0

    # Cost Analysis (TCO per machine)
    equipment_costs = []
    for eq in Equipment.objects.all():
        labor_cost = 0
        tasks = eq.repair_tasks.filter(start_time__isnull=False, end_time__isnull=False)
        for task in tasks:
            if task.technician and hasattr(task.technician, 'technician_profile'):
                duration = (task.end_time - task.start_time).total_seconds() / 3600
                rate = float(task.technician.technician_profile.hourly_rate)
                labor_cost += duration * rate
        
        part_cost = 0
        for task in eq.repair_tasks.all():
            for pu in task.parts_used.all():
                part_cost += float(pu.cost_at_time_of_use) * pu.quantity_used
                
        total_cost = labor_cost + part_cost
        equipment_costs.append({
            'id': eq.id,
            'name': eq.name,
            'serial': eq.serial_number,
            'labor_cost': round(labor_cost, 2),
            'part_cost': round(part_cost, 2),
            'total_cost': round(total_cost, 2),
            'breakdowns': eq.downtime_logs.count()
        })
        
    equipment_costs.sort(key=lambda x: x['total_cost'], reverse=True)

    return Response({
        'overview': {
            'total_equipment': equipment_count,
            'active_technicians': technicians_count,
            'low_stock_alerts': low_stock_parts,
            'mttr_hours': round(mttr, 1),
            'mtbf_hours': round(mtbf, 1),
            'total_breakdowns': total_breakdowns
        },
        'equipment_costs': equipment_costs[:10]
    })
