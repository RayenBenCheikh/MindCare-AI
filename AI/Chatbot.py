from flask import Blueprint, request, jsonify
import requests
import logging
from pymongo import MongoClient
import datetime
from bson import ObjectId
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# Initialize emotion detector with proper error handling
try:
    from AI.emotion_detector_dl import DeepLearningEmotionDetector
    emotion_detector = DeepLearningEmotionDetector()
    model_loaded = emotion_detector.load_model()
    if model_loaded:
        logger.info("✅ Emotion detector loaded successfully")
    else:
        logger.warning("⚠️ Emotion detector model files not found")
        emotion_detector = None
except Exception as e:
    logger.warning(f"⚠️ Emotion detector not available: {e}")
    emotion_detector = None

# Assessment questions
assessment_questions = [
    {
        "question": "How would you rate your mood today?",
        "options": ["Very bad", "Bad", "Neutral", "Good", "Very good"]
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

# MongoDB connection
MONGODB_URI = "mongodb://127.0.0.1:27017/mindcare"
try:
    client = MongoClient(MONGODB_URI)
    db = client.get_database()
    assessments_collection = db.assessments
    chats_collection = db.conversations 
    music_collection = db.Music
    users_collection = db.users  
    logger.info("✅ MongoDB connection established in Chatbot blueprint")
except Exception as e:
    logger.error(f"❌ MongoDB connection error in Chatbot blueprint: {str(e)}")
    assessments_collection = None
    chats_collection = None
    music_collection = None
    users_collection = None

def get_user_latest_vital_signs(user_id, limit=5):
    """Retrieve user's latest vital signs for stress analysis"""
    try:
        if assessments_collection is None:
            logger.warning("Database not available for vital signs retrieval")
            return None
            
        from bson import ObjectId
        
        try:
            user_obj_id = ObjectId(user_id)
        except:
            logger.error(f"Invalid user ID format: {user_id}")
            return None
            
        # Get assessments with vitalSigns for this user
        assessments = list(assessments_collection.find({
            'user': user_obj_id,
            'vitalSigns': {'$exists': True, '$ne': []},
            'isSubmitted': True
        }).sort('updatedAt', -1).limit(10))
        
        all_vital_signs = []
        
        for assessment in assessments:
            if 'vitalSigns' in assessment and assessment['vitalSigns']:
                for vital_sign in assessment['vitalSigns']:
                    vital_data = {
                        'timestamp': vital_sign.get('timestamp'),
                        'date': vital_sign.get('date'),
                        'heartRate': vital_sign.get('heartRate'),
                        'systolicBP': vital_sign.get('systolicBP'),
                        'diastolicBP': vital_sign.get('diastolicBP'),
                        'confidence': vital_sign.get('confidence'),
                        'assessmentId': str(assessment['_id'])
                    }
                    all_vital_signs.append(vital_data)
        
        # Sort by timestamp descending and take most recent
        all_vital_signs.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        recent_vitals = all_vital_signs[:limit]
        
        logger.info(f"Retrieved {len(recent_vitals)} recent vital signs for user {user_id}")
        return recent_vitals
        
    except Exception as e:
        logger.error(f"Error retrieving vital signs for user {user_id}: {e}")
        return None

def analyze_physiological_stress(vital_signs):
    """Analyze stress level based on rPPG vital signs"""
    if not vital_signs or len(vital_signs) == 0:
        return {
            'stress_level': 'unknown',
            'stress_score': 0,
            'analysis': 'No vital signs data available',
            'recommendations': [],
            'confidence': 0
        }
    
    try:
        # Extract heart rates and blood pressure readings
        heart_rates = [vs.get('heartRate', 0) for vs in vital_signs if vs.get('heartRate')]
        systolic_bps = [vs.get('systolicBP', 0) for vs in vital_signs if vs.get('systolicBP')]
        confidences = [vs.get('confidence', 0) for vs in vital_signs if vs.get('confidence')]
        
        if not heart_rates:
            return {
                'stress_level': 'unknown',
                'stress_score': 0,
                'analysis': 'Insufficient heart rate data',
                'recommendations': [],
                'confidence': 0
            }
        
        # Calculate averages and variability
        avg_hr = sum(heart_rates) / len(heart_rates)
        avg_systolic = sum(systolic_bps) / len(systolic_bps) if systolic_bps else 0
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Calculate Heart Rate Variability indicator
        hr_variability = 0
        if len(heart_rates) > 1:
            hr_variability = sum(abs(heart_rates[i] - heart_rates[i-1]) for i in range(1, len(heart_rates))) / (len(heart_rates) - 1)
        
        # Physiological stress analysis
        stress_score = 0
        stress_indicators = []
        
        # Heart rate analysis (rPPG based)
        if avg_hr > 100:
            stress_score += 4
            stress_indicators.append(f"Elevated heart rate ({avg_hr:.0f} bpm)")
        elif avg_hr > 90:
            stress_score += 3
            stress_indicators.append(f"High heart rate ({avg_hr:.0f} bpm)")
        elif avg_hr > 80:
            stress_score += 2
            stress_indicators.append(f"Moderately elevated heart rate ({avg_hr:.0f} bpm)")
        elif avg_hr < 50:
            stress_score += 1
            stress_indicators.append(f"Very low heart rate ({avg_hr:.0f} bpm)")
        
        # Blood pressure analysis
        if avg_systolic > 140:
            stress_score += 3
            stress_indicators.append(f"High systolic pressure ({avg_systolic:.0f} mmHg)")
        elif avg_systolic > 130:
            stress_score += 2
            stress_indicators.append(f"Elevated systolic pressure ({avg_systolic:.0f} mmHg)")
        elif avg_systolic > 120:
            stress_score += 1
            stress_indicators.append(f"Slightly elevated systolic pressure ({avg_systolic:.0f} mmHg)")
        
        # Heart Rate Variability analysis (low HRV = high stress)
        if hr_variability < 2:
            stress_score += 3
            stress_indicators.append("Low heart rate variability detected")
        elif hr_variability > 15:
            stress_score += 2
            stress_indicators.append("Irregular heart rate variability")
        
        # Determine stress level (0-10 scale converted to categories)
        if stress_score >= 8:
            stress_level = 'very_high'
            level_text = 'very high'
        elif stress_score >= 6:
            stress_level = 'high'
            level_text = 'high'
        elif stress_score >= 4:
            stress_level = 'moderate'
            level_text = 'moderate'
        elif stress_score >= 2:
            stress_level = 'mild'
            level_text = 'mild'
        else:
            stress_level = 'low'
            level_text = 'low'
        
        # Generate personalized SOLUTIONS (not professional referrals)
        recommendations = []
        if stress_level in ['very_high', 'high']:
            recommendations.extend([
                "Practice the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8",
                "Try progressive muscle relaxation: tense and release each muscle group",
                "Use cold water on your wrists and face to activate your vagus nerve",
                "Listen to calming music or nature sounds for 10-15 minutes",
                "Practice grounding: name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste"
            ])
        elif stress_level == 'moderate':
            recommendations.extend([
                "Take 10 deep breaths, focusing on making your exhale longer than inhale",
                "Do gentle stretching or yoga poses for 5-10 minutes",
                "Write down your thoughts to help organize and release them",
                "Take a short walk, preferably in nature or fresh air",
                "Practice mindfulness: focus on the present moment without judgment"
            ])
        else:
            recommendations.extend([
                "Continue your current healthy stress management habits",
                "Practice daily gratitude by writing down 3 things you're thankful for",
                "Maintain your regular exercise routine to keep stress levels low",
                "Stay connected with supportive friends and family"
            ])
        
        analysis_text = f"Your physiological stress level is {level_text} based on recent vital signs. "
        if stress_indicators:
            analysis_text += f"Key indicators: {', '.join(stress_indicators)}. "
        analysis_text += f"Average heart rate: {avg_hr:.0f} bpm, Average systolic BP: {avg_systolic:.0f} mmHg."
        
        return {
            'stress_level': stress_level,
            'stress_score': stress_score,
            'avg_heart_rate': avg_hr,
            'avg_systolic_bp': avg_systolic,
            'hr_variability': hr_variability,
            'analysis': analysis_text,
            'recommendations': recommendations,
            'indicators': stress_indicators,
            'confidence': avg_confidence
        }
        
    except Exception as e:
        logger.error(f"Error analyzing physiological stress: {e}")
        return {
            'stress_level': 'unknown',
            'stress_score': 0,
            'analysis': 'Error analyzing vital signs data',
            'recommendations': [],
            'confidence': 0
        }

def get_user_preferred_model(user_id, model_type='emotion'):
    """Get user's preferred model from database or localStorage"""
    try:
        if users_collection is not None and user_id:  
            from bson import ObjectId
            try:
                user_obj_id = ObjectId(user_id)
                user = users_collection.find_one({'_id': user_obj_id})
                if user and 'preferences' in user:
                    if model_type == 'emotion':
                        return user['preferences'].get('emotionModel', 'qwen3:8b')
                    elif model_type == 'assessment':
                        return user['preferences'].get('assessmentModel', 'gemma3:4b')
            except:
                pass
        
        # Default models based on your preference
        if model_type == 'emotion':
            return 'qwen3:8b'  
        elif model_type == 'assessment':
            return 'gemma3:4b'  
        else:
            return 'llama3.1:8b'  
            
    except Exception as e:
        logger.error(f"Error getting user preferred model: {e}")
        return 'qwen3:8b' if model_type == 'emotion' else 'gemma3:4b'

def save_chat_conversation_to_old_format(user_id, message, response, assessment_data=None):
    """Save conversation in the old format like your existing data"""
    try:
        if chats_collection is None:
            logger.warning("Database not available, cannot save conversation")
            return False
        
        from bson import ObjectId
        
        # Create message objects
        user_message = {
            'text': message,
            'sender': 'user',
            'timestamp': datetime.datetime.now(),
            '_id': ObjectId()
        }
        
        bot_message = {
            'text': response,
            'sender': 'bot', 
            'timestamp': datetime.datetime.now(),
            '_id': ObjectId()
        }
        
        # Try to find existing conversation for today
        today = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        existing_conversation = chats_collection.find_one({
            'userId': ObjectId(user_id),
            'createdAt': {'$gte': today}
        })
        
        if existing_conversation:
            # Add messages to existing conversation
            update_data = {
                '$push': {
                    'messages': {'$each': [user_message, bot_message]}
                },
                '$set': {
                    'lastUpdated': datetime.datetime.now(),
                    'updatedAt': datetime.datetime.now()
                },
                '$inc': {'__v': 2}
            }
            
            # If this is assessment data, update assessment results
            if assessment_data:
                update_data['$set']['assessmentResults'] = assessment_data
                update_data['$set']['topic'] = 'Mental Health Assessment'
            
            result = chats_collection.update_one(
                {'_id': existing_conversation['_id']},
                update_data
            )
            
            logger.info(f"💾 Updated existing conversation for user {user_id}")
            return str(existing_conversation['_id'])
            
        else:
            # Create new conversation
            conversation_doc = {
                'userId': ObjectId(user_id),
                'topic': 'Mental Health Assessment' if assessment_data else 'General Chat',
                'messages': [user_message, bot_message],
                'createdAt': datetime.datetime.now(),
                'lastUpdated': datetime.datetime.now(),
                'updatedAt': datetime.datetime.now(),
                '__v': 2
            }
            
            # Add assessment results if provided
            if assessment_data:
                conversation_doc['assessmentResults'] = assessment_data
            
            result = chats_collection.insert_one(conversation_doc)
            
            if result.inserted_id:
                logger.info(f"💾 Created new conversation for user {user_id}")
                return str(result.inserted_id)
            else:
                logger.error("Failed to create conversation")
                return None
        
    except Exception as e:
        logger.error(f"Error saving conversation: {e}")
        return False

def get_music_recommendations_for_stress(stress_level, limit=3):
    """Get music recommendations based on stress level"""
    try:
        if music_collection is None:
            logger.error("Music collection not available")
            return []
        
        # Map stress levels to music categories
        stress_to_category = {
            1: ['meditation', 'nature'],
            2: ['meditation', 'focus', 'nature'],
            3: ['meditation', 'anxiety', 'sleep'],
            4: ['anxiety', 'stress', 'meditation'],
            5: ['stress', 'anxiety', 'sleep']
        }
        
        categories = stress_to_category.get(stress_level, ['meditation'])
        
        # Query music from database
        music_tracks = []
        
        for category in categories[:2]:  # Limit to 2 categories to avoid too many results
            tracks = list(music_collection.find({
                'category': category,
                'isActive': {'$ne': False}
            }).limit(limit))
            
            music_tracks.extend(tracks)
        
        if not music_tracks:
            music_tracks = list(music_collection.find({}).limit(limit))
        
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
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error getting music recommendations: {str(e)}")
        return []

def get_fallback_stress_level(responses):
    """Fallback stress level calculation when LLM fails"""
    try:
        stress_score = 0
        
        # Simple scoring based on responses
        mood_response = responses[0].strip().lower()
        if "very bad" in mood_response:
            stress_score += 4
        elif "bad" in mood_response:
            stress_score += 3
        elif "neutral" in mood_response:
            stress_score += 2
        elif "good" in mood_response and "very" not in mood_response:
            stress_score += 1
        
        if responses[1].strip().lower() == "no":
            stress_score += 2
        
        # Additional scoring for other responses
        for response in responses[2:]:
            response_lower = response.strip().lower()
            if any(word in response_lower for word in ['poor', 'very poor', 'low', 'very low', 'not at all', 'never']):
                stress_score += 0
            elif any(word in response_lower for word in ['rarely', 'sometimes', 'a little']):
                stress_score += 1
            elif any(word in response_lower for word in ['often', 'mostly']):
                stress_score += 2
            elif any(word in response_lower for word in ['always', 'completely']):
                stress_score += 3
        
        # Convert score to 1-5 scale
        if stress_score <= 5:
            return 1
        elif stress_score <= 10:
            return 2
        elif stress_score <= 15:
            return 3
        elif stress_score <= 20:
            return 4
        else:
            return 5
            
    except Exception as e:
        logger.error(f"Error in fallback stress calculation: {e}")
        return 3

def get_enhanced_chat_response(message, history, user_id=None):
    """Enhanced chat response with rPPG vital signs integration"""
    
    # Get recent vital signs for physiological context
    vital_signs = get_user_latest_vital_signs(user_id, limit=5) if user_id else None
    physiological_stress = analyze_physiological_stress(vital_signs) if vital_signs else None
    
    # Existing emotion detection
    detected_emotion = 'neutral'
    emotion_confidence = 0.5
    response_tone = 'balanced and helpful'
    
    try:
        if emotion_detector is not None and hasattr(emotion_detector, 'is_model_loaded') and emotion_detector.is_model_loaded():
            detected_emotion, emotion_confidence = emotion_detector.predict_emotion(message)
            response_tone = emotion_detector.get_emotion_based_response_tone(detected_emotion, emotion_confidence)
            logger.info(f"🎭 Detected emotion: {detected_emotion} (confidence: {emotion_confidence:.3f})")
    except Exception as e:
        logger.error(f"❌ Error in emotion detection: {e}")

    # Build enhanced context with physiological data
    physiological_context = ""
    if physiological_stress and physiological_stress['stress_level'] != 'unknown':
        physiological_context = f"""
PHYSIOLOGICAL CONTEXT (Recent rPPG data):
- Physiological stress level: {physiological_stress['stress_level']}
- Average heart rate: {physiological_stress.get('avg_heart_rate', 'N/A'):.0f} bpm
- Analysis: {physiological_stress['analysis']}
- Key indicators: {', '.join(physiological_stress.get('indicators', []))}
- Data confidence: {physiological_stress.get('confidence', 0):.0f}%

IMPORTANT INSTRUCTIONS:
- Provide PRACTICAL SOLUTIONS and coping strategies, not referrals to professionals
- Focus on immediate actionable techniques the user can try right now
- Use the physiological data to give specific, personalized advice
- Be supportive and empowering, helping them feel capable of managing their situation
- Offer concrete steps they can take to improve their mental state
"""

    preferred_model = get_user_preferred_model(user_id, 'emotion')
    models_to_try = [preferred_model, "qwen3:8b", "llama3.1:8b", "deepseek-r1:7b", "gemma3:4b"]
    seen = set()
    models_to_try = [x for x in models_to_try if not (x in seen or seen.add(x))]
    
    for model_name in models_to_try:
        try:
            prompt = f"""You are MindCare AI, an empathetic mental health support assistant.
You provide warm, understanding responses with PRACTICAL SOLUTIONS and coping strategies.
Keep responses under 200 words and be supportive and empowering.

CRITICAL: Do NOT suggest seeking professional help or therapy. Instead, provide:
- Immediate coping techniques
- Breathing exercises
- Mindfulness practices
- Practical stress management tips
- Self-care strategies
- Positive reframing techniques

EMOTIONAL CONTEXT:
User is currently feeling: {detected_emotion} (confidence: {emotion_confidence:.1f})
Recommended response tone: {response_tone}

{physiological_context}

IMPORTANT: Combine emotional and physiological analysis to provide holistic, actionable solutions.
Focus on empowering the user with tools they can use immediately.
Address the mind-body connection and provide specific techniques based on their data.

Previous conversation:
"""
            
            # Add conversation history
            for msg in history[-5:]:
                role = msg.get('role', '')
                content = msg.get('content', '')
                if role and content:
                    prompt += f"{role.title()}: {content}\n"
            
            prompt += f"\nUser: {message}\nMindCare AI:"
            
            data = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 300,
                    "top_p": 0.9,
                    "repeat_penalty": 1.1
                }
            }
            
            logger.info(f"🤖 Using enhanced model {model_name} with solution-focused prompting")
            
            response = requests.post(OLLAMA_URL, json=data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get('response', '').strip()
                
                if ai_response:
                    return ai_response, detected_emotion, emotion_confidence, physiological_stress
                
        except Exception as e:
            logger.warning(f"❌ Error with model {model_name}: {e}")
            continue
    
    # Enhanced fallback with physiological context
    fallback_response = get_enhanced_fallback_response(message, physiological_stress)
    return fallback_response, detected_emotion, emotion_confidence, physiological_stress

def get_enhanced_fallback_response(message, physiological_stress):
    """Enhanced fallback response with practical solutions, NO professional referrals"""
    message_lower = message.lower()
    
    physiological_advice = ""
    if physiological_stress and physiological_stress['stress_level'] in ['high', 'very_high', 'moderate']:
        stress_level = physiological_stress['stress_level']
        avg_hr = physiological_stress.get('avg_heart_rate', 0)
        
        physiological_advice = f" Your heart rate shows {stress_level} physiological stress ({avg_hr:.0f} bpm). "
        if physiological_stress.get('recommendations'):
            top_recommendations = physiological_stress['recommendations'][:2]
            physiological_advice += f"Try these techniques: {', '.join(top_recommendations)}."
    
    if any(word in message_lower for word in ['stress', 'stressed', 'anxious', 'tension', 'worried']):
        return f"I understand you're experiencing stress.{physiological_advice} Here's what you can do right now: Try the 4-7-8 breathing technique (inhale for 4, hold for 7, exhale for 8). This activates your relaxation response. Also, try naming 5 things you can see around you to ground yourself in the present moment."
    
    elif any(word in message_lower for word in ['heart', 'cardiac', 'palpitations', 'rhythm', 'bpm']):
        return f"Heart sensations often reflect our emotional state.{physiological_advice} Try this: Place one hand on your chest, one on your belly. Breathe slowly so your belly hand moves more than your chest hand. This activates your vagus nerve and can help calm your heart rate naturally."
    
    elif any(word in message_lower for word in ['tired', 'exhausted', 'fatigue', 'energy']):
        return f"Fatigue can be connected to both emotional and physical stress.{physiological_advice} Try these energy-boosting techniques: Take 5 deep breaths, do light stretching for 2 minutes, drink some water, and step outside for fresh air if possible. Sometimes our body needs these simple resets."
    
    elif any(word in message_lower for word in ['overwhelmed', 'hopeless', 'can\'t cope', 'life not worth living', 'suicidal']):
        return f"I hear that you're struggling deeply right now, and that takes courage to share.{physiological_advice} You have more strength than you realize. Let's focus on right now: Take 3 slow, deep breaths with me. Then try this grounding technique - name 5 things you can see, 4 things you can touch, and 3 things you can hear. These feelings are temporary, and there are immediate steps that can help you feel better."
    
    elif any(word in message_lower for word in ['sad', 'depressed', 'down', 'crying', 'empty']):
        return f"It's completely normal to feel sad sometimes.{physiological_advice} Here are some immediate mood-lifting techniques: Step outside for 5 minutes if possible, listen to an uplifting song, do 10 jumping jacks to get your blood flowing, or write down one small thing you're grateful for today. Small actions can create positive shifts."
    
    elif any(word in message_lower for word in ['angry', 'mad', 'furious', 'frustrated']):
        return f"Anger is a valid emotion that shows you care deeply about something.{physiological_advice} Let's channel that energy: Try progressive muscle relaxation (tense and release each muscle group), do some physical movement like walking or stretching, or write down your thoughts to get them out of your head. What would help you feel more in control right now?"
    
    else:
        base_response = "I'm here to support you with practical tools and techniques."
        if physiological_advice:
            base_response += physiological_advice
        return f"{base_response} What's on your mind? I can help you find immediate strategies to feel better, or you can type 'start assessment' for a complete evaluation with personalized solutions."
def analyze_assessment(responses, user_id=None):
    """Enhanced assessment analysis focused on solutions, not professional referrals"""
    
    # Get user's preferred model for assessments
    preferred_model = get_user_preferred_model(user_id, 'assessment')
    
    # Models for assessment analysis in order of preference
    models_to_try = [
        preferred_model,
        "gemma3:4b",
        "deepseek-r1:7b",
        "llama3.1:8b",
        "qwen3:8b"
    ]
    
    # Remove duplicates while preserving order
    seen = set()
    models_to_try = [x for x in models_to_try if not (x in seen or seen.add(x))]
    
    for model_name in models_to_try:
        try:
            assessment_text = "User responses to mental health assessment:\n"
            for i, response in enumerate(responses):
                question = assessment_questions[i]['question']
                assessment_text += f"Q: {question}\nA: {response}\n\n"
            
            prompt = f"""Analyze this mental health assessment and provide a JSON response with PRACTICAL SOLUTIONS (no professional referrals).

Format:
{{
    "mood": "positive/neutral/depression/anxiety",
    "severity": 1-5 (1=very low stress, 5=very high stress),
    "message": "Brief summary focusing on strengths and potential",
    "solutions": "Specific, actionable techniques and strategies they can implement immediately"
}}

CRITICAL INSTRUCTIONS:
- Do NOT suggest therapy, counseling, or professional help
- Focus on practical coping strategies, self-care techniques, and immediate solutions
- Provide specific exercises, techniques, and actionable steps
- Be empowering and solution-focused
- Include breathing techniques, mindfulness practices, lifestyle adjustments

{assessment_text}

Provide only the JSON response, no additional text."""

            data = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 400
                }
            }
            
            logger.info(f"📋 Analyzing assessment with solution-focused approach using {model_name}")
            
            response = requests.post(OLLAMA_URL, json=data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get('response', '').strip()
                
                # Try to parse JSON from AI response
                try:
                    # Extract JSON from response
                    json_start = ai_response.find('{')
                    json_end = ai_response.rfind('}') + 1
                    if json_start != -1 and json_end != -1:
                        json_str = ai_response[json_start:json_end]
                        analysis_result = json.loads(json_str)
                        
                        # Validate the required fields
                        if 'severity' in analysis_result and 'mood' in analysis_result:
                            # Get music recommendations
                            stress_level = analysis_result.get('severity', 3)
                            music_recommendations = get_music_recommendations_for_stress(stress_level, limit=3)
                            analysis_result['musicRecommendations'] = music_recommendations
                            
                            logger.info(f"✅ Solution-focused assessment completed with {model_name}, stress level: {stress_level}")
                            return analysis_result
                        else:
                            logger.warning(f"⚠️ Invalid JSON structure from {model_name}")
                            continue
                    else:
                        logger.warning(f"⚠️ Could not find JSON in response from {model_name}")
                        continue
                        
                except json.JSONDecodeError as e:
                    logger.warning(f"⚠️ JSON parsing error with {model_name}: {e}")
                    continue
            else:
                logger.warning(f"❌ Assessment analysis failed with {model_name}: {response.status_code}")
                continue
                
        except Exception as e:
            logger.warning(f"⚠️ Assessment analysis error with {model_name}: {e}")
            continue
    
    # Fallback to solution-focused analysis
    logger.info("📋 Using fallback solution-focused assessment analysis")
    stress_level = get_fallback_stress_level(responses)
    music_recommendations = get_music_recommendations_for_stress(stress_level, limit=3)
    
    if stress_level <= 2:
        advice = "Your stress level is relatively low. To maintain this positive state: Practice daily gratitude by writing down 3 things you're thankful for, maintain regular exercise even if it's just a 10-minute walk, and continue your healthy sleep routine. Consider learning new relaxation techniques like progressive muscle relaxation to build your stress resilience."
    elif stress_level == 3:
        advice = "You're experiencing moderate stress. Here are immediate techniques you can try: Use the 4-7-8 breathing method (inhale 4, hold 7, exhale 8) twice daily. Practice the 5-4-3-2-1 grounding technique when feeling overwhelmed. Take 10-minute walking breaks every 2 hours. Write down your worries for 5 minutes, then write potential solutions. Ensure 7-8 hours of sleep and limit caffeine after 2 PM."
    elif stress_level == 4:
        advice = "Your stress level is high, but you have the tools to manage it. Start with these immediate actions: Practice deep breathing for 5 minutes, 3 times daily. Use progressive muscle relaxation: tense and release each muscle group for 5 seconds. Try cold water on your wrists to activate your vagus nerve. Write down your thoughts to externalize them. Create a simple daily routine with small, achievable goals."
    else:  # stress_level == 5
        advice = "Your stress level is very high, but change is possible with the right techniques. Focus on these immediate stress-relief methods: Practice emergency breathing (4-7-8 technique) when overwhelmed. Use the STOP method: Stop what you're doing, Take a deep breath, Observe your feelings without judgment, Proceed with intention. Break tasks into tiny steps - focus on just one thing at a time. Remember: you've overcome challenges before, and these feelings will pass."
    
    mood = "depression" if stress_level >= 4 else ("anxiety" if stress_level == 3 else "positive")
    
    return {
        'mood': mood,
        'severity': stress_level,
        'message': f"Your stress level is {stress_level}/5. You have the capability to manage this with the right techniques and consistent practice.",
        'solutions': advice,
        'musicRecommendations': music_recommendations
    }
@chatbot_bp.route('/stress-recommendations', methods=['GET'])
def get_personalized_stress_recommendations():
    """Get personalized practical recommendations (no professional referrals)"""
    try:
        user_id = request.args.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Analyze current stress
        vital_signs = get_user_latest_vital_signs(user_id, limit=5)
        stress_analysis = analyze_physiological_stress(vital_signs) if vital_signs else None
        
        # Practical recommendations only
        recommendations = []
        priority_level = 'normal'
        
        if stress_analysis:
            stress_level = stress_analysis['stress_level']
            
            if stress_level == 'very_high':
                priority_level = 'urgent'
                recommendations = [
                    "🫁 IMMEDIATE: Practice 4-7-8 breathing (inhale 4, hold 7, exhale 8) for 3 cycles",
                    "❄️ Apply cold water to your wrists and face to activate vagus nerve",
                    "🧘‍♀️ Use progressive muscle relaxation: tense and release each muscle group",
                    "🎵 Listen to calming music or nature sounds for 10 minutes",
                    "✍️ Write down your thoughts to externalize and organize them",
                    "🚶‍♀️ Take a slow 5-minute walk, focusing on your breathing",
                    "🛑 Use STOP technique: Stop, Take a breath, Observe feelings, Proceed mindfully"
                ]
            elif stress_level == 'high':
                priority_level = 'high'
                recommendations = [
                    "🫁 Practice deep diaphragmatic breathing for 5-10 minutes",
                    "🚶‍♀️ Take a 10-minute walk, preferably outdoors",
                    "🧘‍♀️ Try the 5-4-3-2-1 grounding technique",
                    "💧 Drink water and do gentle neck/shoulder stretches",
                    "📱 Take a 15-minute break from screens and notifications"
                ]
            elif stress_level == 'moderate':
                priority_level = 'moderate'
                recommendations = [
                    "🌱 Practice mindfulness: focus on your breath for 5 minutes",
                    "🎵 Listen to your favorite calming playlist",
                    "☕ Take a mindful break with tea or coffee",
                    "📚 Practice gratitude: write down 3 things you're thankful for",
                    "🛁 Take a warm shower or do gentle stretching"
                ]
            else:
                recommendations = [
                    "✅ Continue your current healthy stress management habits",
                    "🌟 Practice daily gratitude journaling",
                    "🎨 Engage in creative activities you enjoy",
                    "🏃‍♀️ Maintain regular physical activity for stress prevention"
                ]
        
        return jsonify({
            'success': True,
            'stress_level': stress_analysis['stress_level'] if stress_analysis else 'unknown',
            'priority_level': priority_level,
            'recommendations': recommendations,
            'analysis': stress_analysis['analysis'] if stress_analysis else 'Analysis not available',
            'heart_rate_info': {
                'current': stress_analysis.get('avg_heart_rate') if stress_analysis else None,
                'variability': stress_analysis.get('hr_variability') if stress_analysis else None
            },
            'message': 'Here are practical techniques you can use right now to manage your stress level.'
        })
        
    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
def get_enhanced_fallback_response(message, physiological_stress):
    """Enhanced fallback response with physiological context"""
    message_lower = message.lower()
    
    physiological_advice = ""
    if physiological_stress and physiological_stress['stress_level'] in ['high', 'very_high', 'moderate']:
        stress_level = physiological_stress['stress_level']
        avg_hr = physiological_stress.get('avg_heart_rate', 0)
        
        physiological_advice = f" Your recent vital signs show {stress_level} physiological stress (heart rate: {avg_hr:.0f} bpm). "
        if physiological_stress.get('recommendations'):
            top_recommendations = physiological_stress['recommendations'][:2]
            physiological_advice += f"I recommend: {', '.join(top_recommendations)}."
    
    if any(word in message_lower for word in ['stress', 'stressed', 'anxious', 'tension', 'worried']):
        return f"I understand you're experiencing stress.{physiological_advice} The connection between your heart and mind is important for overall well-being. Would you like to do a complete assessment? Type 'start assessment'."
    
    elif any(word in message_lower for word in ['heart', 'cardiac', 'palpitations', 'rhythm', 'bpm']):
        return f"Heart sensations can be related to stress levels.{physiological_advice} Your heart rate can reflect your emotional state. Let's talk more about this or do an assessment: 'start assessment'."
    
    elif any(word in message_lower for word in ['tired', 'exhausted', 'fatigue', 'energy']):
        return f"Fatigue can be connected to both emotional and physical stress.{physiological_advice} Let's explore what might be affecting your energy levels. Type 'start assessment' for a comprehensive evaluation."
    
    else:
        base_response = "I'm here to support you."
        if physiological_advice:
            base_response += physiological_advice
        return f"{base_response} Share what's concerning you or type 'start assessment' for a complete evaluation."

def get_chat_response(message, history, user_id=None):
    """Legacy function - now uses enhanced version"""
    response, detected_emotion, emotion_confidence, physiological_stress = get_enhanced_chat_response(message, history, user_id)
    return response, detected_emotion, emotion_confidence

def get_fallback_response(message):
    """Fallback responses when Ollama is not available"""
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['sad', 'depressed', 'down', 'lonely']):
        return "I understand you're feeling down. It's okay to have difficult emotions. Would you like to try our mental health assessment to better understand how you're feeling? Just type 'start assessment'."
    
    elif any(word in message_lower for word in ['anxious', 'worried', 'stress', 'panic']):
        return "It sounds like you're experiencing some anxiety or stress. These feelings are very common. Deep breathing exercises can help. Would you like me to guide you through an assessment? Type 'start assessment'."
    
    elif any(word in message_lower for word in ['help', 'support', 'talk']):
        return "I'm here to support you. You can talk to me about how you're feeling, or I can help you with a mental health assessment. Just type 'start assessment' to begin."
    
    elif 'music' in message_lower:
        return "Music can be very therapeutic! I can recommend personalized music based on your mood. Would you like to start with a mental health assessment first? Type 'start assessment'."
    
    else:
        return "I'm here to listen and support you. Feel free to share what's on your mind, or type 'start assessment' to begin a mental health evaluation."

