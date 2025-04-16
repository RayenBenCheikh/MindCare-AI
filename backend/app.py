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
        
        return face_roi, (x, y, w, h)
    except Exception as e:
        logger.error(f"Face detection error: {str(e)}")
        return None

def calculate_heart_rate(face_roi_sequence, time_sequence, fps=30):
    """Calculate heart rate from a sequence of face ROIs"""
    try:
        if len(face_roi_sequence) < fps * 3:  # Need at least 3 seconds of data
            return 68  # Default value if not enough data
        
        # Extract green channel and calculate mean
        green_vals = []
        for frame in face_roi_sequence:
            if frame is not None and frame.size > 0:
                green_vals.append(np.mean(frame[:, :, 1]))
        
        if len(green_vals) < fps * 3:
            return 68
        
        # Apply bandpass filter (0.7-3.0 Hz for heart rate 42-180 BPM)
        nyq = 0.5 * fps
        low = 0.7 / nyq
        high = 3.0 / nyq
        b, a = butter(2, [low, high], btype='band')
        green_filtered = filtfilt(b, a, green_vals)
        
        # Find peaks
        from scipy.signal import find_peaks
        peaks, _ = find_peaks(green_filtered, distance=fps/2)
        
        if len(peaks) < 2:
            return 68  # Default fallback
        
        # Calculate average time between peaks
        peak_times = [time_sequence[p] for p in peaks]
        intervals = np.diff(peak_times)
        avg_interval = np.mean(intervals)
        
        # Convert to BPM
        heart_rate = 60.0 / avg_interval if avg_interval > 0 else 68
        
        # Reasonability check
        if heart_rate < 40 or heart_rate > 200:
            return 68
        
        return int(heart_rate)
    except Exception as e:
        logger.error(f"Error calculating heart rate: {str(e)}")
        return 68

def estimate_bp(heart_rate):
    """Estimate blood pressure based on heart rate"""
    try:
        sys_bp = int(90 + (heart_rate * 0.6))
        dia_bp = int(60 + (heart_rate * 0.25))
        
        return sys_bp, dia_bp
    except Exception as e:
        logger.error(f"Error estimating blood pressure: {str(e)}")
        return 134, 85

# Store recent frames for processing
frame_buffers = {}  # Dict to store buffers for each user
time_buffers = {}
MAX_BUFFER_SIZE = 150  # 5 seconds at 30fps

def save_vital_signs(user_id, heart_rate, systolic_bp, diastolic_bp):
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
        # Log request details for debugging
        logger.info(f"Request Content-Type: {request.content_type}")
        logger.info(f"Request is JSON: {request.is_json}")
        
        if not request.is_json:
            logger.error(f"Request must be JSON. Content-Type: {request.content_type}")
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        logger.info(f"Received request with keys: {list(data.keys())}")
        
        # Get user ID from request body
        user_id = data.get('userId', 'anonymous_user')
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        base64_image = data['image']
        # Log first 50 chars to verify format (for debugging)
        logger.info(f"Image data starts with: {base64_image[:50]}...")
        
        image = preprocess_image(base64_image)
        
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Process face
        face_data = extract_face_roi(image)
        if face_data is None:
            return jsonify({
                'error': 'No face detected', 
                'heart_rate': 68, 
                'systolic_bp': 134, 
                'diastolic_bp': 85
            })
        
        face_roi, face_coords = face_data
        
        # Initialize buffers for this user if they don't exist
        if user_id not in frame_buffers:
            frame_buffers[user_id] = []
            time_buffers[user_id] = []
        
        # Add to user's buffer
        current_time = time.time()
        frame_buffers[user_id].append(face_roi)
        time_buffers[user_id].append(current_time)
        
        # Maintain buffer size
        if len(frame_buffers[user_id]) > MAX_BUFFER_SIZE:
            frame_buffers[user_id].pop(0)
            time_buffers[user_id].pop(0)
        
        # Calculate vital signs if we have enough frames
        if len(frame_buffers[user_id]) >= 90:  # At least 3 seconds of data
            heart_rate = calculate_heart_rate(frame_buffers[user_id], time_buffers[user_id])
            sys_bp, dia_bp = estimate_bp(heart_rate)
        else:
            # Not enough data yet, return placeholders
            heart_rate = 68
            sys_bp, dia_bp = 134, 85
        
        # Save data to MongoDB if save flag is set
        should_save = data.get('saveData', False)
        if should_save and vital_signs_collection is not None:
            save_result = save_vital_signs(user_id, heart_rate, sys_bp, dia_bp)
        else:
            save_result = False
        
        response = {
            'heart_rate': heart_rate,
            'systolic_bp': sys_bp,
            'diastolic_bp': dia_bp,
            'face_coordinates': {
                'x': int(face_coords[0]),
                'y': int(face_coords[1]),
                'width': int(face_coords[2]),
                'height': int(face_coords[3])
            },
            'dataSaved': save_result,
            'bufferSize': len(frame_buffers[user_id])
        }
        
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in analyze_vital_signs: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'heart_rate': 68,
            'systolic_bp': 134,
            'diastolic_bp': 85
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