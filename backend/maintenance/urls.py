from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MaintenanceScheduleViewSet, RepairTaskViewSet, 
    InspectionReportViewSet, PartUsageViewSet,
    InspectionTemplateViewSet, TaskChecklistItemViewSet,
    MaintenanceRequestViewSet
)

router = DefaultRouter()
router.register(r'schedules', MaintenanceScheduleViewSet)
router.register(r'repair-tasks', RepairTaskViewSet)
router.register(r'inspections', InspectionReportViewSet)
router.register(r'part-usage', PartUsageViewSet)
router.register(r'inspection-templates', InspectionTemplateViewSet)
router.register(r'task-checklist-items', TaskChecklistItemViewSet)
router.register(r'maintenance-requests', MaintenanceRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
