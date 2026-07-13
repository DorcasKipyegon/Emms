from rest_framework import serializers
from .models import Category, Equipment, EquipmentDocument

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

    class Meta:
        model = Equipment
        fields = '__all__'
