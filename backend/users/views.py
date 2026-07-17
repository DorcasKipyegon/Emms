from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from .models import User, TechnicianProfile
from .serializers import UserSerializer, TechnicianProfileSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({'error': 'Both current and new passwords are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully.'})

    @action(detail=False, methods=['post'])
    def invite_technician(self, request):
        if request.user.role not in ['MANAGER', 'ADMIN']:
            return Response({'error': 'Only managers can invite technicians.'}, status=status.HTTP_403_FORBIDDEN)
            
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name', '')
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        
        if not email or not first_name:
            return Response({'error': 'First name and email are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Generate a unique username from email
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            role='TECHNICIAN',
            is_active=False  # Start inactive
        )
        user.set_unusable_password()
        user.save()
        
        # Create empty profile
        TechnicianProfile.objects.create(user=user)
        
        # Generate token
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        frontend_url = request.META.get('HTTP_ORIGIN', 'http://localhost:5173')
        setup_link = f"{frontend_url}/setup-account?uidb64={uid}&token={token}"
        
        subject = 'Welcome to EMMS.PRO - Set Up Your Account'
        
        message = f'Hello {user.first_name},\n\nYou have been invited to join EMMS.PRO as a Technician.\nPlease click the link below to set up your password and activate your account:\n\n{setup_link}'
        
        html_message = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="margin-bottom: 24px;">
                    <span style="background-color: #0f172a; color: #2dd4bf; font-weight: 800; font-size: 20px; padding: 12px 16px; border-radius: 50%; display: inline-block; letter-spacing: 1px;">EMMS</span>
                </div>
                <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-top: 0; margin-bottom: 16px;">Welcome to EMMS.PRO!</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 32px; font-weight: 500;">
                    Hello {user.first_name},<br><br>
                    You have been invited to join EMMS as a Technician. To get started, please set up your account password by clicking the button below.
                </p>
                <a href="{setup_link}" style="display: inline-block; background-color: #2dd4bf; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 32px; border-radius: 12px; width: 80%; max-width: 300px; box-sizing: border-box;">
                    Set Up Account
                </a>
            </div>
        </div>
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            html_message=html_message
        )
        
        if phone_number:
            from emms_backend.notifications import send_system_sms
            sms_message = f"Welcome to EMMS! Please check your email ({email}) to set up your Technician account."
            try:
                send_system_sms(phone_number, sms_message)
            except Exception as e:
                print(f"Failed to send SMS invite: {e}")
                
        return Response({'message': 'Technician invited successfully. An email has been sent.'})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def request_password_reset(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Using .first() in case multiple users have the same email
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'message': 'If an account with this email exists, a password reset link has been sent.'})
            
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        frontend_url = request.META.get('HTTP_ORIGIN', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password?uidb64={uid}&token={token}"
        
        subject = 'Reset Your EMMS.PRO Password'
        
        # Plain text fallback
        message = f'Hello {user.first_name or user.username},\n\nPlease click the link below to reset your password:\n\n{reset_link}\n\nIf you did not request a password reset, please ignore this email.'
        
        # HTML Version matching the inspiration UI
        html_message = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="margin-bottom: 24px;">
                    <span style="background-color: #0f172a; color: #2dd4bf; font-weight: 800; font-size: 20px; padding: 12px 16px; border-radius: 50%; display: inline-block; letter-spacing: 1px;">EMMS</span>
                </div>
                <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-top: 0; margin-bottom: 16px;">Reset your password</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 32px; font-weight: 500;">
                    Hello {user.first_name or user.username},<br><br>
                    Thanks for using EMMS.PRO. To set a new password for your account, please click the button below.
                </p>
                <a href="{reset_link}" style="display: inline-block; background-color: #2dd4bf; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 32px; border-radius: 12px; width: 80%; max-width: 300px; box-sizing: border-box;">
                    Reset Password
                </a>
                <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                        If you did not request a password reset, you can safely ignore this email.
                    </p>
                </div>
            </div>
        </div>
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            html_message=html_message
        )
        
        return Response({'message': 'If an account with this email exists, a password reset link has been sent.'})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password_confirm(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not uidb64 or not token or not new_password:
            return Response({'error': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
            
        if user is not None and PasswordResetTokenGenerator().check_token(user, token):
            user.set_password(new_password)
            user.is_active = True
            user.save()
            return Response({'message': 'Password has been set successfully.'})
        else:
            return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

class TechnicianProfileViewSet(viewsets.ModelViewSet):
    queryset = TechnicianProfile.objects.all()
    serializer_class = TechnicianProfileSerializer
    permission_classes = [IsAuthenticated]

from .models import MaintenanceTeam
from .serializers import MaintenanceTeamSerializer

class MaintenanceTeamViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceTeam.objects.all()
    serializer_class = MaintenanceTeamSerializer
    permission_classes = [IsAuthenticated]
