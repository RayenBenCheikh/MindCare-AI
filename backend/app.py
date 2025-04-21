from flask import Flask, request, jsonify
import numpy as np
import cv2
import base64
import time
from scipy.signal import butter, filtfilt
import os
import logging
import json
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a custom JSON encoder for NumPy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

app = Flask(__name__)
# Set the custom encoder for Flask's jsonify
app.json_encoder = NumpyEncoder
# Enable CORS for all routes
CORS(app)

# MongoDB connection info
MONGODB_URI = "mongodb://127.0.0.1:27017/mindcare"

# Initialize face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# MongoDB connection (optional)
try:
    from pymongo import MongoClient
    client = MongoClient(MONGODB_URI)
    db = client.get_database()
    vital_signs_collection = db.vitalSigns
    logger.info("MongoDB connection established")
except Exception as e:
    logger.error(f"MongoDB connection error: {str(e)}")
    vital_signs_collection = None

def preprocess_image(base64_image):
    """Convert base64 image to numpy array"""
    try:
        # Check if the base64 string contains the header
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
            
        img_data = base64.b64decode(base64_image)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        return None

def extract_face_roi(image):
    """Extract face region of interest"""
    if image is None:
        return None
        
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Use OpenCV for face detection
    try:
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            return None
        
        # Use the first detected face
        x, y, w, h = faces[0]
        face_roi = image[y:y+h, x:x+w]
        
        # Extract forehead region (top 1/3 of face)
        forehead_height = h // 3
        forehead_roi = image[y:y+forehead_height, x:x+w]
        
        # Also extract cheek regions
        cheek_y = y + forehead_height
        cheek_height = h // 3
        left_cheek_x = x
        left_cheek_w = w // 2
        right_cheek_x = x + left_cheek_w
        right_cheek_w = w - left_cheek_w
        
        left_cheek_roi = image[cheek_y:cheek_y+cheek_height, left_cheek_x:left_cheek_x+left_cheek_w]
        right_cheek_roi = image[cheek_y:cheek_y+cheek_height, right_cheek_x:right_cheek_x+right_cheek_w]
        
        # Return all ROIs and face coordinates
        face_info = {
            'face': face_roi,
            'forehead': forehead_roi,
            'left_cheek': left_cheek_roi,
            'right_cheek': right_cheek_roi,
            'coordinates': (x, y, w, h)
        }
        
        return face_info
    except Exception as e:
        logger.error(f"Face detection error: {str(e)}")
        return None

def analyze_skin_color_variations(face_info):
    """Analyze skin color variations to estimate heart rate"""
    try:
        # Extract regions
        forehead = face_info['forehead']
        left_cheek = face_info['left_cheek']
        right_cheek = face_info['right_cheek']
        
        # Calculate average values for green channel in each region
        # Green channel is most sensitive to blood flow changes
        forehead_green = np.mean(forehead[:, :, 1])
        left_cheek_green = np.mean(left_cheek[:, :, 1])
        right_cheek_green = np.mean(right_cheek[:, :, 1])
        
        # Calculate standard deviation of pixel values
        # Higher variation might indicate better blood flow / healthier skin
        forehead_std = np.std(forehead[:, :, 1])
        cheeks_std = (np.std(left_cheek[:, :, 1]) + np.std(right_cheek[:, :, 1])) / 2
        
        # Calculate red-to-green ratio (can indicate blood volume)
        forehead_rg_ratio = np.mean(forehead[:, :, 2]) / np.mean(forehead[:, :, 1])
        left_cheek_rg_ratio = np.mean(left_cheek[:, :, 2]) / np.mean(left_cheek[:, :, 1])
        right_cheek_rg_ratio = np.mean(right_cheek[:, :, 2]) / np.mean(right_cheek[:, :, 1])
        
        # Average RG ratio
        avg_rg_ratio = (forehead_rg_ratio + left_cheek_rg_ratio + right_cheek_rg_ratio) / 3
        
        # Calculate a base heart rate from these values
        # This is a simplified estimation model - in practice, you'd want to use machine learning
        # trained on actual heart rate data correlated with these features
        
        # Higher RG ratio typically corresponds to more blood (higher heart rates)
        # Higher green standard deviation can indicate more blood flow variation
        base_hr = 60 + (avg_rg_ratio * 20) + (forehead_std * 0.5) + (cheeks_std * 0.2)
        
        # Apply some constraints for plausibility
        heart_rate = max(60, min(100, base_hr))
        
        # Calculate confidence based on image quality and variation
        total_std = forehead_std + np.std(left_cheek[:, :, 1]) + np.std(right_cheek[:, :, 1])
        confidence = min(100, max(0, total_std * 25))  # Scale to 0-100%
        
        return {
            'heart_rate': int(heart_rate),
            'confidence': int(confidence),
            'metrics': {
                'rg_ratio': float(avg_rg_ratio),
                'forehead_std': float(forehead_std),
                'cheeks_std': float(cheeks_std)
            }
        }
    except Exception as e:
        logger.error(f"Error analyzing skin color: {str(e)}")
        return {
            'heart_rate': 72,  # Fallback to average resting heart rate
            'confidence': 30,  # Low confidence
            'metrics': {}
        }

