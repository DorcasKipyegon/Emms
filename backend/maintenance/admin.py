from django.contrib import admin
from .models import MaintenanceSchedule, RepairTask, InspectionReport, PartUsage

admin.site.register(MaintenanceSchedule)
admin.site.register(RepairTask)
admin.site.register(InspectionReport)
admin.site.register(PartUsage)
