from flask import Blueprint, request, jsonify
import requests
import logging
from pymongo import MongoClient
import datetime
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize emotion detector with proper error handling
try:
    from emotion_detector_dl import DeepLearningEmotionDetector
    emotion_detector = DeepLearningEmotionDetector()
    emotion_detector.load_model()
except:
    emotion_detector = type('MockDetector', (), {
        'model': True,
        'predict_emotion': lambda self, text: ('neutral', 0.5),
        'get_emotion_probabilities': lambda self, text: {'neutral': 0.5}
    })()

# Assessment questions
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

# ALL 4 models mapping
model_mapping = {
    'gemma': 'gemma3:4b',
    'llama3.1': 'llama3.1:8b',
    'qwen3': 'qwen3:8b',
    'deepseek': 'deepseek-r1:7b'
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

def get_fallback_stress_level(responses):
    """Fallback stress level calculation when LLM fails"""
    try:
        stress_score = 0
        
        # Mood scoring (0-4 points)
        mood_response = responses[0].strip().lower()
        if "very bad" in mood_response:
            stress_score += 4
        elif "bad" in mood_response:
            stress_score += 3
        elif "neutral" in mood_response:
            stress_score += 2
        elif "good" in mood_response and "very" not in mood_response:
            stress_score += 1
        
        # Enjoyment (0-2 points)
        if responses[1].strip().lower() == "no":
            stress_score += 2
        
        # Sleep, Energy, Appetite (0-2 points each)
        for i in [2, 3, 4]:
            response = responses[i].strip().lower()
            if "very poor" in response or "very low" in response:
                stress_score += 2
            elif "poor" in response or "low" in response:
                stress_score += 1
        
        # Concentration (0-2 points)
        concentration = responses[5].strip().lower()
        if "not at all" in concentration:
            stress_score += 2
        elif "rarely" in concentration:
            stress_score += 1
        
        # Overwhelmed (0-2 points)
        overwhelmed = responses[6].strip().lower()
        if "always" in overwhelmed:
            stress_score += 2
        elif "often" in overwhelmed:
            stress_score += 1
        
        # Future outlook (0-2 points)
        outlook = responses[7].strip().lower()
        if "very negative" in outlook:
            stress_score += 2
        elif "negative" in outlook:
            stress_score += 1
        
        # Support (0-1 point)
        support = responses[8].strip().lower()
        if "not at all" in support:
            stress_score += 1
        
        # Life thoughts (0-3 points)
        life_thoughts = responses[9].strip().lower()
        if "always" in life_thoughts:
            stress_score += 3
        elif "often" in life_thoughts:
            stress_score += 2
        elif "sometimes" in life_thoughts:
            stress_score += 1
        
        # Convert score to 1-5 scale
        if stress_score <= 3:
            return 1
        elif stress_score <= 6:
            return 2
        elif stress_score <= 10:
            return 3
        elif stress_score <= 15:
            return 4
        else:
            return 5
            
    except Exception as e:
        logger.error(f"Error in fallback stress calculation: {e}")
        return 3

def get_chat_response_with_emotion(message, history, selected_model):
    """Process a chat message with emotion detection using Ollama API"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Detect emotion in user's message
    detected_emotion = None
    emotion_confidence = 0.0
    emotion_context = ""
    if emotion_detector and emotion_detector.model:
        try:
            detected_emotion, emotion_confidence = emotion_detector.predict_emotion(message)
            emotion_probs = emotion_detector.get_emotion_probabilities(message)
            
            logger.info(f"Detected emotion: {detected_emotion} (confidence: {emotion_confidence:.2f})")
            
            if detected_emotion and emotion_confidence > 0.4:
                emotion_context = f"The user seems to be feeling {detected_emotion}. "
                
                emotion_guidance = {
                    'sadness': "Be extra compassionate and supportive. Offer comfort and gentle encouragement.",
                    'anger': "Acknowledge their frustration calmly. Help them process these feelings constructively.",
                    'fear': "Provide reassurance and practical steps to address their concerns.",
                    'joy': "Share in their positive feelings and help maintain this positive state."
                }
                
                if detected_emotion in emotion_guidance:
                    emotion_context += emotion_guidance[detected_emotion] + " "
        
        except Exception as e:
            logger.error(f"Error in emotion detection: {e}")

    # Get model configuration
    model_to_use = model_mapping.get(selected_model, selected_model)
    
    # Configure based on model type
    if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
        # Anti-thinking prompt for reasoning models
        prompt = "You are MindCare AI, a compassionate mental health assistant. "
        prompt += "Be helpful, supportive, and provide actionable advice. "
        prompt += "Keep responses concise and supportive. "
        if emotion_context:
            prompt += emotion_context
        prompt += "IMPORTANT: Respond directly without any thinking process. "
        prompt += "Don't use <think> tags or explain your reasoning.\n\n"
        
        # Add conversation history (limited)
        for msg in history[-3:]:
            role = msg.get('role', '')
            content = msg.get('content', '')
            if role and content:
                prompt += f"{role.title()}: {content}\n"
        
        prompt += f"\nUser: {message}\nMindCare AI:"
        
        # Restrictive options for reasoning models
        options = {
            "temperature": 0.3,
            "top_k": 10,
            "top_p": 0.7,
            "num_predict": 200,
            "stop": ['<think>', '</', '\n\nUser:', 'User:', 'Human:']
        }
        timeout = 45
    else:
        # Standard configuration for Gemma and Llama
        prompt = "You are MindCare AI, a compassionate mental health assistant. "
        prompt += "Be helpful, supportive, and provide actionable advice. "
        prompt += "Keep responses concise and supportive. "
        if emotion_context:
            prompt += emotion_context
        prompt += "\n\n"
        
        # Add conversation history
        for msg in history[-5:]:
            role = msg.get('role', '')
            content = msg.get('content', '')
            if role and content:
                prompt += f"{role.title()}: {content}\n"
        
        prompt += f"\nUser: {message}\nMindCare AI:"
        
        # Standard options
        options = {
            "temperature": 0.6,
            "num_predict": 300
        }
        timeout = 30
    
    try:
        logger.info(f"Generating chat response with model: {model_to_use}")
        
        payload = {
            "model": model_to_use,
            "prompt": prompt,
            "stream": False,
            "options": options
        }
        
        response = requests.post(api_url, json=payload, timeout=timeout)
        
        if response.status_code == 200:
            result = response.json()
            reply = result.get("response", "").strip()
            
            # Clean up thinking tokens if present
            if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
                if '<think>' in reply and '</think>' in reply:
                    # Extract content after </think>
                    parts = reply.split('</think>')
                    if len(parts) > 1:
                        reply = parts[-1].strip()
                        logger.info(f"Cleaned thinking tokens from {model_to_use}")
                elif '<think>' in reply:
                    # Remove everything from <think> onwards
                    reply = reply.split('<think>')[0].strip()
                    logger.info(f"Truncated at thinking token for {model_to_use}")
            
            if len(reply) > 10:
                return reply, detected_emotion, emotion_confidence
        
        logger.error(f"Failed to get response from {model_to_use}")
                
    except Exception as e:
        logger.error(f"Error with {model_to_use}: {e}")
    
    # Fallback response
    fallback_reply = "I'm sorry, I'm having trouble processing your request at the moment. Could you try again later?"
    return fallback_reply, detected_emotion, emotion_confidence

@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    history = data.get('history', [])
    model = data.get('model', 'gemma')
    
    response, detected_emotion, emotion_confidence = get_chat_response_with_emotion(message, history, model)
    
    return jsonify({
        'reply': response,
        'detected_emotion': detected_emotion,
        'emotion_confidence': float(emotion_confidence) if emotion_confidence else 0.0
    })

@chatbot_bp.route('/assessment', methods=['POST'])
def assessment():
    data = request.json
    responses = data.get('responses', [])
    model = data.get('model', 'gemma')
    
    if not responses or len(responses) != 10:
        return jsonify({
            'error': 'Invalid assessment data. Expected 10 responses.'
        }), 400
    
    # Get stress level with fallback
    stress_level = get_stress_level_with_ollama_api(responses, model)
    
    
    if stress_level is None:
        logger.error("Failed to get stress level from LLM, using fallback")
        stress_level = get_fallback_stress_level(responses)
    
    # Get personalized advice
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
        
    data = request.json
    logger.info(f"Received assessment data: {data}")
    
    required_fields = ['userId', 'stressLevel', 'responses']
    for field in required_fields:
        if field not in data:
            logger.error(f"Missing required field: {field}")
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            logger.info("Processing assessment save request")
        else:
            logger.error("No Bearer token provided")
            return jsonify({'error': 'Authorization token required'}), 401
        
        if assessments_collection is None:
            return jsonify({'error': 'Database connection not available'}), 500
        
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
        
        result = assessments_collection.insert_one(assessment_doc)
        
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
    # This function can be simplified or removed since get_chat_response_with_emotion handles everything
    return get_chat_response_with_emotion(message, history, selected_model)[0]

def get_stress_level_with_ollama_api(responses, selected_model):
    """Enhanced function to get stress level using Ollama API - ALL MODELS SUPPORTED"""
    model_to_use = model_mapping.get(selected_model, selected_model)
    
    # Check if model is available first
    try:
        test_response = requests.get('http://localhost:11434/api/tags', timeout=10)
        if test_response.status_code == 200:
            available_models = [model['name'] for model in test_response.json().get('models', [])]
            if model_to_use not in available_models:
                logger.error(f"Model {model_to_use} not available. Available: {available_models}")
                return None
        else:
            logger.warning("Could not check available models")
    except Exception as e:
        logger.warning(f"Could not verify model availability: {e}")
    
    # Configure based on model type - FIXED APPROACH
    if 'deepseek' in model_to_use.lower():
        # Special handling for DeepSeek R1 reasoning model
        prompt = f"""Rate stress level 1-5 based on mental health responses:

Mood: {responses[0]}
Enjoyment: {responses[1]} 
Sleep: {responses[2]}
Energy: {responses[3]}
Appetite: {responses[4]}
Concentration: {responses[5]}
Overwhelmed: {responses[6]}
Future outlook: {responses[7]}
Support: {responses[8]}
Life thoughts: {responses[9]}

Give only a number from 1 to 5 representing stress level:"""
        
        options = {
            'temperature': 0.1,
            'top_p': 0.3,
            'num_predict': 20,
            'stop': ['\n', 'because', 'The', 'Based', 'This', 'Looking']
        }
        timeout = 60
    elif 'qwen' in model_to_use.lower():
        # Special handling for Qwen
        prompt = f"""Analyze mental health responses and rate stress level 1-5:

User responses:
1. Mood: {responses[0]}
2. Activities enjoyable: {responses[1]}
3. Sleep quality: {responses[2]}
4. Energy level: {responses[3]}
5. Appetite: {responses[4]}
6. Concentration: {responses[5]}
7. Feeling overwhelmed: {responses[6]}
8. Future outlook: {responses[7]}
9. Social support: {responses[8]}
10. Life thoughts: {responses[9]}

Stress level (1=low, 5=high):"""
        
        options = {
            'temperature': 0.2,
            'top_p': 0.5,
            'num_predict': 15,
            'stop': ['\n', '.', ' out of', 'because']
        }
        timeout = 45
    else:
        # Standard prompt for Gemma and Llama - KEEP WORKING VERSION
        prompt = (
            "You are a mental health assessment assistant. "
            "Rate the user's stress level from 1 (very low) to 5 (very high) based on these responses. "
            "ONLY return a single number from 1 to 5.\n\n"
            "Responses:\n"
        )
        
        for i, (q, a) in enumerate(zip(assessment_questions, responses)):
            prompt += f"{i+1}. {q['question']} → {a}\n"
        
        prompt += "\nStress level (1-5):"
        
        options = {
            'temperature': 0.2,
            'num_predict': 10,
            'stop': ['\n', '.', ' ', ',', ':', ';']
        }
        timeout = 45
    
    try:
        logger.info(f"Trying stress assessment with selected model: {model_to_use}")
        
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': model_to_use,
                'prompt': prompt,
                'stream': False,
                'options': options
            },
            timeout=timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            output = result.get("response", "").strip()
            logger.info(f"Model {model_to_use} raw response: '{output}'")
            
            if output:
                # Clean up response for all models
                cleaned_output = output.strip()
                
                # Remove common prefixes
                prefixes_to_remove = ["stress level:", "level:", "rating:", "score:", "answer:"]
                for prefix in prefixes_to_remove:
                    if cleaned_output.lower().startswith(prefix):
                        cleaned_output = cleaned_output[len(prefix):].strip()
                
                # Handle thinking tokens for reasoning models
                if '<think>' in cleaned_output:
                    if '</think>' in cleaned_output:
                        # Extract content after </think>
                        parts = cleaned_output.split('</think>')
                        if len(parts) > 1:
                            cleaned_output = parts[-1].strip()
                    else:
                        # Remove everything from <think> onwards
                        cleaned_output = cleaned_output.split('<think>')[0].strip()
                
                # Look for digits 1-5 with word boundaries or at start/end
                import re
                digits = re.findall(r'(?:^|\s)([1-5])(?:\s|$|[.,;:])', cleaned_output)
                if digits:
                    extracted_level = int(digits[0])
                    logger.info(f"✓ Successfully extracted stress level {extracted_level} from {model_to_use}")
                    return extracted_level
                
                # Fallback: any digit 1-5 in the response
                for c in cleaned_output:
                    if c in "12345":
                        extracted_level = int(c)
                        logger.info(f"✓ Fallback extracted stress level {extracted_level} from {model_to_use}")
                        return extracted_level
            
            logger.warning(f"No valid stress level found in response from {model_to_use}: '{output}'")
        else:
            logger.error(f"API request failed with status code: {response.status_code}")
            if response.status_code == 404:
                logger.error(f"Model {model_to_use} not found. Check if it's pulled with: ollama pull {model_to_use}")
            
    except requests.exceptions.Timeout:
        logger.error(f"Timeout with model {model_to_use}")
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error with model {model_to_use} - is Ollama running?")
    except Exception as e:
        logger.error(f"Unexpected error with {model_to_use}: {e}")
    
    logger.error("LLM model failed - no fallback available")
    return None

def get_personalized_advice_with_ollama(responses, stress_level, selected_model='gemma'):
    """Get personalized advice from Ollama based on user's responses - ALL MODELS SUPPORTED"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Create summary of concerning responses
    concerning_responses = []
    
    if "very bad" in responses[0].lower() or "bad" in responses[0].lower():
        concerning_responses.append(f"You rated your mood as {responses[0]}")
    
    if responses[1] == "No":
        concerning_responses.append("You haven't been enjoying activities you usually find pleasurable")
    
    sleep_energy_appetite = ["sleep", "energy levels", "appetite"]
    for i in range(2, 5):
        if responses[i] in ["Very poor", "Poor"]:
            topic = sleep_energy_appetite[i-2]
            concerning_responses.append(f"Your {topic} has been {responses[i].lower()}")
    
    if responses[5] in ["Not at all", "Rarely"]:
        concerning_responses.append("You've been having trouble concentrating")
    
    if responses[6] in ["Often", "Always"]:
        concerning_responses.append(f"You feel overwhelmed {responses[6].lower()}")
    
    if responses[7] in ["Very negative", "Negative"]:
        concerning_responses.append(f"Your outlook on the future is {responses[7].lower()}")
    
    if responses[8] in ["Not at all", "A little"]:
        concerning_responses.append("You don't feel very supported by friends and family")
    
    if responses[9] in ["Sometimes", "Often", "Always"]:
        concerning_responses.append(f"You've had thoughts that life isn't worth living {responses[9].lower()}")
    
    model_to_use = model_mapping.get(selected_model, selected_model)
    
    # Configure prompt based on model type
    if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
        # Shorter prompt for reasoning models
        prompt = f"""Mental health advice for stress level {stress_level}/5.

Concerns: {', '.join(concerning_responses) if concerning_responses else 'None specific'}

Give 3-4 helpful suggestions. Be supportive and direct. No reasoning process."""
        
        options = {
            "temperature": 0.5,
            "top_p": 0.8,
            "num_predict": 300,
            "stop": ['<think>', '</', '\n\nUser:', 'Human:']
        }
        timeout = 45
    else:
        # Full prompt for Gemma and Llama
        prompt = f"""You are a compassionate mental health assistant. The user has stress level {stress_level}/5.

Their concerning responses include:
- {chr(10).join(concerning_responses) if concerning_responses else 'None specifically'}

Please provide personalized, actionable advice to help them manage their stress and improve their mental wellbeing.
Give 3-5 specific suggestions that address their particular concerns.
For high stress levels (4-5), recommend professional help but also provide immediate coping strategies.

Respond directly in a caring, positive, and supportive tone. About 150-200 words."""
        
        options = {
            "temperature": 0.7,
            "num_predict": 300,
            "stop": ["\n\nUser:", "\n\nHuman:"]
        }
        timeout = 60
    
    try:
        logger.info(f"Getting advice using model: {model_to_use}")
        
        payload = {
            "model": model_to_use,
            "prompt": prompt,
            "stream": False,
            "options": options
        }
        
        response = requests.post(api_url, json=payload, timeout=timeout)
        
        if response.status_code == 200:
            result = response.json()
            advice = result.get("response", "").strip()
            
            # Clean thinking tokens if present
            if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
                if '<think>' in advice and '</think>' in advice:
                    advice = advice.split('</think>')[-1].strip()
                elif '<think>' in advice:
                    advice = advice.split('<think>')[0].strip()
            
            if len(advice) > 30:
                return advice
                
        logger.error(f"Failed to get advice from {model_to_use}")
                
    except Exception as e:
        logger.error(f"Error getting advice with {model_to_use}: {e}")
    
    # Fallback advice
    return get_fallback_advice(stress_level)

def get_fallback_advice(stress_level):
    """Return fallback advice based on stress level if API calls fail"""
    if stress_level <= 2:
        return "Your stress level appears relatively low. Continue your healthy habits and self-care routines. Regular exercise, good sleep, and social connections all contribute to maintaining positive mental health. Take a moment each day to appreciate what's going well in your life."
    elif stress_level == 3:
        return "You're experiencing moderate stress. Try incorporating regular breaks into your day, practice deep breathing when feeling overwhelmed, and ensure you're making time for activities you enjoy. Limiting screen time before bed and maintaining a consistent sleep schedule can also help manage stress levels."
    else:
        return "Your stress level is high. Consider talking to a trusted friend or mental health professional about how you're feeling. In the meantime, try stress-reduction techniques like mindfulness meditation, physical exercise, or journaling. Remember to be kind to yourself and recognize when you need to set boundaries. Your mental health is important, and seeking support is a sign of strength."