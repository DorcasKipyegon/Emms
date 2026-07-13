from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import SparePart
from .serializers import SparePartSerializer

class SparePartViewSet(viewsets.ModelViewSet):
    queryset = SparePart.objects.all()
    serializer_class = SparePartSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        name = serializer.validated_data.get('name', 'PART')
        # Create base SKU by replacing spaces with hyphens and making it uppercase
        base_sku = name.strip().upper().replace(' ', '-')
        sku = base_sku
        counter = 1
        while SparePart.objects.filter(sku=sku).exists():
            sku = f"{base_sku}-{counter}"
            counter += 1
        serializer.save(sku=sku)
