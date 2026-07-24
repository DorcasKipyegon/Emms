from rest_framework import serializers
from .models import Category, Equipment, EquipmentDocument, AssetSession

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class EquipmentDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentDocument
        fields = '__all__'

class EquipmentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    documents = EquipmentDocumentSerializer(many=True, read_only=True)
    active_session_user = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = '__all__'
        
    def get_active_session_user(self, obj):
        active_session = obj.sessions.filter(end_time__isnull=True).select_related('user').first()
        if active_session:
            return f"{active_session.user.first_name} {active_session.user.last_name}".strip() or active_session.user.username
        return None

class PublicEquipmentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Equipment
        fields = ['id', 'public_id', 'name', 'serial_number', 'category_name', 'status', 'location', 'metadata']

class AssetSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = AssetSession
        fields = '__all__'
