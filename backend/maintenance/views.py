from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from .models import MaintenanceSchedule, RepairTask, InspectionReport, PartUsage, DowntimeLog
from inventory.models import SparePart
from .serializers import (
    MaintenanceScheduleSerializer, RepairTaskSerializer, 
    InspectionReportSerializer, PartUsageSerializer
)

class MaintenanceScheduleViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceSchedule.objects.all()
    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [IsAuthenticated]

class RepairTaskViewSet(viewsets.ModelViewSet):
    queryset = RepairTask.objects.all()
    serializer_class = RepairTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = RepairTask.objects.all()
        archived = self.request.query_params.get('archived')
        if archived == 'true':
            queryset = queryset.filter(is_archived=True)
        elif archived == 'all':
            pass
        else:
            queryset = queryset.filter(is_archived=False)

        equipment_id = self.request.query_params.get('equipment')
        if equipment_id:
            queryset = queryset.filter(equipment_id=equipment_id)
        return queryset

    def perform_create(self, serializer):
        task = serializer.save()
        if task.technician:
            self._notify_technician(task)
            
    def perform_update(self, serializer):
        old_task = self.get_object()
        old_technician = old_task.technician
        task = serializer.save()
        
        if task.technician and task.technician != old_technician:
            self._notify_technician(task)

    def _notify_technician(self, task):
        from emms_backend.notifications import send_system_sms, send_system_email
        technician = task.technician
        
        subject = f"New Task Assigned: {task.title}"
        message = f"Hello {technician.first_name or technician.username},\n\nYou have been assigned a new task: {task.title} on {task.equipment.name}.\n\nPlease check your dashboard for details."
        
        if technician.email:
            send_system_email(technician.email, subject, message)
            
        if technician.phone_number:
            send_system_sms(technician.phone_number, message)

    @action(detail=True, methods=['post'])
    def complete_task(self, request, pk=None):
        task = self.get_object()
        if task.status == 'COMPLETED':
            return Response({'error': 'Task is already completed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        runtime_hours = request.data.get('runtime_hours')
        downtime_start = request.data.get('downtime_start')
        downtime_end = request.data.get('downtime_end')
        parts_used = request.data.get('parts_used', [])
        notes = request.data.get('notes', '')

        with transaction.atomic():
            equipment = task.equipment
            
            # Update equipment runtime
            if runtime_hours is not None and runtime_hours != '':
                try:
                    equipment.current_runtime_hours = float(runtime_hours)
                except ValueError:
                    return Response({'error': 'Invalid runtime hours.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Log downtime
            if downtime_start and downtime_end:
                DowntimeLog.objects.create(
                    equipment=equipment,
                    repair_task=task,
                    start_time=downtime_start,
                    end_time=downtime_end
                )
                # Calculate hours using simple isoformat parsing fallback
                try:
                    start_dt = timezone.datetime.fromisoformat(downtime_start.replace('Z', '+00:00'))
                    end_dt = timezone.datetime.fromisoformat(downtime_end.replace('Z', '+00:00'))
                    diff = (end_dt - start_dt).total_seconds() / 3600.0
                    equipment.total_downtime_hours += type(equipment.total_downtime_hours)(diff)
                except Exception as e:
                    pass # Date parsing might fail, but log is still created

            equipment.save()

            # Process parts used
            for item in parts_used:
                part_id = item.get('spare_part_id')
                quantity = int(item.get('quantity', 1))
                try:
                    spare_part = SparePart.objects.get(id=part_id)
                except SparePart.DoesNotExist:
                    return Response({'error': f'Part ID {part_id} does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
                
                if spare_part.current_stock < quantity:
                    return Response({'error': f'Not enough stock for {spare_part.name}.'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Create PartUsage
                PartUsage.objects.create(
                    repair_task=task,
                    spare_part=spare_part,
                    quantity_used=quantity,
                    cost_at_time_of_use=spare_part.unit_cost
                )
                # Deduct stock
                spare_part.current_stock -= quantity
                spare_part.save()

                # Check for low stock
                if spare_part.current_stock <= spare_part.reorder_level:
                    self._notify_low_stock(spare_part)

            # Complete task
            task.status = 'COMPLETED'
            task.completion_notes = notes
            if downtime_start:
                task.start_time = downtime_start
            if downtime_end:
                task.end_time = downtime_end
            elif not task.end_time:
                task.end_time = timezone.now()
            task.save()
            
        return Response({'message': 'Task completed successfully.'})

    def _notify_low_stock(self, spare_part):
        from emms_backend.notifications import send_system_sms, send_system_email
        from users.models import User
        
        managers = User.objects.filter(role='MANAGER')
        subject = f"Low Stock Alert: {spare_part.name}"
        message = f"Alert! The stock for {spare_part.name} (SKU: {spare_part.sku}) has dropped to {spare_part.current_stock}.\nReorder level is {spare_part.reorder_level}."
        
        for manager in managers:
            if manager.email:
                send_system_email(manager.email, subject, message)
            if manager.phone_number:
                send_system_sms(manager.phone_number, message)

class InspectionReportViewSet(viewsets.ModelViewSet):
    queryset = InspectionReport.objects.all()
    serializer_class = InspectionReportSerializer
    permission_classes = [IsAuthenticated]

class PartUsageViewSet(viewsets.ModelViewSet):
    queryset = PartUsage.objects.all()
    serializer_class = PartUsageSerializer
    permission_classes = [IsAuthenticated]
