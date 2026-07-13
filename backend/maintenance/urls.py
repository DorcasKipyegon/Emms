from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceScheduleViewSet, RepairTaskViewSet, InspectionReportViewSet, PartUsageViewSet

router = DefaultRouter()
router.register(r'schedules', MaintenanceScheduleViewSet)
router.register(r'repair-tasks', RepairTaskViewSet)
router.register(r'inspections', InspectionReportViewSet)
router.register(r'part-usage', PartUsageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
