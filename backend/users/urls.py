from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, TechnicianProfileViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'technician-profiles', TechnicianProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
