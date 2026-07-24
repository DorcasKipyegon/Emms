import google.generativeai as genai
from decouple import config
import logging
import json
from typing import List, Dict, Any
from .ai_chat_tools import AVAILABLE_TOOLS, GEMINI_TOOLS

logger = logging.getLogger(__name__)

def process_chat_message(messages: List[Dict[str, str]], user) -> str:
    """
    Process a chat conversation using Gemini with Function Calling.
    Restricts available tools based on user.role.
    """
    api_key = config('GEMINI_API_KEY', default=None)
    if not api_key:
        return "I'm sorry, my AI backend is not fully configured (missing GEMINI_API_KEY)."

    genai.configure(api_key=api_key)
    
    # Filter tools based on role
    allowed_tools_defs = []
    allowed_tool_names = []
    
    is_manager = user.role in ['MANAGER', 'ADMIN']
    
    for tool_def in GEMINI_TOOLS:
        name = tool_def['name']
        if not is_manager and name in ['get_equipment_breakdowns', 'get_overdue_inspections', 'get_all_pending_tasks']:
            continue # Technicians cannot access global breakdown/inspection data right now
            
        allowed_tools_defs.append(tool_def)
        allowed_tool_names.append(name)
        
    model = genai.GenerativeModel(
        model_name='gemini-flash-latest'
    )
    
    # Format message history for Gemini SDK
    formatted_history = []
    for msg in messages:
        # We assume messages are like {"role": "user", "parts": "Hello"}
        role = 'user' if msg.get('role') == 'user' else 'model'
        formatted_history.append({"role": role, "parts": [msg.get('content', '')]})
        
    chat = model.start_chat(history=formatted_history[:-1])
    latest_msg = formatted_history[-1]["parts"][0]
    
    # Inject system context for the latest message
    role_str = "Manager" if is_manager else "Technician"
    tools_descriptions = "\n".join([f"- {t['name']}: {t['description']}" for t in allowed_tools_defs])
    system_instruction = f"""You are a helpful CMMS assistant. The user asking is a {role_str}. Be concise and helpful. Don't make up data.
You have access to the following data fetching tools:
{tools_descriptions}

If you need to fetch data, output ONLY a JSON block in this exact format:
```json
{{"tool": "tool_name", "args": {{"arg_name": "arg_value"}}}}
```
Do not output any other text if you are calling a tool. 
If you have the data or don't need a tool, just answer normally without JSON.
"""
    
    try:
        response = chat.send_message(f"System Context: {system_instruction}\n\nUser: {latest_msg}")
        
        for _ in range(5):
            text = response.text
            
            # Check if model wants to call a tool manually
            if '"tool"' in text and ('"args"' in text or 'args' in text):
                try:
                    import re, json
                    # Try to extract from markdown first
                    match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
                    if match:
                        json_str = match.group(1)
                    else:
                        # Fallback to finding curly braces
                        match = re.search(r'(\{.*"tool".*\})', text, re.DOTALL)
                        if match:
                            json_str = match.group(1)
                        else:
                            json_str = text
                            
                    tool_call = json.loads(json_str)
                    function_name = tool_call.get('tool')
                    args = tool_call.get('args', {})
                    
                    if function_name in allowed_tool_names and function_name in AVAILABLE_TOOLS:
                        if function_name == 'get_my_assigned_tasks':
                            args['user_id'] = user.id
                            
                        function_result = AVAILABLE_TOOLS[function_name](**args)
                        
                        # Send result back
                        response = chat.send_message(f"Tool {function_name} returned: {function_result}\n\nNow provide your final answer.")
                        continue
                    else:
                        response = chat.send_message(f"Tool {function_name} is not available.")
                        continue
                except Exception as ex:
                    logger.error(f"Manual tool parse error: {ex}")
                    # If it was clearly a failed tool call, don't leak the JSON to the user
                    if '{"tool":' in text:
                        response = chat.send_message("I had trouble formatting my tool call. Please retry your request.")
                        continue
                    pass # fall through to return text
                    
            # If we reach here, we clean up any accidental JSON leaking
            import re
            text = re.sub(r'```json\n.*?\n```', '', text, flags=re.DOTALL)
            text = re.sub(r'\{"tool":.*?\}', '', text, flags=re.DOTALL)
            
            if not text.strip():
                return "I couldn't generate a clear response. Please try rephrasing your question."
            return text.strip()
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Chat Service Error: {error_msg}")
        
        if "429" in error_msg or "Quota exceeded" in error_msg:
            return "I am currently receiving too many requests (API Rate Limit Exceeded). Please wait about a minute and try again."
            
        return "I encountered an error while trying to process your request."
