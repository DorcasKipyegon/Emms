from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from equipment.models import Equipment
from maintenance.models import RepairTask
from users.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    q = request.GET.get('q', '').strip()
    
    if not q or len(q) < 2:
        return Response({"equipment": [], "technicians": [], "tasks": []})
        
    equipment = Equipment.objects.filter(
        Q(name__icontains=q) | 
        Q(serial_number__icontains=q) |
        Q(category__name__icontains=q)
    )[:5]
    
    tasks = RepairTask.objects.filter(
        Q(title__icontains=q) | 
        Q(description__icontains=q)
    )[:5]
    
    users = User.objects.filter(
        Q(first_name__icontains=q) | 
        Q(last_name__icontains=q) | 
        Q(username__icontains=q)
    )[:5]

    return Response({
        "equipment": [
            {
                "id": e.id,
                "public_id": e.public_id,
                "name": e.name,
                "serial_number": e.serial_number,
                "status": e.status
            } for e in equipment
        ],
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "equipment_name": t.equipment.name if t.equipment else None
            } for t in tasks
        ],
        "technicians": [
            {
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}".strip() or u.username,
                "role": u.role
            } for u in users
        ]
    })
