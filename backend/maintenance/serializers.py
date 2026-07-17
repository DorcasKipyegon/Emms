from rest_framework import serializers
from .models import MaintenanceSchedule, RepairTask, InspectionReport, PartUsage, InspectionTemplate, InspectionTemplateItem, TaskChecklistItem, MaintenanceRequest

class InspectionTemplateItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = InspectionTemplateItem
        fields = '__all__'
        read_only_fields = ('template',)

class InspectionTemplateSerializer(serializers.ModelSerializer):
    items = InspectionTemplateItemSerializer(many=True, required=False)
    class Meta:
        model = InspectionTemplate
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        template = InspectionTemplate.objects.create(**validated_data)
        for item_data in items_data:
            InspectionTemplateItem.objects.create(template=template, **item_data)
        return template

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_data.pop('id', None)
                InspectionTemplateItem.objects.create(template=instance, **item_data)
                
        return instance

class TaskChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskChecklistItem
        fields = '__all__'

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

class MaintenanceRequestSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    
    class Meta:
        model = MaintenanceRequest
        fields = '__all__'

class RepairTaskSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True, default=None)
    technician_name = serializers.SerializerMethodField()
    parts_used = PartUsageSerializer(many=True, read_only=True)
    inspection_report = InspectionReportSerializer(read_only=True)
    checklist_items = TaskChecklistItemSerializer(many=True, read_only=True)

    def get_technician_name(self, obj):
        if obj.technician:
            # Try to get first name/last name, fallback to username
            full_name = f"{obj.technician.first_name} {obj.technician.last_name}".strip()
            return full_name if full_name else obj.technician.username
        return None

    class Meta:
        model = RepairTask
        fields = '__all__'
