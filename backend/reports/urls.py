from django.urls import path
from .views import get_kpis

urlpatterns = [
    path('kpis/', get_kpis, name='kpis'),
]
