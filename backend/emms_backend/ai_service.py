import google.generativeai as genai
from decouple import config
import json
import logging

logger = logging.getLogger(__name__)

def triage_request(request_id):
    """
    Called asynchronously or in a separate thread.
    Fetches the MaintenanceRequest, calls Gemini, and saves the predictions.
    """
    api_key = config('GEMINI_API_KEY', default=None)
    if not api_key:
        logger.warning("GEMINI_API_KEY not found. Skipping AI triage.")
        return

    # Import inside function to avoid circular imports if this is loaded early
    from maintenance.models import MaintenanceRequest
    
    try:
        req = MaintenanceRequest.objects.get(id=request_id)
    except MaintenanceRequest.DoesNotExist:
        return

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-flash-latest')
    
    prompt = f"""
You are an expert industrial maintenance AI assistant.
Analyze the following maintenance request for equipment '{req.equipment.name}':
Title: {req.title}
Description: {req.description}

Predict the priority (CRITICAL, HIGH, MEDIUM, LOW) and provide a concise list of suggested troubleshooting steps or root causes.
Return ONLY a valid JSON object with the keys "predicted_priority" and "troubleshooting_steps".
Do not include markdown blocks or any other text.
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up markdown formatting if the model still includes it
        if text.startswith('```json'):
            text = text[7:]
        if text.endswith('```'):
            text = text[:-3]
        text = text.strip()
        
        data = json.loads(text)
        
        predicted_priority = data.get('predicted_priority', 'MEDIUM')
        # Validate priority choice
        if predicted_priority not in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
            predicted_priority = 'MEDIUM'
            
        troubleshooting_steps = data.get('troubleshooting_steps', '')
        
        # Update the database
        req.ai_suggested_priority = predicted_priority
        req.ai_troubleshooting_steps = troubleshooting_steps
        req.save(update_fields=['ai_suggested_priority', 'ai_troubleshooting_steps'])
        logger.info(f"Successfully added AI triage for Request #{req.id}")
        
    except Exception as e:
        logger.error(f"AI Triage failed for Request #{req.id}: {e}")
