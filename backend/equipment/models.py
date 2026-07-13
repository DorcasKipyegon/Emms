from django.db import models

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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.serial_number})"

class EquipmentDocument(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    document = models.FileField(upload_to='equipment_docs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} for {self.equipment.name}"
