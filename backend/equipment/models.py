from django.db import models
from django.conf import settings
import uuid
import qrcode
from io import BytesIO
from django.core.files import File
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Equipment(models.Model):
    STATUS_CHOICES = (
        ('OPERATIONAL', 'Operational'),
        ('DOWN', 'Down'),
        ('MAINTENANCE', 'Under Maintenance'),
    )
    
    name = models.CharField(max_length=150)
    serial_number = models.CharField(max_length=100, unique=True)
    manufacturer = models.CharField(max_length=100, blank=True, null=True)
    model_number = models.CharField(max_length=100, blank=True, null=True)
    
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='equipment')
    parent_equipment = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='components')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPERATIONAL')
    location = models.CharField(max_length=150, blank=True, null=True)
    
    purchase_date = models.DateField(blank=True, null=True)
    warranty_expiry = models.DateField(blank=True, null=True)
    
    current_runtime_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_downtime_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    
    # New IT Equipment & QR features
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    metadata = models.JSONField(blank=True, default=dict, help_text="Store arbitrary properties like OS, IP address, etc.")
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.qr_code:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            qr = qrcode.make(f"{frontend_url}/q/{self.public_id}")
            canvas = BytesIO()
            qr.save(canvas, format='PNG')
            canvas.seek(0)
            self.qr_code.save(f'qr_{self.public_id}.png', File(canvas), save=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.serial_number})"

class EquipmentDocument(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    document = models.FileField(upload_to='equipment_docs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} for {self.equipment.name}"

class AssetSession(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='sessions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='asset_sessions')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} on {self.equipment.name}"
