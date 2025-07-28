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

def get_chat_response(message, history):
    """Simple chat response function"""
    api_url = "http://127.0.0.1:11434/api/generate"
    
    # Simple prompt
    prompt = "You are a caring mental health support assistant. "
    prompt += "Provide compassionate, helpful responses to users seeking emotional support. "
    prompt += "Be warm, understanding, and offer practical advice when appropriate. "
    prompt += "Keep responses under 200 words.\n\n"
    
    # Add conversation history
    for msg in history[-5:]:
        role = msg.get('role', '')
        content = msg.get('content', '')
        if role and content:
            prompt += f"{role.title()}: {content}\n"
    
    prompt += f"\nUser: {message}\nAssistant:"
    
    data = {
        "model": "llama3.1:8b",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 300
        }
    }
    
    try:
        response = requests.post(api_url, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        ai_response = result.get('response', '').strip()
        
        return ai_response
        
    except Exception as e:
        logger.error(f"Error getting chat response: {e}")
        return "I'm sorry, I'm having trouble processing your message right now. Please try again."

def analyze_assessment(responses):
    """Simple assessment analysis"""
    try:
        # Use simple fallback method
        stress_level = get_fallback_stress_level(responses)
        
        # Get music recommendations
        music_recommendations = get_music_recommendations_for_stress(stress_level, limit=3)
        
        # Simple advice based on stress level
        if stress_level <= 2:
            advice = "Your stress level appears relatively low. Continue your healthy habits and self-care routines."
        elif stress_level == 3:
            advice = "You're experiencing moderate stress. Try incorporating regular breaks and relaxation techniques."
        else:
            advice = "Your stress level is high. Consider talking to a mental health professional and practice stress-reduction techniques."
        
        mood = "depression" if stress_level >= 3 else "positive"
        
        return {
            'mood': mood,
            'severity': stress_level,
            'message': f"Based on your responses, your stress level is {stress_level}/5.",
            'solutions': advice,
            'musicRecommendations': music_recommendations
        }
        
    except Exception as e:
        logger.error(f"Error analyzing assessment: {e}")
        return {
            'mood': 'neutral',
            'severity': 3,
            'message': 'Assessment completed.',
            'solutions': 'Take care of yourself and consider seeking support if needed.',
            'musicRecommendations': []
        }

@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    history = data.get('history', [])
    
    response = get_chat_response(message, history)
    
    return jsonify({
        'reply': response,
        'detected_emotion': 'neutral',
        'emotion_confidence': 0.5
    })

@chatbot_bp.route('/assessment', methods=['POST'])
def assessment():
    data = request.json
    responses = data.get('responses', [])
    
    if not responses or len(responses) != 10:
        return jsonify({
            'error': 'Invalid assessment data. Expected 10 responses.'
        }), 400
    
    result = analyze_assessment(responses)
    
    return jsonify(result)

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
    
    required_fields = ['userId', 'stressLevel', 'responses']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
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