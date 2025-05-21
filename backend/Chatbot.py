from flask import Blueprint, request, jsonify
import requests
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import your assessment questions and other utilities
assessment_questions = [
    {
        "question": "How would you rate your mood today?",
        "options": ["1 - Very bad", "2 - Bad", "3 - Neutral", "4 - Good", "5 - Very good"]
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

# Create a blueprint for chat routes
chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    history = data.get('history', [])
    
    # Process the chat message using your existing logic
    response = get_chat_response(message, history)
    
    return jsonify({
        'reply': response
    })

@chatbot_bp.route('/assessment', methods=['POST'])
def assessment():
    data = request.json
    responses = data.get('responses', [])
    
    if not responses or len(responses) != 10:
        return jsonify({
            'error': 'Invalid assessment data. Expected 10 responses.'
        }), 400
    
    # Use your assessment logic from the notebook
    stress_level = get_stress_level_with_ollama_api(responses)
    
    # Get personalized advice
    advice = get_personalized_advice_with_ollama(responses, stress_level)
    
    # Determine mood and severity
    mood = "depression" if stress_level >= 3 else "positive"
    severity = stress_level
    
    return jsonify({
        'mood': mood,
        'severity': severity,
        'message': f"Based on your responses, your stress level is {stress_level}/5.",
        'solutions': advice
    })

def get_chat_response(message, history):
    """Process a chat message using Ollama API"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Prepare the prompt with conversation history
    prompt = "You are MindCare AI, a compassionate mental health assistant. "
    prompt += "Be helpful, supportive, and provide actionable advice. "
    prompt += "Keep responses concise and supportive.\n\n"
    
    # Add conversation history
    for msg in history[-5:]:  # Limit to last 5 messages to keep context manageable
        role = msg.get('role', '')
        content = msg.get('content', '')
        if role and content:
            prompt += f"{role.title()}: {content}\n"
    
    # Add the current message
    prompt += f"\nUser: {message}\nMindCare AI:"
    
    # Try different models in order of preference
    for model_name in ["gemma3:4b", "qwen3:1.7b", "mistral:7b", "llama2:7b"]:
        try:
            logger.info(f"Generating chat response with model: {model_name}")
            
            # Prepare the API request
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.7,  # Creative but controlled responses
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

def assess_stress_level_manually(responses):
    """Fallback function to estimate stress level based on rule-based approach"""
    # Count negative indicators
    negative_count = 0
    
    # Check mood (first question)
    if "1 -" in responses[0] or "2 -" in responses[0]:
        negative_count += 2
    elif "3 -" in responses[0]:
        negative_count += 1
        
    # Check enjoyment (second question)
    if responses[1] == "No":
        negative_count += 2
        
    # Check sleep, energy, appetite (questions 3-5)
    for i in range(2, 5):
        if responses[i] in ["Very poor", "Poor"]:
            negative_count += 1
            
    # Check concentration (question 6)
    if responses[5] in ["Not at all", "Rarely"]:
        negative_count += 1
            
    # Check overwhelmed (question 7)
    if responses[6] in ["Often", "Always"]:
        negative_count += 1
            
    # Check outlook (question 8)
    if responses[7] in ["Very negative", "Negative"]:
        negative_count += 1
            
    # Check support (question 9)
    if responses[8] in ["Not at all", "A little"]:
        negative_count += 1
            
    # Check thoughts (question 10)
    if responses[9] in ["Sometimes", "Often", "Always"]:
        negative_count += 2
            
    # Convert to stress level
    if negative_count >= 9:
        return 5
    elif negative_count >= 7:
        return 4
    elif negative_count >= 5:
        return 3
    elif negative_count >= 3:
        return 2
    else:
        return 1
def get_stress_level_with_ollama_api(responses):
    """Uses the Ollama API directly instead of subprocess"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Prepare the prompt
    prompt = (
        "Given the following answers to a mental health assessment, "
        "estimate the user's overall stress level on a scale from 1 (very low) to 5 (very high). "
        "Only return the number (1-5) as your answer.\n\n"
        "Answers:\n"
    )
    for i, (q, a) in enumerate(zip(assessment_questions, responses)):
        prompt += f"{i+1}. {q['question']} Answer: {a}\n"
    prompt += "\nStress level (1-5):"

    # Try different models in order of preference
    for model_name in ["gemma3:4b", "qwen3:1.7b", "mistral:7b", "llama2:7b"]:
        try:
            logger.info(f"Trying stress assessment with model: {model_name}")
            
            # Prepare the API request
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.1  # Low temperature for more deterministic output
            }
            
            # Make the API request
            response = requests.post(api_url, json=payload, timeout=30)
            
            # Check if request was successful
            if response.status_code == 200:
                result = response.json()
                output = result.get("response", "").strip()
                logger.info(f"Model response: {output}")
                
                # Extract the first digit 1-5 from the output
                for c in output:
                    if c in "12345":
                        return int(c)
                
                # If we got output but no valid number, try next model
                logger.warning("No valid stress level found in response.")
            else:
                logger.error(f"API request failed with status code: {response.status_code}")
                
        except requests.exceptions.Timeout:
            logger.error(f"Request to model {model_name} timed out.")
        except requests.exceptions.ConnectionError:
            logger.error(f"Connection error. Is Ollama running at {api_url}?")
            break  # Break the loop if Ollama is not running
        except Exception as e:
            logger.error(f"Error with {model_name}: {e}")
    
    # If all models failed, use rule-based approach
    logger.warning("Using rule-based assessment as fallback.")
    return assess_stress_level_manually(responses)

def get_personalized_advice_with_ollama(responses, stress_level):
    """Get personalized advice from Ollama based on user's specific responses"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Create a summary of concerning responses
    concerning_responses = []
    
    # Check for concerning responses
    if "1 -" in responses[0] or "2 -" in responses[0]:
        concerning_responses.append(f"You rated your mood as {responses[0]}")
    
    if responses[1] == "No":
        concerning_responses.append("You haven't been enjoying activities you usually find pleasurable")
    
    for i in range(2, 5):
        if responses[i] in ["Very poor", "Poor"]:
            concerning_responses.append(f"{assessment_questions[i]['question']}: {responses[i]}")
    
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
- {'\n- '.join(concerning_responses if concerning_responses else ['None specifically'])}

Please provide personalized, actionable advice to help them manage their stress and improve their mental wellbeing.
Give 3-5 specific suggestions that address their particular concerns.
For very high stress levels (4-5), recommend professional help but also provide immediate coping strategies.
Keep your response caring, positive and supportive. Use about 150-200 words."""

    # Try different models in order of preference
    for model_name in ["gemma3:4b", "qwen3:1.7b", "mistral:7b", "llama2:7b"]:
        try:
            logger.info(f"Getting advice using model: {model_name}")
            
            # Prepare the API request
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.7  # Slightly higher temperature for more creative advice
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