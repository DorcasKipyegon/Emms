from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('TECHNICIAN', 'Technician'),
        ('WORKER', 'Worker'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='TECHNICIAN')
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class TechnicianProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='technician_profile')
    specialty = models.CharField(max_length=100, blank=True, null=True)
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"Profile: {self.user.username} - {self.specialty}"

class MaintenanceTeam(models.Model):
    name = models.CharField(max_length=100, unique=True)
    members = models.ManyToManyField(User, related_name='maintenance_teams', limit_choices_to={'role': 'TECHNICIAN'})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
