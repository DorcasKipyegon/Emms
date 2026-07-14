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
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'is_active', 'date_joined', 'technician_profile', 'maintenance_teams']

from .models import MaintenanceTeam

class MaintenanceTeamSerializer(serializers.ModelSerializer):
    members_data = UserSerializer(source='members', many=True, read_only=True)

    class Meta:
        model = MaintenanceTeam
        fields = ['id', 'name', 'members', 'members_data', 'created_at']
