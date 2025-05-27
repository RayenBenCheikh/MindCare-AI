from flask import Blueprint, request, jsonify
import requests
import logging
from pymongo import MongoClient
from bson.objectid import ObjectId
import datetime
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import your assessment questions and other utilities
assessment_questions = [
    {
        "question": "How would you rate your mood today?",
        "options": [" Very bad", " Bad", " Neutral", " Good", " Very good"]
    },
    {
        "question": "Have you been enjoying activities you usually find pleasurable?",
        "options": ["Yes", "No"]
    },
    {
        "question": "How has your sleep been recently?",
        "options": ["Very poor", "Poor", "Average", "Good", "Very good"]
    },
    {
        "question": "How would you describe your energy levels?",
        "options": ["Very low", "Low", "Moderate", "High", "Very high"]
    },
    {
        "question": "How is your appetite lately?",
        "options": ["Very poor", "Poor", "Average", "Good", "Very good"]
    },
    {
        "question": "Have you been able to concentrate on tasks?",
        "options": ["Not at all", "Rarely", "Sometimes", "Often", "Always"]
    },
    {
        "question": "Do you often feel overwhelmed?",
        "options": ["Never", "Rarely", "Sometimes", "Often", "Always"]
    },
    {
        "question": "How would you describe your outlook on the future?",
        "options": ["Very negative", "Negative", "Neutral", "Positive", "Very positive"]
    },
    {
        "question": "Do you feel supported by friends and family?",
        "options": ["Not at all", "A little", "Somewhat", "Mostly", "Completely"]
    },
    {
        "question": "Have you had thoughts that life isn't worth living?",
        "options": ["Never", "Rarely", "Sometimes", "Often", "Always"]
    }
]
model_mapping = {
    'gemma': 'gemma3:4b',
    'llama3.1': 'llama3.1:8b',
    'qwen3': 'qwen3:1.7b',
    'deepseek' :'deepseek-r1:7b'
}

# Create a blueprint for chat routes
chatbot_bp = Blueprint('chatbot', __name__)
# MongoDB connection
MONGODB_URI = "mongodb://127.0.0.1:27017/mindcare"
try:
    client = MongoClient(MONGODB_URI)
    db = client.get_database()
    assessments_collection = db.assessments
    logger.info("MongoDB connection established in Chatbot blueprint")
except Exception as e:
    logger.error(f"MongoDB connection error in Chatbot blueprint: {str(e)}")
    assessments_collection = None

@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    history = data.get('history', [])
    model = data.get('model', 'gemma3:4b')  # Get user-selected model or default
    
    # Process the chat message using the specified model
    response = get_chat_response(message, history, model)
    
    return jsonify({
        'reply': response
    })

@chatbot_bp.route('/assessment', methods=['POST'])
def assessment():
    data = request.json
    responses = data.get('responses', [])
    model = data.get('model', 'gemma3:4b')  # Get user-selected model or default
    
    if not responses or len(responses) != 10:
        return jsonify({
            'error': 'Invalid assessment data. Expected 10 responses.'
        }), 400
    
    # Use your assessment logic from the notebook with selected model
    stress_level = get_stress_level_with_ollama_api(responses, model)
    
    # FIX: Pass the model parameter to the advice function
    advice = get_personalized_advice_with_ollama(responses, stress_level, model)
  
    # Determine mood and severity
    mood = "depression" if stress_level >= 3 else "positive"
    severity = stress_level
    
    return jsonify({
        'mood': mood,
        'severity': severity,
        'message': f"Based on your responses, your stress level is {stress_level}/5.",
        'solutions': advice
    })

