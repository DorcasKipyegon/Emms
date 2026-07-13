from rest_framework import serializers
from .models import User, TechnicianProfile

class TechnicianProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicianProfile
        fields = ['id', 'specialty', 'hourly_rate', 'is_available']

class UserSerializer(serializers.ModelSerializer):
    technician_profile = TechnicianProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'is_active', 'date_joined', 'technician_profile']
