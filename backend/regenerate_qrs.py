import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emms_backend.settings')
django.setup()

from equipment.models import Equipment
from django.conf import settings
import qrcode
from io import BytesIO
from django.core.files import File

def regenerate_all_qrs():
    equipments = Equipment.objects.all()
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    
    print(f"Regenerating {equipments.count()} QR codes with base URL: {frontend_url}")
    
    for eq in equipments:
        # Delete old file
        if eq.qr_code:
            eq.qr_code.delete(save=False)
            
        # Generate new
        qr = qrcode.make(f"{frontend_url}/q/{eq.public_id}")
        canvas = BytesIO()
        qr.save(canvas, format='PNG')
        canvas.seek(0)
        
        eq.qr_code.save(f'qr_{eq.public_id}.png', File(canvas), save=True)
        print(f"Updated QR for {eq.name}")
        
    print("Done!")

if __name__ == '__main__':
    regenerate_all_qrs()
