from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Category, Equipment, EquipmentDocument
from .serializers import CategorySerializer, EquipmentSerializer, EquipmentDocumentSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

import csv
import io
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, InvalidOperation
from maintenance.tasks import generate_preventive_maintenance_tasks

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_equipment(self, request):
        if request.user.role != 'TECHNICIAN':
            return Response({'error': 'Only technicians can view my_equipment.'}, status=status.HTTP_403_FORBIDDEN)
            
        from maintenance.models import RepairTask
        tasks = RepairTask.objects.filter(technician=request.user)
        equipment_ids = tasks.values_list('equipment', flat=True).distinct()
        
        equipment = self.get_queryset().filter(id__in=equipment_ids)
        serializer = self.get_serializer(equipment, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_runtime(self, request, pk=None):
        equipment = self.get_object()
        hours_str = request.data.get('current_runtime_hours')
        
        if not hours_str:
            return Response({'error': 'current_runtime_hours is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            new_hours = Decimal(hours_str)
        except InvalidOperation:
            return Response({'error': 'Invalid number format.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if new_hours < equipment.current_runtime_hours:
            return Response({'error': 'New runtime cannot be less than current runtime.'}, status=status.HTTP_400_BAD_REQUEST)
            
        equipment.current_runtime_hours = new_hours
        equipment.save()
        
        # Trigger Celery task
        generate_preventive_maintenance_tasks.delay()
        
        return Response({'message': 'Runtime updated successfully.', 'current_runtime_hours': equipment.current_runtime_hours}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        if not file.name.endswith('.csv'):
            return Response({'error': 'Please upload a valid CSV file.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created_count = 0
            for row in reader:
                name = row.get('name', '').strip()
                serial_number = row.get('serial_number', '').strip()
                if not name or not serial_number:
                    continue # Skip invalid rows
                
                cat_name = row.get('category', '').strip()
                category = None
                if cat_name:
                    category, _ = Category.objects.get_or_create(name=cat_name)

                # Ensure status matches choices
                status_val = row.get('status', 'OPERATIONAL').strip().upper()
                if status_val not in ['OPERATIONAL', 'MAINTENANCE', 'DOWN']:
                    status_val = 'OPERATIONAL'

                Equipment.objects.update_or_create(
                    serial_number=serial_number,
                    defaults={
                        'name': name,
                        'manufacturer': row.get('manufacturer', '').strip(),
                        'model_number': row.get('model_number', '').strip(),
                        'category': category,
                        'status': status_val,
                        'location': row.get('location', '').strip(),
                    }
                )
                created_count += 1
                
            return Response({'message': f'Successfully processed {created_count} equipment records.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class EquipmentDocumentViewSet(viewsets.ModelViewSet):
    queryset = EquipmentDocument.objects.all()
    serializer_class = EquipmentDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