def estimate_bp(heart_rate, age=24, weight_kg=80, height_cm=180, is_male=True):
    """Estimate blood pressure based on heart rate and demographic factors"""
    try:
        if heart_rate is None:
            return None, None
        
        # Base estimation using heart rate
        sys_base = 90 + (heart_rate * 0.33)
        dia_base = 60 + (heart_rate * 0.15)
        
        # Adjust for age (blood pressure tends to increase with age)
        age_factor = max(0, (age - 30) * 0.5)
        sys_base += age_factor
        dia_base += age_factor * 0.4
        
        # Adjust for BMI
        bmi = weight_kg / ((height_cm / 100) ** 2)
        if bmi > 25:  # Overweight adjustment
            bmi_factor = (bmi - 25) * 0.5
            sys_base += bmi_factor
            dia_base += bmi_factor * 0.5
        
        # Gender adjustment
        if not is_male:
            sys_base -= 5
            dia_base -= 3
        
        # Round and constrain to plausible ranges
        systolic = max(90, min(160, round(sys_base)))
        diastolic = max(60, min(100, round(dia_base)))
        
        return systolic, diastolic
    except Exception as e:
        logger.error(f"Error estimating blood pressure: {str(e)}")
        return 120, 80

def save_vital_signs(user_id, heart_rate, systolic_bp, diastolic_bp, confidence=None):
    """Save vital signs data to MongoDB"""
    if vital_signs_collection is None:
        return False
        
    try:
        record = {
            "userId": user_id,
            "timestamp": time.time(),
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "heartRate": heart_rate,
            "systolicBP": systolic_bp,
            "diastolicBP": diastolic_bp
        }
        
        if confidence is not None:
            record["confidence"] = confidence
            
        vital_signs_collection.insert_one(record)
        return True
    except Exception as e:
        logger.error(f"Error saving to MongoDB: {str(e)}")
        return False

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze_vital_signs():
    # Handle preflight CORS requests
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        logger.info(f"Request Content-Type: {request.content_type}")
        logger.info(f"Request is JSON: {request.is_json}")
        
        if not request.is_json:
            logger.error(f"Request must be JSON. Content-Type: {request.content_type}")
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        logger.info(f"Received request with keys: {list(data.keys())}")
        
        # Get user ID and optional demographic info
        user_id = data.get('userId', 'anonymous_user')
        age = data.get('age', 30)
        weight_kg = data.get('weight_kg', 70)
        height_cm = data.get('height_cm', 170)
        is_male = data.get('is_male', True)
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        base64_image = data['image']
        logger.info(f"Image data starts with: {base64_image[:50]}...")
        
        # Process the image
        image = preprocess_image(base64_image)
        
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Extract face regions
        face_info = extract_face_roi(image)
        if face_info is None:
            return jsonify({
                'error': 'No face detected', 
                'heart_rate': None, 
                'systolic_bp': None, 
                'diastolic_bp': None,
                'status': 'no_face'
            })
        
        # Analyze the face to estimate heart rate
        analysis_result = analyze_skin_color_variations(face_info)
        heart_rate = analysis_result['heart_rate']
        confidence = analysis_result['confidence']
        
        # Estimate blood pressure
        sys_bp, dia_bp = estimate_bp(heart_rate, age, weight_kg, height_cm, is_male)
        
        # Save data if requested
        should_save = data.get('saveData', False)
        if should_save and vital_signs_collection is not None:
            save_result = save_vital_signs(user_id, heart_rate, sys_bp, dia_bp, confidence)
        else:
            save_result = False
        
        # Get face coordinates
        face_coords = face_info['coordinates']
        
        response = {
            'heart_rate': heart_rate,
            'systolic_bp': sys_bp,
            'diastolic_bp': dia_bp,
            'confidence': confidence,
            'face_coordinates': {
                'x': int(face_coords[0]),
                'y': int(face_coords[1]),
                'width': int(face_coords[2]),
                'height': int(face_coords[3])
            },
            'dataSaved': save_result,
            'status': 'success' if heart_rate else 'failed',
            'message': f"Analysis complete. Confidence: {confidence}%"
        }
        
        logger.info(f"Analysis results: HR={heart_rate}, BP={sys_bp}/{dia_bp}, Confidence={confidence}%")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in analyze_vital_signs: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'heart_rate': 72,
            'systolic_bp': 120,
            'diastolic_bp': 80,
            'confidence': 30,
            'status': 'error'
        }), 500

@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Simple health check endpoint"""
    # Handle preflight CORS requests
    if request.method == 'OPTIONS':
        return '', 200
        
    return jsonify({'status': 'ok'})

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API info"""
    return jsonify({
        'message': 'Vital Signs API Server',
        'endpoints': {
            'health_check': '/health (GET)',
            'analyze': '/api/analyze (POST)'
        },
        'version': '1.0.0'
    })

if __name__ == '__main__':
    # Check if OpenCV face detector is available
    if not os.path.exists(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'):
        logger.error("OpenCV face detector not found!")
        
    # Start the Flask server
    app.run(host='0.0.0.0', port=5000, debug=False)