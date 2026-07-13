from rest_framework import serializers
from .models import MaintenanceSchedule, RepairTask, InspectionReport, PartUsage

class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)

    class Meta:
        model = MaintenanceSchedule
        fields = '__all__'

class PartUsageSerializer(serializers.ModelSerializer):
    spare_part_name = serializers.CharField(source='spare_part.name', read_only=True)

    class Meta:
        model = PartUsage
        fields = '__all__'

class InspectionReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionReport
        fields = '__all__'

class RepairTaskSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    technician_name = serializers.SerializerMethodField()
    parts_used = PartUsageSerializer(many=True, read_only=True)
    inspection_report = InspectionReportSerializer(read_only=True)

    def get_technician_name(self, obj):
        if obj.technician:
            # Try to get first name/last name, fallback to username
            full_name = f"{obj.technician.first_name} {obj.technician.last_name}".strip()
            return full_name if full_name else obj.technician.username
        return None

    class Meta:
        model = RepairTask
        fields = '__all__'