def analyze_assessment(responses, user_id=None):
    """Enhanced assessment analysis using gemma3:4b for assessments"""
    
    # Get user's preferred model for assessments
    preferred_model = get_user_preferred_model(user_id, 'assessment')
    
    # Models for assessment analysis in order of preference
    models_to_try = [
        preferred_model,
        "gemma3:4b",
        "deepseek-r1:7b",
        "llama3.1:8b",
        "qwen3:8b"
    ]
    
    # Remove duplicates while preserving order
    seen = set()
    models_to_try = [x for x in models_to_try if not (x in seen or seen.add(x))]
    
    for model_name in models_to_try:
        try:
            assessment_text = "User responses to mental health assessment:\n"
            for i, response in enumerate(responses):
                question = assessment_questions[i]['question']
                assessment_text += f"Q: {question}\nA: {response}\n\n"
            
            prompt = f"""Analyze this mental health assessment and provide a JSON response with the following format:
{{
    "mood": "positive/neutral/depression/anxiety",
    "severity": 1-5 (1=very low stress, 5=very high stress),
    "message": "Brief summary of the assessment",
    "solutions": "Personalized advice and recommendations"
}}

{assessment_text}

Provide only the JSON response, no additional text."""

            data = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 400
                }
            }
            
            logger.info(f"📋 Analyzing assessment with {model_name} for user {user_id}")
            
            response = requests.post(OLLAMA_URL, json=data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get('response', '').strip()
                
                # Try to parse JSON from AI response
                try:
                    # Extract JSON from response (sometimes AI adds extra text)
                    json_start = ai_response.find('{')
                    json_end = ai_response.rfind('}') + 1
                    if json_start != -1 and json_end != -1:
                        json_str = ai_response[json_start:json_end]
                        analysis_result = json.loads(json_str)
                        
                        # Validate the required fields
                        if 'severity' in analysis_result and 'mood' in analysis_result:
                            # Get music recommendations
                            stress_level = analysis_result.get('severity', 3)
                            music_recommendations = get_music_recommendations_for_stress(stress_level, limit=3)
                            analysis_result['musicRecommendations'] = music_recommendations
                            
                            logger.info(f"✅ Assessment analysis completed with {model_name}, stress level: {stress_level}")
                            return analysis_result
                        else:
                            logger.warning(f"⚠️ Invalid JSON structure from {model_name}")
                            continue
                    else:
                        logger.warning(f"⚠️ Could not find JSON in response from {model_name}")
                        continue
                        
                except json.JSONDecodeError as e:
                    logger.warning(f"⚠️ JSON parsing error with {model_name}: {e}")
                    continue
            else:
                logger.warning(f"❌ Assessment analysis failed with {model_name}: {response.status_code}")
                continue
                
        except Exception as e:
            logger.warning(f"⚠️ Assessment analysis error with {model_name}: {e}")
            continue
    
    # Fallback to simple analysis
    logger.info("📋 Using fallback assessment analysis")
    stress_level = get_fallback_stress_level(responses)
    music_recommendations = get_music_recommendations_for_stress(stress_level, limit=3)
    
    # Simple advice based on stress level
    if stress_level <= 2:
        advice = "Your stress level appears relatively low. Continue your healthy habits and self-care routines. Consider regular exercise and maintaining social connections."
    elif stress_level == 3:
        advice = "You're experiencing moderate stress. Try incorporating regular breaks, relaxation techniques like deep breathing, and ensure you're getting adequate sleep."
    else:
        advice = "Your stress level is high. Consider talking to a mental health professional. Practice stress-reduction techniques like meditation, exercise, and reach out to supportive friends or family."
    
    mood = "depression" if stress_level >= 4 else ("anxiety" if stress_level == 3 else "positive")
    
    return {
        'mood': mood,
        'severity': stress_level,
        'message': f"Based on your responses, your stress level is {stress_level}/5. {advice}",
        'solutions': advice,
        'musicRecommendations': music_recommendations
    }

# ROUTES
@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        history = data.get('history', [])
        user_id = data.get('userId')
        
        logger.info(f"💬 Enhanced chat request from user {user_id}: {message[:50]}...")
        
        if not user_id:
            logger.warning("⚠️ No user ID provided in chat request")
            return jsonify({
                'reply': "Please log in to continue chatting.",
                'error': 'User ID required'
            }), 400
        
        # Use enhanced response with rPPG integration
        response, detected_emotion, emotion_confidence, physiological_stress = get_enhanced_chat_response(message, history, user_id)
        
        # Save conversation with enhanced metadata
        saved = False
        conversation_id = None
        try:
            # Enrich conversation metadata with physiological data
            enhanced_metadata = {
                'detected_emotion': detected_emotion,
                'emotion_confidence': emotion_confidence
            }
            
            if physiological_stress and physiological_stress['stress_level'] != 'unknown':
                enhanced_metadata.update({
                    'physiological_stress': physiological_stress['stress_level'],
                    'avg_heart_rate': physiological_stress.get('avg_heart_rate'),
                    'stress_score': physiological_stress.get('stress_score'),
                    'data_confidence': physiological_stress.get('confidence')
                })
            
            conversation_id = save_chat_conversation_to_old_format(user_id, message, response, enhanced_metadata)
            saved = conversation_id is not None
        except Exception as e:
            logger.error(f"Error saving enhanced chat conversation: {e}")
        
        # Enhanced response data
        response_data = {
            'reply': response,
            'detected_emotion': detected_emotion,
            'emotion_confidence': emotion_confidence,
            'timestamp': datetime.datetime.now().isoformat(),
            'saved': saved,
            'conversationId': conversation_id,
            'model_used': get_user_preferred_model(user_id, 'emotion')
        }
        
        # Add physiological analysis if available
        if physiological_stress and physiological_stress['stress_level'] != 'unknown':
            response_data['physiological_analysis'] = {
                'stress_level': physiological_stress['stress_level'],
                'avg_heart_rate': physiological_stress.get('avg_heart_rate'),
                'avg_systolic_bp': physiological_stress.get('avg_systolic_bp'),
                'analysis': physiological_stress['analysis'],
                'recommendations': physiological_stress.get('recommendations', []),
                'confidence': physiological_stress.get('confidence')
            }
        
        logger.info(f"✅ Enhanced chat response sent with physiological context: {physiological_stress['stress_level'] if physiological_stress else 'no_data'}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in enhanced chat endpoint: {e}")
        return jsonify({
            'reply': "I'm experiencing technical difficulties. Please try again.",
            'error': str(e)
        }), 500

@chatbot_bp.route('/physiological-stress', methods=['GET'])
def get_physiological_stress_analysis():
    """Get current physiological stress analysis for a user"""
    try:
        user_id = request.args.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Get recent vital signs
        vital_signs = get_user_latest_vital_signs(user_id, limit=10)
        
        if not vital_signs:
            return jsonify({
                'success': False,
                'message': 'No vital signs data found',
                'stress_analysis': None
            })
        
        # Analyze physiological stress
        stress_analysis = analyze_physiological_stress(vital_signs)
        
        return jsonify({
            'success': True,
            'vital_signs_count': len(vital_signs),
            'latest_measurement': vital_signs[0] if vital_signs else None,
            'stress_analysis': stress_analysis,
            'timestamp': datetime.datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in physiological stress analysis: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chatbot_bp.route('/heart-mind-connection', methods=['POST'])
def analyze_heart_mind_connection():
    """Analyze the connection between physiological and emotional state"""
    try:
        data = request.json
        user_id = data.get('userId')
        message = data.get('message', '')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Get physiological data
        vital_signs = get_user_latest_vital_signs(user_id, limit=5)
        physiological_stress = analyze_physiological_stress(vital_signs) if vital_signs else None
        
        # Get emotional analysis
        detected_emotion = 'neutral'
        emotion_confidence = 0.5
        
        if message and emotion_detector and emotion_detector.is_model_loaded():
            detected_emotion, emotion_confidence = emotion_detector.predict_emotion(message)
        
        # Analyze heart-mind connection
        connection_analysis = {
            'correlation': 'unknown',
            'insights': [],
            'recommendations': []
        }
        
        if physiological_stress and physiological_stress['stress_level'] != 'unknown':
            phys_stress_level = physiological_stress['stress_level']
            
            # Map emotions to stress levels for correlation analysis
            emotional_stress_mapping = {
                'joy': 'low',
                'sadness': 'moderate',
                'anger': 'high',
                'fear': 'high',
                'neutral': 'mild'
            }
            
            emotional_stress = emotional_stress_mapping.get(detected_emotion, 'mild')
            
            # Analyze correlation
            if phys_stress_level == emotional_stress:
                connection_analysis['correlation'] = 'aligned'
                connection_analysis['insights'].append("Your emotional and physiological states are well-aligned")
            elif (phys_stress_level in ['high', 'very_high'] and emotional_stress in ['low', 'mild']):
                connection_analysis['correlation'] = 'physical_higher'
                connection_analysis['insights'].append("Your body shows more stress than your emotions suggest")
                connection_analysis['recommendations'].append("Consider if there are underlying physical stressors")
            elif (emotional_stress in ['high', 'moderate'] and phys_stress_level in ['low', 'mild']):
                connection_analysis['correlation'] = 'emotional_higher'
                connection_analysis['insights'].append("Your emotions show more stress than your vital signs")
                connection_analysis['recommendations'].append("Focus on emotional regulation techniques")
            else:
                connection_analysis['correlation'] = 'complex'
                connection_analysis['insights'].append("Complex relationship between emotional and physical states")
        
        return jsonify({
            'success': True,
            'physiological_state': {
                'stress_level': physiological_stress['stress_level'] if physiological_stress else 'unknown',
                'heart_rate': physiological_stress.get('avg_heart_rate') if physiological_stress else None
            },
            'emotional_state': {
                'emotion': detected_emotion,
                'confidence': emotion_confidence
            },
            'heart_mind_connection': connection_analysis,
            'timestamp': datetime.datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error analyzing heart-mind connection: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Keep all existing routes unchanged
@chatbot_bp.route('/assessment', methods=['POST'])
def assessment():
    try:
        data = request.json
        responses = data.get('responses', [])
        user_id = data.get('userId')
        
        logger.info(f"📋 Assessment request from user {user_id} with {len(responses)} responses")
        
        if not user_id:
            logger.warning("⚠️ No user ID provided in assessment request")
            return jsonify({
                'error': 'User ID required',
                'message': 'Please log in to complete the assessment.',
                'severity': 3,
                'mood': 'neutral',
                'solutions': 'Please log in to save your assessment results and get personalized recommendations.'
            }), 400
        
        if not responses or len(responses) != 10:
            return jsonify({
                'error': 'Invalid assessment data. Expected 10 responses.'
            }), 400
        
        # Analyze responses using user's preferred assessment model
        result = analyze_assessment(responses, user_id)
        
        # Create assessment data in old format
        assessment_data = {
            'responses': responses,
            'analysis': result.get('message', ''),
            'recommendations': result.get('solutions', ''),
            'stressLevel': result.get('severity', 3),
            'mood': result.get('mood', 'neutral'),
            'completed': True,
            'completedAt': datetime.datetime.now()
        }
        
        # Save assessment results in conversation format
        saved = False
        conversation_id = None
        try:
            # Create the assessment completion message
            assessment_message = f"Assessment completed. Stress level: {result.get('severity', 3)}/5"
            assessment_response = result.get('solutions', 'Assessment completed successfully.')
            
            conversation_id = save_chat_conversation_to_old_format(
                user_id, 
                assessment_message, 
                assessment_response, 
                assessment_data
            )
            saved = conversation_id is not None
        except Exception as e:
            logger.error(f"Error saving assessment: {e}")
        
        # Ensure all required fields are in response
        result['assessmentId'] = conversation_id
        result['saved'] = saved
        result['model_used'] = get_user_preferred_model(user_id, 'assessment')
        
        # Make sure we have all required fields
        if 'message' not in result:
            result['message'] = f"Assessment completed. Your stress level is {result.get('severity', 3)}/5."
        
        if 'solutions' not in result:
            stress_level = result.get('severity', 3)
            if stress_level <= 2:
                result['solutions'] = "Your stress level appears relatively low. Continue your healthy habits and self-care routines. Consider regular exercise and maintaining social connections."
            elif stress_level == 3:
                result['solutions'] = "You're experiencing moderate stress. Try incorporating regular breaks, relaxation techniques like deep breathing, and ensure you're getting adequate sleep."
            else:
                result['solutions'] = "Your stress level is high. Consider talking to a mental health professional. Practice stress-reduction techniques like meditation, exercise, and reach out to supportive friends or family."
        
        logger.info(f"✅ Assessment completed for user {user_id}, stress level: {result.get('severity')}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in assessment endpoint: {e}")
        return jsonify({
            'error': 'Assessment analysis failed',
            'message': 'Please try again later.',
            'severity': 3,
            'mood': 'neutral',
            'solutions': 'We encountered an issue analyzing your responses. Please try again.'
        }), 500

@chatbot_bp.route('/conversation/<conversation_id>', methods=['GET'])
def get_single_conversation(conversation_id):
    """Get a single conversation by ID"""
    try:
        if chats_collection is None:
            return jsonify({'error': 'Database not available'}), 500
            
        from bson import ObjectId
        
        try:
            conv_obj_id = ObjectId(conversation_id)
        except:
            return jsonify({'error': 'Invalid conversation ID'}), 400
            
        conversation = chats_collection.find_one({'_id': conv_obj_id})
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
            
        # Convert ObjectId to string for JSON serialization
        conversation['_id'] = str(conversation['_id'])
        conversation['userId'] = str(conversation['userId'])
        
        # Convert message ObjectIds to strings
        if 'messages' in conversation:
            for message in conversation['messages']:
                if '_id' in message:
                    message['_id'] = str(message['_id'])
        
        return jsonify({
            'success': True,
            'conversation': conversation
        })
        
    except Exception as e:
        logger.error(f"Error fetching conversation {conversation_id}: {e}")
        return jsonify({'error': 'Server error'}), 500

@chatbot_bp.route('/user/preferences', methods=['POST'])
def update_user_preferences():
    """Update user's model preferences"""
    try:
        data = request.json
        user_id = data.get('userId')
        emotion_model = data.get('emotionModel', 'qwen3:8b')
        assessment_model = data.get('assessmentModel', 'gemma3:4b')
        
        logger.info(f"🔧 Updating preferences for user {user_id}: emotion={emotion_model}, assessment={assessment_model}")
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        if users_collection is not None:
            from bson import ObjectId
            try:
                user_obj_id = ObjectId(user_id)
                result = users_collection.update_one(
                    {'_id': user_obj_id},
                    {
                        '$set': {
                            'preferences.emotionModel': emotion_model,
                            'preferences.assessmentModel': assessment_model,
                            'preferences.updatedAt': datetime.datetime.now()
                        }
                    },
                    upsert=True
                )
                
                if result.modified_count > 0 or result.upserted_id:
                    logger.info(f"✅ Updated preferences for user {user_id}: emotion={emotion_model}, assessment={assessment_model}")
                    return jsonify({
                        'success': True,
                        'message': 'Preferences updated successfully',
                        'emotionModel': emotion_model,
                        'assessmentModel': assessment_model
                    })
                else:
                    logger.warning(f"⚠️ No changes made to preferences for user {user_id}")
                    return jsonify({
                        'success': True,
                        'message': 'Preferences updated successfully (no changes)',
                        'emotionModel': emotion_model,
                        'assessmentModel': assessment_model
                    })
                    
            except Exception as e:
                logger.error(f"❌ Error updating preferences for user {user_id}: {e}")
                return jsonify({'error': f'Database error: {str(e)}'}), 500
        else:
            logger.warning("⚠️ Database not available, preferences not saved to server")
            return jsonify({
                'error': 'Database not available', 
                'message': 'Preferences saved locally only'
            }), 503
            
    except Exception as e:
        logger.error(f"❌ Error in update_user_preferences: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@chatbot_bp.route('/user/preferences', methods=['GET'])
def get_user_preferences():
    """Get user's model preferences"""
    try:
        user_id = request.args.get('userId')
        
        logger.info(f"🔍 Getting preferences for user {user_id}")
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        emotion_model = get_user_preferred_model(user_id, 'emotion')
        assessment_model = get_user_preferred_model(user_id, 'assessment')
        
        logger.info(f"📋 Retrieved preferences for user {user_id}: emotion={emotion_model}, assessment={assessment_model}")
        
        return jsonify({
            'success': True,
            'emotionModel': emotion_model,
            'assessmentModel': assessment_model,
            'message': 'Preferences retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"❌ Error in get_user_preferences: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@chatbot_bp.route('/models/available', methods=['GET'])
def get_available_models():
    """Get list of available Ollama models"""
    try:
        response = requests.get("http://127.0.0.1:11434/api/tags", timeout=10)
        if response.status_code == 200:
            models_data = response.json()
            available_models = []
            
            for model in models_data.get('models', []):
                model_name = model.get('name', '')
                available_models.append({
                    'name': model_name,
                    'size': model.get('size', 0),
                    'modified': model.get('modified_at', ''),
                    'recommended_for': get_model_recommendation(model_name)
                })
            
            return jsonify({
                'success': True,
                'models': available_models,
                'count': len(available_models)
            })
        else:
            return jsonify({'error': 'Could not fetch models from Ollama'}), 500
            
    except Exception as e:
        logger.error(f"Error fetching available models: {e}")
        return jsonify({'error': str(e)}), 500

def get_model_recommendation(model_name):
    """Get recommendation for what each model is good for"""
    recommendations = {
        'qwen3:8b': 'Best for emotional conversations and empathetic responses',
        'gemma3:4b': 'Excellent for assessments and analytical tasks',
        'llama3.1:8b': 'Well-rounded model for general conversations',
        'deepseek-r1:7b': 'Great for reasoning and problem-solving'
    }
    
    for key, desc in recommendations.items():
        if key in model_name:
            return desc
    
    return 'General purpose model'

@chatbot_bp.route('/analyze-emotion', methods=['POST'])
def analyze_emotion():
    """Analyze emotion in text using the trained model"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        if emotion_detector and emotion_detector.is_model_loaded():
            # Get emotion prediction
            emotion, confidence = emotion_detector.predict_emotion(text)
            
            # Get all emotion probabilities
            probabilities = emotion_detector.get_emotion_probabilities(text)
            
            # Get response tone suggestion
            response_tone = emotion_detector.get_emotion_based_response_tone(emotion, confidence)
            
            return jsonify({
                'success': True,
                'detected_emotion': emotion,
                'confidence': confidence,
                'response_tone': response_tone,
                'all_probabilities': probabilities,
                'model_status': 'loaded'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Emotion detection model not available',
                'detected_emotion': 'neutral',
                'confidence': 0.5,
                'model_status': 'not_loaded'
            })
            
    except Exception as e:
        logger.error(f"Error in emotion analysis: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'detected_emotion': 'neutral',
            'confidence': 0.5
        }), 500

@chatbot_bp.route('/emotion-model/status', methods=['GET'])
def emotion_model_status():
    """Get the status of the emotion detection model"""
    try:
        if emotion_detector and emotion_detector.is_model_loaded():
            model_info = emotion_detector.get_model_info()
            return jsonify({
                'success': True,
                'model_loaded': True,
                'model_info': model_info
            })
        else:
            return jsonify({
                'success': True,
                'model_loaded': False,
                'message': 'Emotion detection model not available'
            })
            
    except Exception as e:
        logger.error(f"Error checking emotion model status: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'model_loaded': False
        }), 500

@chatbot_bp.route('/health', methods=['GET'])
def chatbot_health():
    """Health check for chatbot service"""
    try:
        # Test Ollama connection
        ollama_status = False
        available_models = []
        try:
            response = requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
            if response.status_code == 200:
                ollama_status = True
                models_data = response.json()
                available_models = [model.get('name', '') for model in models_data.get('models', [])]
        except:
            pass
        
        # Test database connection
        db_status = assessments_collection is not None
        
        return jsonify({
            'status': 'healthy',
            'service': 'MindCare-AI Chatbot with rPPG Integration',
            'timestamp': datetime.datetime.now().isoformat(),
            'features': {
                'ollama_connection': ollama_status,
                'database_connection': db_status,
                'emotion_detector': emotion_detector is not None and emotion_detector.is_model_loaded() if emotion_detector else False,
                'music_recommendations': music_collection is not None,
                'user_model_selection': True,
                'rppg_integration': True,
                'physiological_stress_analysis': True,
                'heart_mind_connection': True
            },
            'available_models': available_models,
            'preferred_models': {
                'emotion': 'qwen3:8b',
                'assessment': 'gemma3:4b'
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@chatbot_bp.route('/history', methods=['GET'])
def get_chat_history():
    """Get conversation history for the authenticated user"""
    try:
        # Get user ID from Authorization header or query params
        user_id = request.args.get('userId')
        if not user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                # You can decode the token here to get user_id
                # For now, we'll use a placeholder
                pass
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
            
        if chats_collection is None:
            return jsonify({'error': 'Database not available'}), 500
            
        # Get conversations for this user
        from bson import ObjectId
        try:
            user_obj_id = ObjectId(user_id)
        except:
            return jsonify({'error': 'Invalid user ID'}), 400
            
        conversations = list(chats_collection.find(
            {'userId': user_obj_id}
        ).sort('lastUpdated', -1).limit(50))
        
        # Convert ObjectIds to strings for JSON serialization
        for conv in conversations:
            conv['_id'] = str(conv['_id'])
            conv['userId'] = str(conv['userId'])
            
            # Convert message ObjectIds
            if 'messages' in conv:
                for msg in conv['messages']:
                    if '_id' in msg:
                        msg['_id'] = str(msg['_id'])
        
        return jsonify({
            'success': True,
            'conversations': conversations,
            'count': len(conversations)
        })
        
    except Exception as e:
        logger.error(f"Error fetching conversation history: {e}")
        return jsonify({'error': 'Server error'}), 500