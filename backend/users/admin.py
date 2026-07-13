from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, TechnicianProfile

class CustomUserAdmin(UserAdmin):
    # Add 'role' and 'phone_number' to the fieldsets so they appear on the edit page
    fieldsets = UserAdmin.fieldsets + (
        ('EMMS Role Configuration', {'fields': ('role', 'phone_number')}),
    )
    # Add 'role' and 'phone_number' to the list display so you see them in the main table
    list_display = UserAdmin.list_display + ('role', 'phone_number')

admin.site.register(User, CustomUserAdmin)
admin.site.register(TechnicianProfile)
