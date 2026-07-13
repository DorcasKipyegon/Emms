from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SparePartViewSet

router = DefaultRouter()
router.register(r'spare-parts', SparePartViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
