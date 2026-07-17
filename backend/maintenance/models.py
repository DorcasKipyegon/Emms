from django.db import models
from django.conf import settings
from equipment.models import Equipment
from inventory.models import SparePart

class InspectionTemplate(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class InspectionTemplateItem(models.Model):
    template = models.ForeignKey(InspectionTemplate, on_delete=models.CASCADE, related_name='items')
    text = models.CharField(max_length=255)
    is_required = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.template.name} - {self.text}"

class MaintenanceSchedule(models.Model):
    TRIGGER_TYPES = (
        ('TIME', 'Time-based'),
        ('USAGE', 'Usage-based')
    )
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    trigger_type = models.CharField(max_length=10, choices=TRIGGER_TYPES, default='TIME')
    
    # Time-based
    frequency_days = models.PositiveIntegerField(help_text="Repeat every X days", null=True, blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    
    # Usage-based
    frequency_hours = models.PositiveIntegerField(help_text="Repeat every X hours", null=True, blank=True)
    next_due_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    inspection_template = models.ForeignKey(InspectionTemplate, on_delete=models.SET_NULL, null=True, blank=True, help_text="Template used for generating inspection checklists")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} for {self.equipment.name}"

class RepairTask(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('ON_HOLD', 'On Hold'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    SOURCE_CHOICES = (
        ('PREVENTIVE', 'Preventive Maintenance'),
        ('REACTIVE', 'Reactive (Breakdown)')
    )
    
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='repair_tasks')
    technician = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    team = models.ForeignKey('users.MaintenanceTeam', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    schedule = models.ForeignKey(MaintenanceSchedule, on_delete=models.SET_NULL, null=True, blank=True, help_text="Linked if this is a preventive maintenance task")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='REACTIVE')
    
    PRIORITY_CHOICES = (
        ('CRITICAL', 'Critical'),
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    is_inspection = models.BooleanField(default=False)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    completion_notes = models.TextField(blank=True, null=True)
    on_hold_reason = models.CharField(max_length=255, blank=True, null=True)
    
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)

    def __str__(self):
        return f"Task #{self.id}: {self.title}"

class TaskChecklistItem(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
        ('NA', 'N/A')
    )
    task = models.ForeignKey(RepairTask, on_delete=models.CASCADE, related_name='checklist_items')
    text = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='inspection_photos/', blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.task.id} - {self.text} ({self.status})"

class DowntimeLog(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='downtime_logs')
    repair_task = models.ForeignKey(RepairTask, on_delete=models.SET_NULL, null=True, blank=True, related_name='downtime_events')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Downtime for {self.equipment.name} starting {self.start_time}"

class InspectionReport(models.Model):
    repair_task = models.OneToOneField(RepairTask, on_delete=models.CASCADE, related_name='inspection_report')
    passed_inspection = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inspection for Task #{self.repair_task.id}"

class PartUsage(models.Model):
    repair_task = models.ForeignKey(RepairTask, on_delete=models.CASCADE, related_name='parts_used')
    spare_part = models.ForeignKey(SparePart, on_delete=models.PROTECT, related_name='usage_history')
    quantity_used = models.PositiveIntegerField(default=1)
    
    cost_at_time_of_use = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.quantity_used}x {self.spare_part.name} used in Task #{self.repair_task.id}"

class MaintenanceRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='maintenance_requests')
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reported_requests')
    source_inspection = models.ForeignKey(RepairTask, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_requests')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    suggested_priority = models.CharField(max_length=20, choices=RepairTask.PRIORITY_CHOICES, default='MEDIUM')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    rejection_reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request #{self.id}: {self.title} ({self.status})"
