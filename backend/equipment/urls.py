from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, EquipmentViewSet, EquipmentDocumentViewSet, PublicEquipmentDetailView, AssetSessionViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'equipment', EquipmentViewSet)
router.register(r'documents', EquipmentDocumentViewSet)
router.register(r'sessions', AssetSessionViewSet, basename='asset_session')

urlpatterns = [
    path('public/<uuid:public_id>/', PublicEquipmentDetailView.as_view(), name='public-equipment-detail'),
    path('', include(router.urls)),
]