@chatbot_bp.route('/assessments/save', methods=['POST'])
def save_assessment():
    """Save an assessment to the database"""
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400
        
    # Get the data from request
    data = request.json
    logger.info(f"Received assessment data: {data}")
    
    # Check for required fields
    required_fields = ['userId', 'stressLevel', 'responses']
    for field in required_fields:
        if field not in data:
            logger.error(f"Missing required field: {field}")
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Extract user ID from the auth token
        auth_header = request.headers.get('Authorization', '')
        logger.info(f"Auth header: {auth_header[:15]}...")
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]  # Remove 'Bearer ' prefix
            
            try:
                # For now, just trust the token and user ID
                logger.info("Processing assessment save request")
            except Exception as e:
                logger.error(f"Token validation error: {e}")
                return jsonify({'error': 'Invalid token'}), 401
        else:
            logger.error("No Bearer token provided")
            return jsonify({'error': 'Authorization token required'}), 401
        
        if assessments_collection is None:
            return jsonify({'error': 'Database connection not available'}), 500
        
        # Prepare the document to insert
        assessment_doc = {
            'userId': data['userId'],
            'date': data.get('date', datetime.datetime.now().isoformat()),
            'responses': data['responses'],
            'stressLevel': data['stressLevel'],
            'mood': data.get('mood', ''),
            'analysis': data.get('analysis', ''),
            'recommendations': data.get('solutions', '')
        }
        
        logger.info(f"Saving assessment document: {assessment_doc}")
        
        # Insert into database
        result = assessments_collection.insert_one(assessment_doc)
        
        # Check if insert was successful
        if result.inserted_id:
            return jsonify({
                'success': True,
                'message': 'Assessment saved successfully',
                'assessmentId': str(result.inserted_id)
            }), 201
        else:
            return jsonify({'error': 'Failed to save assessment'}), 500
            
    except Exception as e:
        logger.error(f"Error saving assessment: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

def get_chat_response(message, history, selected_model):
    """Process a chat message using Ollama API with user-selected model"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Prepare the prompt with conversation history
    prompt = "You are MindCare AI, a compassionate mental health assistant. "
    prompt += "Be helpful, supportive, and provide actionable advice. "
    prompt += "Keep responses concise and supportive. "
    prompt += "IMPORTANT: Provide direct answers without showing your reasoning or thinking process. "
    prompt += "Don't explain how you arrived at answers or say phrases like 'let me think' or 'I would approach this by'. "
    prompt += "Just give straightforward, helpful responses.\n\n"
  
    # Add conversation history
    for msg in history[-5:]:  # Limit to last 5 messages to keep context manageable
        role = msg.get('role', '')
        content = msg.get('content', '')
        if role and content:
            prompt += f"{role.title()}: {content}\n"
    
    # Add the current message
    prompt += f"\nUser: {message}\nMindCare AI:"
    # Get the actual model name from mapping or use selected_model as is
    model_to_use = model_mapping.get(selected_model, selected_model)
    
    # Try the selected model first
    models_to_try = [model_to_use]
    
    # Add fallback models in case the selected one fails
    fallback_models = ["gemma3:4b", "qwen3:1.7b", "llama3.1:8b","deepseek-r1:7b"]
    for model in fallback_models:
        if model != model_to_use:
            models_to_try.append(model)
    
    logger.info(f"Trying to generate chat response with preferred model: {model_to_use}")
    
    # Try models in order (preferred first, then fallbacks)
    for model_name in models_to_try:
        try:
            logger.info(f"Generating chat response with model: {model_name}")
            
            # Prepare the API request
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.6,  # Creative but controlled responses
                "max_tokens": 500
            }
            
            # Make the API request
            response = requests.post(api_url, json=payload, timeout=30)
            
            # Check if request was successful
            if response.status_code == 200:
                result = response.json()
                reply = result.get("response", "").strip()
                
                if len(reply) > 10:  # Make sure we got a meaningful response
                    return reply
                
            else:
                logger.error(f"API request failed with status code: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error getting chat response with {model_name}: {e}")
    
    # Return fallback response if all models fail
    return "I'm sorry, I'm having trouble processing your request at the moment. Could you try again later or ask a different question?"

def get_stress_level_with_ollama_api(responses, selected_model):
    """Enhanced function to get stress level using Ollama API with better prompting""" 
    # Get the actual model name
    model_to_use = model_mapping.get(selected_model, selected_model)
    
    # Prepare the prompt for the LLM
    prompt = (
        "You are a mental health assessment assistant. "
        "Given the following answers to a mental health assessment, "
        "estimate the user's overall stress level on a scale from 1 (very low) to 5 (very high). "
        "ONLY return a single number from 1 to 5. Do not explain your reasoning.\n\n"
        "Assessment Answers:\n"
    )
    
    for i, (q, a) in enumerate(zip(assessment_questions, responses)):
        prompt += f"{i+1}. {q['question']} → {a}\n"
    
    prompt += "\nStress level (respond with only a number 1-5):"
    
    try:
        logger.info(f"Trying stress assessment with selected model: {model_to_use}")
        
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': model_to_use,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.3,  # Lower temperature for more consistent results
                    'top_p': 0.9,
                    'num_predict': 5,    # Expect very short response
                    'stop': ['\n', '.', ' ', ',', ':', ';', 'because', 'The', 'Based']
                }
            },
            timeout=60  # Increased timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            output = result.get("response", "").strip()
            logger.info(f"Model {model_to_use} raw response: '{output}'")
            
            # Extract the first digit 1-5 from the output
            for c in output:
                if c in "12345":
                    extracted_level = int(c)
                    logger.info(f"✓ Successfully extracted stress level {extracted_level} from {model_to_use}")
                    return extracted_level
            
            # If no valid digit found, log the response
            logger.warning(f"No valid stress level found in response from {model_to_use}: '{output}'")
                    
        else:
            logger.error(f"API request failed with status code: {response.status_code}")
            
    except requests.exceptions.Timeout:
        logger.error(f"Timeout with model {model_to_use}")
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error with model {model_to_use}")
    except Exception as e:
        logger.error(f"Unexpected error with {model_to_use}: {e}")
    
    # If LLM fails, return None (no manual fallback)
    logger.error("LLM model failed - no fallback available")
    return None


def get_personalized_advice_with_ollama(responses, stress_level, selected_model='gemma3:4b'):
    """Get personalized advice from Ollama based on user's specific responses"""
    # ... existing implementation with proper error handling
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Create a summary of concerning responses
    concerning_responses = []
    
    # Check for concerning responses with proper question mapping
    if "1 -" in responses[0] or "2 -" in responses[0]:
        concerning_responses.append(f"You rated your mood as {responses[0]}")
    
    if responses[1] == "No":
        concerning_responses.append("You haven't been enjoying activities you usually find pleasurable")
    
    # FIXED: Use specific question descriptions instead of indexing assessment_questions
    sleep_energy_appetite_questions = ["sleep", "energy levels", "appetite"]
    for i in range(2, 5):
        if responses[i] in ["Very poor", "Poor"]:
            question_topic = sleep_energy_appetite_questions[i-2]  # Adjust index
            concerning_responses.append(f"Your {question_topic} has been {responses[i].lower()}")
    
    if responses[5] in ["Not at all", "Rarely"]:
        concerning_responses.append(f"You've been having trouble concentrating")
    
    if responses[6] in ["Often", "Always"]:
        concerning_responses.append(f"You feel overwhelmed {responses[6].lower()}")
    
    if responses[7] in ["Very negative", "Negative"]:
        concerning_responses.append(f"Your outlook on the future is {responses[7].lower()}")
    
    if responses[8] in ["Not at all", "A little"]:
        concerning_responses.append(f"You don't feel very supported by friends and family")
    
    if responses[9] in ["Sometimes", "Often", "Always"]:
        concerning_responses.append(f"You've had thoughts that life isn't worth living {responses[9].lower()}")
    
    # Prepare the prompt
    prompt = f"""You are a compassionate mental health assistant. The user has completed a mental health assessment 
and their stress level is {stress_level}/5 (where 5 is highest stress).

Their concerning responses include:
- {chr(10).join(concerning_responses) if concerning_responses else 'None specifically'}

Please provide personalized, actionable advice to help them manage their stress and improve their mental wellbeing.
Give 3-5 specific suggestions that address their particular concerns.
For very high stress levels (4-5), recommend professional help but also provide immediate coping strategies.

IMPORTANT: Respond directly without showing your thought process. Don't use phrases like "Let me analyze" or "Based on your responses".
Just provide the advice in a caring, positive, and supportive tone. Use about 150-200 words."""

    model_to_use = model_mapping.get(selected_model, selected_model)
    
    # Try the selected model first
    models_to_try = [model_to_use]
    
    # Add fallback models in case the selected one fails
    fallback_models = ["gemma3:4b", "qwen3:1.7b", "llama3.1:8b",'deepseek-r1:7b']
 
    # Try different models in order of preference
    for model in fallback_models:
        if model != model_to_use:
            models_to_try.append(model)
    
    # Try different models in order of preference
    for model_name in models_to_try:
        try:
            logger.info(f"Getting advice using model: {model_name}")
            
            # Prepare the API request
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 300,
                    "stop": ["\n\nUser:", "\n\nHuman:"]
                }
            }
            
            # Make the API request
            response = requests.post(api_url, json=payload, timeout=45)
            
            # Check if request was successful
            if response.status_code == 200:
                result = response.json()
                advice = result.get("response", "").strip()
                
                if len(advice) > 30:  # Make sure we got a meaningful response
                    return advice
                
            else:
                logger.error(f"API request failed with status code: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error getting advice with {model_name}: {e}")
    
    # Fallback advice if all models fail
    return get_fallback_advice(stress_level)

def get_fallback_advice(stress_level):
    """Return fallback advice based on stress level if API calls fail"""
    if stress_level <= 2:
        return "Your stress level appears relatively low. Continue your healthy habits and self-care routines. Regular exercise, good sleep, and social connections all contribute to maintaining positive mental health. Take a moment each day to appreciate what's going well in your life."
    elif stress_level == 3:
        return "You're experiencing moderate stress. Try incorporating regular breaks into your day, practice deep breathing when feeling overwhelmed, and ensure you're making time for activities you enjoy. Limiting screen time before bed and maintaining a consistent sleep schedule can also help manage stress levels."
    else:
        return "Your stress level is high. Consider talking to a trusted friend or mental health professional about how you're feeling. In the meantime, try stress-reduction techniques like mindfulness meditation, physical exercise, or journaling. Remember to be kind to yourself and recognize when you need to set boundaries. Your mental health is important, and seeking support is a sign of strength."