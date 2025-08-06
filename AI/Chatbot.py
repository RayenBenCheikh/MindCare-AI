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
    from emotion_detector_dl import DeepLearningEmotionDetector
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
        
        for category in categories:
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

def get_chat_response(message, history, user_id=None):
    """Enhanced chat response using qwen3:8b for emotions with emotion detection"""
    
    # Detect emotion in user message
    detected_emotion = 'neutral'
    emotion_confidence = 0.5
    response_tone = 'balanced and helpful'
    
    try:
        if emotion_detector is not None and hasattr(emotion_detector, 'is_model_loaded') and emotion_detector.is_model_loaded():
            detected_emotion, emotion_confidence = emotion_detector.predict_emotion(message)
            response_tone = emotion_detector.get_emotion_based_response_tone(detected_emotion, emotion_confidence)
            logger.info(f"🎭 Detected emotion: {detected_emotion} (confidence: {emotion_confidence:.3f})")
        else:
            logger.warning("⚠️ Emotion detector not available, using default tone")
    except Exception as e:
        logger.error(f"❌ Error in emotion detection: {e}")

    # Get user's preferred model for emotional conversations
    preferred_model = get_user_preferred_model(user_id, 'emotion')
    
    # Fallback models in order of preference
    models_to_try = [
        preferred_model,
        "qwen3:8b",
        "llama3.1:8b",
        "deepseek-r1:7b",
        "gemma3:4b"
    ]
    
    # Remove duplicates while preserving order
    seen = set()
    models_to_try = [x for x in models_to_try if not (x in seen or seen.add(x))]
    
    for model_name in models_to_try:
        try:
            # Build conversation context with emotion-aware prompt
            prompt = f"""You are MindCare AI, a compassionate mental health support assistant. 
You provide warm, understanding, and helpful responses to users seeking emotional support.
Be empathetic, offer practical advice when appropriate, and keep responses under 200 words.

IMPORTANT: The user is currently feeling {detected_emotion} (confidence: {emotion_confidence:.1f}). 
Please respond in a {response_tone} manner that acknowledges their emotional state.

If someone mentions feeling depressed, anxious, or having suicidal thoughts, encourage them and provide professional guidance.

Previous conversation:
"""
            
            # Add conversation history (last 5 messages)
            for msg in history[-5:]:
                role = msg.get('role', '')
                content = msg.get('content', '')
                if role and content:
                    prompt += f"{role.title()}: {content}\n"
            
            prompt += f"\nUser: {message}\nMindCare AI:"
            
            # Ollama API request
            data = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 250,
                    "top_p": 0.9,
                    "repeat_penalty": 1.1
                }
            }
            
            logger.info(f"🤖 Trying emotion model {model_name} for user {user_id} (emotion: {detected_emotion})")
            
            response = requests.post(OLLAMA_URL, json=data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get('response', '').strip()
                
                if ai_response:
                    logger.info(f"✅ Success with {model_name}: {len(ai_response)} characters")
                    return ai_response, detected_emotion, emotion_confidence
                else:
                    logger.warning(f"⚠️ Empty response from {model_name}")
                    continue
            else:
                logger.warning(f"❌ Model {model_name} failed with status {response.status_code}")
                continue
                
        except requests.exceptions.ConnectionError:
            logger.error("❌ Cannot connect to Ollama server. Is it running?")
            break
        
        except requests.exceptions.Timeout:
            logger.warning(f"⏰ Timeout with model {model_name}")
            continue
        
        except Exception as e:
            logger.warning(f"❌ Error with model {model_name}: {e}")
            continue
    
    # If all models fail, use fallback
    logger.error("❌ All emotion models failed, using fallback response")
    fallback_response = get_fallback_response(message)
    return fallback_response, detected_emotion, emotion_confidence

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
        
        logger.info(f"💬 Chat request from user {user_id}: {message[:50]}...")
        
        if not user_id:
            logger.warning("⚠️ No user ID provided in chat request")
            return jsonify({
                'reply': "Please log in to continue chatting.",
                'error': 'User ID required'
            }), 400
        
        # Get response using user's preferred emotion model with emotion detection
        response, detected_emotion, emotion_confidence = get_chat_response(message, history, user_id)
        
        # Save conversation in old format
        saved = False
        conversation_id = None
        try:
            conversation_id = save_chat_conversation_to_old_format(user_id, message, response)
            saved = conversation_id is not None
        except Exception as e:
            logger.error(f"Error saving chat conversation: {e}")
        
        return jsonify({
            'reply': response,
            'detected_emotion': detected_emotion,
            'emotion_confidence': emotion_confidence,
            'timestamp': datetime.datetime.now().isoformat(),
            'saved': saved,
            'conversationId': conversation_id,
            'model_used': get_user_preferred_model(user_id, 'emotion')
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return jsonify({
            'reply': "I'm having some technical difficulties. Please try again.",
            'error': str(e)
        }), 500

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
            'service': 'MindCare-AI Chatbot',
            'timestamp': datetime.datetime.now().isoformat(),
            'features': {
                'ollama_connection': ollama_status,
                'database_connection': db_status,
                'emotion_detector': emotion_detector is not None and emotion_detector.is_model_loaded() if emotion_detector else False,
                'music_recommendations': music_collection is not None,
                'user_model_selection': True
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