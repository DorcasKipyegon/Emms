from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, EquipmentViewSet, EquipmentDocumentViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'equipment', EquipmentViewSet)
router.register(r'documents', EquipmentDocumentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
