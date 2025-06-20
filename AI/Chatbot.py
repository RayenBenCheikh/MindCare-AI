from flask import Blueprint, request, jsonify
import requests
import logging
from pymongo import MongoClient
import datetime
from bson import ObjectId
import random
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ADD MISSING OLLAMA_URL
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

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

try:
    music_collection = db.Music  
    logger.info("Music collection connected in Chatbot blueprint")
except Exception as e:
    logger.error(f"Music collection connection error: {str(e)}")
    music_collection = None


def get_music_recommendations_for_stress(stress_level, limit=3):
    """Get music recommendations based on stress level"""
    try:
        if music_collection is None:
            logger.error("Music collection not available")
            return []
        
        # Map stress levels to music categories
        stress_to_category = {
            1: ['meditation', 'nature'],  # Low stress - maintain calm
            2: ['meditation', 'focus', 'nature'],  # Mild stress - focus and calm
            3: ['meditation', 'anxiety', 'sleep'],  # Moderate stress - anxiety relief
            4: ['anxiety', 'stress', 'meditation'],  # High stress - stress relief
            5: ['stress', 'anxiety', 'sleep']  # Very high stress - immediate relief
        }
        
        categories = stress_to_category.get(stress_level, ['meditation'])
        
        # Query music from database
        music_tracks = []
        
        for category in categories:
            # Get tracks from each category
            tracks = list(music_collection.find({
                'category': category,
                'isActive': {'$ne': False}  # Include documents without isActive field
            }).limit(limit))
            
            music_tracks.extend(tracks)
        
        # If no tracks found, get any available tracks
        if not music_tracks:
            music_tracks = list(music_collection.find({}).limit(limit))
        
        # Format tracks for recommendation
        recommendations = []
        for track in music_tracks[:limit]:
            recommendation = {
                'id': str(track['_id']),
                'title': track.get('title', 'Unknown Title'),
                'artist': track.get('artist', 'Unknown Artist'),
                'category': track.get('category', 'general'),
                'duration': track.get('duration', 0),
                'coverImage': track.get('coverImage', ''),
                'previewUrl': f"/api/music/stream/{track['_id']}",
                'description': track.get('tags', [])
            }
            recommendations.append(recommendation)
        
        logger.info(f"Found {len(recommendations)} music recommendations for stress level {stress_level}")
        return recommendations
        
    except Exception as e:
        logger.error(f"Error getting music recommendations: {str(e)}")
        return []

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

def get_fallback_advice(stress_level):
    """Return fallback advice based on stress level if API calls fail"""
    if stress_level <= 2:
        return "Your stress level appears relatively low. Continue your healthy habits and self-care routines. Regular exercise, good sleep, and social connections all contribute to maintaining positive mental health. Take a moment each day to appreciate what's going well in your life."
    elif stress_level == 3:
        return "You're experiencing moderate stress. Try incorporating regular breaks into your day, practice deep breathing when feeling overwhelmed, and ensure you're making time for activities you enjoy. Limiting screen time before bed and maintaining a consistent sleep schedule can also help manage stress levels."
    else:
        return "Your stress level is high. Consider talking to a trusted friend or mental health professional about how you're feeling. In the meantime, try stress-reduction techniques like mindfulness meditation, physical exercise, or journaling. Remember to be kind to yourself and recognize when you need to set boundaries. Your mental health is important, and seeking support is a sign of strength."

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
    
    # Configure based on model type - IMPROVED FOR QWEN3
    if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
        # BOTH DeepSeek AND Qwen3 use thinking patterns - treat them similarly
        prompt = f"""Rate stress level 1-5 based on mental health responses.

Assessment Data:
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

Think about this assessment, but respond with ONLY a number from 1 to 5. Show your final answer only.

Stress level:"""
        
        options = {
            'temperature': 0.1,
            'top_p': 0.3,
            'num_predict': 50,  # Allow more tokens for thinking but we'll clean it
            'stop': ['\n\n', 'Explanation:', 'Because', 'The reason', 'Analysis:', 'Overall']
        }
        timeout = 60
    else:
        # Standard prompt for Gemma and Llama
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

    # Make the API request
    data = {
        "model": model_to_use,
        "prompt": prompt,
        "stream": False,
        "options": options
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=data, timeout=timeout)
        response.raise_for_status()
        
        result = response.json()
        raw_response = result.get('response', '').strip()
        
        logger.info(f"Raw Ollama response for {model_to_use}: '{raw_response[:100]}...'")
        
        # ENHANCED parsing for thinking models (Qwen3 and DeepSeek)
        if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
            
            # METHOD 1: Look for the final answer pattern
            # Try to find "Stress level: X" or similar patterns
            final_patterns = [
                r'stress level:?\s*([1-5])',
                r'level:?\s*([1-5])',
                r'rating:?\s*([1-5])',
                r'answer:?\s*([1-5])',
                r'result:?\s*([1-5])',
                r'\b([1-5])\s*$',  # Number at the end
                r'\b([1-5])\s*/\s*5',  # X/5 format
            ]
            
            clean_response = raw_response.lower()
            
            for pattern in final_patterns:
                matches = re.findall(pattern, clean_response)
                if matches:
                    stress_level = int(matches[-1])  # Take the last match
                    logger.info(f"Extracted stress level using pattern '{pattern}': {stress_level}")
                    return stress_level
            
            # METHOD 2: Clean thinking text and extract last number
            # Remove common thinking patterns
            thinking_patterns = [
                'thinking...', 'let me think', 'let me analyze', 'looking at',
                'based on', 'the responses', 'this indicates', 'i would rate',
                'considering', 'given that', 'therefore', 'in conclusion',
                'my assessment', 'i believe', 'it appears', 'it seems'
            ]
            
            cleaned_text = raw_response.lower()
            for pattern in thinking_patterns:
                # Find where the thinking ends
                if pattern in cleaned_text:
                    parts = cleaned_text.split(pattern)
                    if len(parts) > 1:
                        # Take text after the last thinking pattern
                        cleaned_text = parts[-1]
            
            # Extract numbers from cleaned text
            numbers = re.findall(r'\b([1-5])\b', cleaned_text)
            if numbers:
                stress_level = int(numbers[-1])  # Take the last valid number
                logger.info(f"Extracted stress level from cleaned text: {stress_level}")
                return stress_level
            
            # METHOD 3: Split by common separators and take last part
            separators = ['\n\nstress level:', '\nfinal answer:', '\nrating:', '\nresult:']
            for sep in separators:
                if sep in raw_response.lower():
                    final_part = raw_response.lower().split(sep)[-1]
                    numbers = re.findall(r'\b([1-5])\b', final_part)
                    if numbers:
                        stress_level = int(numbers[0])
                        logger.info(f"Extracted stress level after separator '{sep}': {stress_level}")
                        return stress_level
        
        else:
            # Standard parsing for other models
            numbers = re.findall(r'\b([1-5])\b', raw_response)
            if numbers:
                stress_level = int(numbers[0])
                logger.info(f"Extracted stress level: {stress_level}")
                return stress_level
        
        logger.warning(f"Could not extract valid stress level from: '{raw_response[:200]}...'")
        return None
        
    except requests.exceptions.Timeout:
        logger.error(f"Timeout waiting for {model_to_use} response")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Ollama API with {model_to_use}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error with {model_to_use}: {e}")
        return None

def get_personalized_advice_with_ollama(responses, stress_level, selected_model='gemma'):
    """Get personalized advice from Ollama based on user's responses - WITH MUSIC RECOMMENDATIONS"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Get music recommendations first
    music_recommendations = get_music_recommendations_for_stress(stress_level, limit=3)
    
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
    
    # Add music context to prompt
    music_context = ""
    if music_recommendations:
        music_titles = [track['title'] for track in music_recommendations]
        music_context = f"\n\nI also have some calming music recommendations that might help: {', '.join(music_titles)}. "
    
    # Configure prompt based on model type
    if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
        prompt = f"""Mental health advice for stress level {stress_level}/5.

Concerns: {', '.join(concerning_responses) if concerning_responses else 'None specific'}

{music_context}

Give 3-4 helpful suggestions including the music recommendations. Be supportive and direct. No reasoning process."""
        
        options = {
            "temperature": 0.5,
            "top_p": 0.8,
            "num_predict": 350,
            "stop": ['<think>', '</', '\n\nUser:', 'Human:']
        }
        timeout = 45
    else:
        prompt = f"""You are a compassionate mental health assistant. The user has stress level {stress_level}/5.

Their concerning responses include:
- {chr(10).join(concerning_responses) if concerning_responses else 'None specifically'}

{music_context}

Please provide personalized, actionable advice including music therapy suggestions.
Give 3-5 specific suggestions that address their particular concerns.
For high stress levels (4-5), recommend professional help but also provide immediate coping strategies.

Respond directly in a caring, positive, and supportive tone. About 150-250 words."""
        
        options = {
            "temperature": 0.7,
            "num_predict": 400,
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
            
            # Enhanced cleaning for thinking models
            if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
                # Remove thinking patterns
                thinking_patterns = [
                    'thinking...', 'let me think', 'let me analyze', 'considering',
                    'based on', 'given that', 'i would suggest', 'my advice'
                ]
                
                lines = advice.split('\n')
                clean_lines = []
                skip_thinking = False
                
                for line in lines:
                    line_lower = line.lower().strip()
                    
                    # Skip thinking lines
                    if any(think in line_lower for think in thinking_patterns):
                        skip_thinking = True
                        continue
                    
                    # Look for actual advice content
                    if skip_thinking and line.strip():
                        advice_indicators = [
                            'try', 'consider', 'practice', 'focus on', 'remember',
                            'it\'s important', 'you might', 'here are', 'suggestions'
                        ]
                        if any(indicator in line_lower for indicator in advice_indicators):
                            skip_thinking = False
                            clean_lines.append(line)
                    elif not skip_thinking:
                        clean_lines.append(line)
                
                if clean_lines:
                    advice = '\n'.join(clean_lines).strip()
            
            if len(advice) > 30:
                return {
                    'advice': advice,
                    'musicRecommendations': music_recommendations
                }
                
        logger.error(f"Failed to get advice from {model_to_use}")
                
    except Exception as e:
        logger.error(f"Error getting advice with {model_to_use}: {e}")
    
    # Fallback advice with music
    fallback_advice = get_fallback_advice(stress_level)
    return {
        'advice': fallback_advice,
        'musicRecommendations': music_recommendations
    }

def get_chat_response_with_emotion(message, history, selected_model):
    """Process a chat message with emotion detection using Ollama API"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # INITIALIZE emotion_data DICTIONARY
    emotion_data = {
        'emotion': 'neutral',
        'confidence': 0.0
    }
    
    # Detect emotion in user's message
    if emotion_detector and emotion_detector.model:
        try:
            detected_emotion, emotion_confidence = emotion_detector.predict_emotion(message)
            emotion_probs = emotion_detector.get_emotion_probabilities(message)
            
            logger.info(f"Detected emotion: {detected_emotion} (confidence: {emotion_confidence:.2f})")
            
            # UPDATE emotion_data dictionary
            emotion_data['emotion'] = detected_emotion if detected_emotion else 'neutral'
            emotion_data['confidence'] = emotion_confidence if emotion_confidence else 0.0
            
            emotion_context = ""
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
            emotion_context = ""
    else:
        emotion_context = ""

    # Get model configuration
    model_to_use = model_mapping.get(selected_model, selected_model)
    
    # Configure based on model type - IMPROVED FOR QWEN3 CHAT
    if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
        # Allow thinking but extract clean response
        prompt = "You are MindCare AI, a compassionate mental health assistant. "
        prompt += "You can think about your response, but provide only your final helpful answer to the user. "
        prompt += "Keep your final response under 150 words and be empathetic. "
        if emotion_context:
            prompt += emotion_context
        prompt += "\n\nConversation:\n"
        
        # Add conversation history (limited)
        for msg in history[-3:]:
            role = msg.get('role', '')
            content = msg.get('content', '')
            if role and content:
                prompt += f"{role.title()}: {content}\n"
        
        prompt += f"\nUser: {message}\n\nProvide your caring response:\nMindCare AI:"
        
        # Allow more tokens but we'll clean the response
        options = {
            "temperature": 0.4,
            "top_k": 15,
            "top_p": 0.7,
            "num_predict": 300,
            "stop": ['\n\nUser:', 'User:', 'Human:', '\n\nThinking:', 'Let me think about']
        }
        timeout = 50
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
    
    # Make the API request
    data = {
        "model": model_to_use,
        "prompt": prompt,
        "stream": False,
        "options": options
    }
    
    try:
        response = requests.post(api_url, json=data, timeout=timeout)
        response.raise_for_status()
        
        result = response.json()
        ai_response = result.get('response', '').strip()
        
        # ENHANCED cleaning for thinking models (Qwen3 and DeepSeek)
        if 'deepseek' in model_to_use.lower() or 'qwen' in model_to_use.lower():
            
            # METHOD 1: Look for explicit response markers
            response_markers = [
                'mindcare ai:', 'my response:', 'response:', 'final answer:',
                'here\'s my advice:', 'i would suggest:', 'my suggestion:'
            ]
            
            lower_response = ai_response.lower()
            for marker in response_markers:
                if marker in lower_response:
                    # Split and take everything after the marker
                    parts = ai_response.split(marker, 1)
                    if len(parts) > 1:
                        ai_response = parts[1].strip()
                        break
            
            # METHOD 2: Remove thinking patterns from the beginning
            thinking_starts = [
                'thinking...', 'let me think', 'let me consider', 'i need to',
                'looking at this', 'based on what', 'given that', 'considering'
            ]
            
            lines = ai_response.split('\n')
            clean_lines = []
            skip_thinking = False
            
            for line in lines:
                line_lower = line.lower().strip()
                
                # Check if this line starts thinking
                if any(think in line_lower for think in thinking_starts):
                    skip_thinking = True
                    continue
                
                # Check if thinking ends (usually when we see helpful content)
                if skip_thinking and line.strip():
                    helpful_indicators = [
                        'i understand', 'i hear you', 'it sounds like', 'i\'m sorry',
                        'that must be', 'thank you for', 'i appreciate',
                        'here are some', 'you might try', 'consider'
                    ]
                    
                    if any(indicator in line_lower for indicator in helpful_indicators):
                        skip_thinking = False
                        clean_lines.append(line)
                    elif not any(think in line_lower for think in thinking_starts):
                        # If no more thinking patterns, include this line
                        skip_thinking = False
                        clean_lines.append(line)
                elif not skip_thinking:
                    clean_lines.append(line)
            
            if clean_lines:
                ai_response = '\n'.join(clean_lines).strip()
            
            # METHOD 3: If response is still too long or contains thinking, extract the essence
            if len(ai_response) > 500 or any(think in ai_response.lower() for think in ['thinking', 'let me', 'i need to consider']):
                # Split into sentences and keep only the helpful ones
                sentences = ai_response.split('. ')
                helpful_sentences = []
                
                for sentence in sentences:
                    sentence_lower = sentence.lower()
                    if not any(think in sentence_lower for think in thinking_starts):
                        # Keep sentences that seem like actual advice
                        if any(word in sentence_lower for word in [
                            'try', 'consider', 'might help', 'suggest', 'important',
                            'you can', 'it may', 'perhaps', 'remember', 'focus on'
                        ]):
                            helpful_sentences.append(sentence)
                
                if helpful_sentences:
                    ai_response = '. '.join(helpful_sentences[:3])  # Keep first 3 helpful sentences
                    if not ai_response.endswith('.'):
                        ai_response += '.'
        
        logger.info(f"AI Response length after cleaning: {len(ai_response)}")
        
        return {
            'response': ai_response,
            'emotion_detected': emotion_data.get('emotion', 'neutral'),
            'confidence': emotion_data.get('confidence', 0.0),
            'model_used': model_to_use
        }
        
    except Exception as e:
        logger.error(f"Error getting chat response: {e}")
        return {
            'response': "I'm sorry, I'm having trouble processing your message right now. Please try again.",
            'emotion_detected': 'neutral',
            'confidence': 0.0,
            'model_used': model_to_use
        }

@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    history = data.get('history', [])
    model = data.get('model', 'gemma')
    
    # FIX: Get response as dictionary and extract values
    response_data = get_chat_response_with_emotion(message, history, model)
    
    return jsonify({
        'reply': response_data['response'],
        'detected_emotion': response_data['emotion_detected'],
        'emotion_confidence': float(response_data['confidence']) if response_data['confidence'] else 0.0
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
    
    # Get personalized advice with music recommendations
    advice_result = get_personalized_advice_with_ollama(responses, stress_level, model)
    
    # Handle both old and new return formats
    if isinstance(advice_result, dict):
        advice = advice_result.get('advice', '')
        music_recommendations = advice_result.get('musicRecommendations', [])
    else:
        advice = advice_result
        music_recommendations = get_music_recommendations_for_stress(stress_level, limit=3)
    
    # Determine mood and severity
    mood = "depression" if stress_level >= 3 else "positive"
    severity = stress_level
    
    return jsonify({
        'mood': mood,
        'severity': severity,
        'message': f"Based on your responses, your stress level is {stress_level}/5.",
        'solutions': advice,
        'musicRecommendations': music_recommendations  # Add music recommendations
    })

@chatbot_bp.route('/music-recommendations', methods=['POST'])
def get_music_for_stress():
    """Get music recommendations based on stress level"""
    data = request.json
    stress_level = data.get('stressLevel', 3)
    limit = data.get('limit', 5)
    
    try:
        recommendations = get_music_recommendations_for_stress(stress_level, limit)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'count': len(recommendations),
            'stressLevel': stress_level
        })
        
    except Exception as e:
        logger.error(f"Error in music recommendations endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'recommendations': []
        }), 500

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