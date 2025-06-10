from flask import Flask, request, jsonify
import numpy as np
import time
import cv2
import os
import logging
import json
import requests
import sys
from flask_cors import CORS
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from AI.Chatbot import chatbot_bp
# Import our analysis functions
from AI.vital_signs_analyzer import (
    preprocess_image, 
    extract_face_roi, 
    analyze_skin_color_variations, 
    estimate_bp,
    create_diagnostic_image
)

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
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
# Set the custom encoder for Flask's jsonify
app.json_encoder = NumpyEncoder
# Enable CORS for all routes with proper configuration
CORS(app, resources={r"/*": {"origins": "*"}})
# Register the chatbot blueprint
app.register_blueprint(chatbot_bp, url_prefix='/api')
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
    assessments_collection = db.assessments
    logger.info("MongoDB connection established")
except Exception as e:
    logger.error(f"MongoDB connection error: {str(e)}")
    vital_signs_collection = None
    assessments_collection = None

# Keep your get_user_assessment function here
def get_user_assessment(assessment_id):
    """Retrieve an assessment by its ID"""
    if assessments_collection is None:
        return None
        
    try:
        # Log the assessment ID we're searching for
        logger.info(f"Looking up assessment with ID: {assessment_id}")
        
        # Convert string ID to ObjectId if needed
        from bson.objectid import ObjectId
        
        # First try direct string ID match
        assessment = assessments_collection.find_one({"_id": assessment_id})
        
        # If that doesn't work, try with ObjectId
        if not assessment and len(assessment_id) == 24:
            try:
                obj_id = ObjectId(assessment_id)
                assessment = assessments_collection.find_one({"_id": obj_id})
                if assessment:
                    logger.info(f"Found assessment using ObjectId")
            except Exception as e:
                logger.error(f"Error converting to ObjectId: {str(e)}")
        
        if assessment:
            logger.info(f"Found assessment document: {assessment}")
            
            # Extract values directly from the document structure
            result = {}
            
            # Get age
            if "age" in assessment and assessment["age"] is not None:
                result["age"] = assessment["age"]
                logger.info(f"Extracted age: {result['age']}")
            
            # Get gender
            if "gender" in assessment and assessment["gender"] is not None:
                result["gender"] = assessment["gender"]
                logger.info(f"Extracted gender: {result['gender']}")
            
            # Get weight - handle nested structure
            if "weight" in assessment and isinstance(assessment["weight"], dict) and "value" in assessment["weight"]:
                result["weight"] = assessment["weight"]["value"]
                logger.info(f"Extracted weight: {result['weight']}")
            
            # Get height - handle nested structure
            if "height" in assessment and isinstance(assessment["height"], dict) and "value" in assessment["height"]:
                result["height"] = assessment["height"]["value"]
                logger.info(f"Extracted height: {result['height']}")
            
            logger.info(f"Returning assessment data: {result}")
            return result
        else:
            logger.warning(f"No assessment found with ID: {assessment_id}")
            return None
    except Exception as e:
        logger.error(f"Error retrieving assessment: {str(e)}")
        return None
def save_vital_signs_to_assessment(assessment_id, heart_rate, systolic_bp, diastolic_bp, image_base64=None, confidence=None):
    """Save vital signs data to the assessment document"""
    if assessments_collection is None:
        return False
        
    try:
        # Convert string ID to ObjectId if needed
        from bson.objectid import ObjectId
        
        # Create object ID if it's a valid string ID
        obj_id = None
        if len(assessment_id) == 24:
            try:
                obj_id = ObjectId(assessment_id)
            except Exception as e:
                logger.error(f"Error converting to ObjectId: {str(e)}")
                return False
        
        # Prepare vitals data
        vitals_data = {
            "timestamp": time.time(),
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "heartRate": heart_rate,
            "systolicBP": systolic_bp,
            "diastolicBP": diastolic_bp
        }
        
        if confidence is not None:
            vitals_data["confidence"] = confidence
            
        # Prepare update document
        update_doc = {
            "$set": {
                "vitalSigns": vitals_data
            }
        }
        
        # Add image if provided (be careful with large images)
        if image_base64:
            # Check if image is too large - MongoDB has 16MB document size limit
            if len(image_base64) < 1024 * 1024 * 10:  # 10MB limit
                update_doc["$set"]["vitalSignsImage"] = image_base64
            else:
                logger.warning("Image too large to store in MongoDB document")
        
        # Update the assessment document
        result = assessments_collection.update_one(
            {"_id": obj_id},
            update_doc
        )
        
        if result.modified_count > 0:
            logger.info(f"Successfully updated assessment {assessment_id} with vital signs data")
            return True
        else:
            logger.warning(f"Assessment {assessment_id} was not updated - document not found or no changes made")
            return False
            
    except Exception as e:
        logger.error(f"Error saving vital signs to assessment: {str(e)}")
        return False

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze_vital_signs():
    # Handle preflight CORS requests
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        logger.info(f"Received request with keys: {list(data.keys())}")
        
        # Get the assessment ID
        assessment_id = data.get('userId', None)
        
        # Get demographic info from assessment if available
        assessment_data = get_user_assessment(assessment_id) if assessment_id else None
            
        # Use assessment data if available, otherwise use provided data or defaults
        age = assessment_data.get('age') if assessment_data else data.get('age', 30)
        weight_kg = assessment_data.get('weight') if assessment_data else data.get('weight_kg', 70)
        height_cm = assessment_data.get('height') if assessment_data else data.get('height_cm', 170)
        is_male = assessment_data.get('gender') == 'male' if assessment_data else data.get('is_male', True)
        
        # Log the demographic data being used
        logger.info(f"Using demographic data - Age: {age}, Weight: {weight_kg}kg, Height: {height_cm}cm, Gender: {'male' if is_male else 'female'}")
 
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        base64_image = data['image']
        logger.info(f"Image data starts with: {base64_image[:50]}...")
        
        # Process the image
        image = preprocess_image(base64_image)
        
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Extract face regions - pass in the face_cascade
        face_info = extract_face_roi(image, face_cascade)
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
        heart_rate_range = analysis_result.get('heart_rate_range', [heart_rate-5, heart_rate+5])
        
        # Generate diagnostic image
        diagnostic_image = create_diagnostic_image(image, face_info)
        
        # Estimate blood pressure
        sys_bp, dia_bp = estimate_bp(heart_rate, age, weight_kg, height_cm, is_male)
        
        # Calculate error margins for BP based on confidence
        error_factor = (100 - confidence) / 100 * 0.3
        sys_error = max(5, int(sys_bp * error_factor))
        dia_error = max(3, int(dia_bp * error_factor))
        
        # Save data if requested
        should_save = data.get('saveData', False)
        if should_save and assessments_collection is not None:
            # Truncate image data to avoid overly large documents
            image_to_save = None
            if data.get('saveImage', False):
                # First check if base64 string includes the prefix
                img_data = base64_image
                if ',' in base64_image:
                    img_data = base64_image.split(',')[1]
                    
                # Store only the first part of the image to keep doc size reasonable
                # Will still be viewable but lower quality
                image_to_save = img_data[:512000]  # Store ~500KB of image data
                
            save_result = save_vital_signs_to_assessment(
                assessment_id, 
                heart_rate, 
                sys_bp, 
                dia_bp, 
                image_to_save,  
                confidence
            )
        else:
            save_result = False
        
        # Get face coordinates
        face_coords = face_info['coordinates']
        
        response = {
            'heart_rate': heart_rate,
            'heart_rate_range': heart_rate_range,
            'systolic_bp': sys_bp,
            'systolic_bp_range': [sys_bp - sys_error, sys_bp + sys_error],
            'diastolic_bp': dia_bp,
            'diastolic_bp_range': [dia_bp - dia_error, dia_bp + dia_error],
            'confidence': confidence,
            'face_coordinates': {
                'x': int(face_coords[0]),
                'y': int(face_coords[1]),
                'width': int(face_coords[2]),
                'height': int(face_coords[3])
            },
            'diagnostic_image': diagnostic_image,
            'metrics': analysis_result.get('metrics', {}),
            'dataSaved': save_result,
            'status': 'success' if heart_rate else 'failed',
            'message': f"Analysis complete. HR: {heart_rate} bpm (±{analysis_result['metrics'].get('error_margin', 5)}), BP: {sys_bp}/{dia_bp} mmHg (±{sys_error}/±{dia_error}), Confidence: {confidence}%"
        }
        
        logger.info(f"Analysis results: HR={heart_rate} (±{analysis_result['metrics'].get('error_margin', 5)}), BP={sys_bp}/{dia_bp} (±{sys_error}/±{dia_error}), Confidence={confidence}%")
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

# Add a health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'mongo_connected': assessments_collection is not None
    })

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
@app.route('/api/debug/parameters', methods=['GET'])
def debug_parameters():
    """Endpoint to see the current parameters used in analysis"""
    return jsonify({
        "hr_calculation": {
            "rg_ratio_multiplier": 15,
            "std_factor_multiplier": 2,
            "base_hr_offset": 60,
            "max_normal_hr": 100,
            "brightness_adjustment_max": 5,
            "hr_min_constraint": 55,
            "hr_max_constraint": 105
        },
        "confidence_calculation": {
            "hr_normality_weight": 0.5,
            "std_quality_weight": 0.3,
            "image_quality_weight": 0.2,
            "hr_normality_factor": "100 - min(100, abs(hr - 75) * 2)",
            "std_quality_factor": "min(100, (forehead_std + cheeks_std) * 50)",
            "image_quality_factor": "min(100, avg_skin_brightness / 2)"
        },
        "bp_calculation": {
            "sys_base_formula": "95 + (heart_rate * 0.25)",
            "dia_base_formula": "65 + (heart_rate * 0.1)",
            "age_factor": "max(0, (age - 20) * 0.6)",
            "gender_adjustment": "-4 (sys) and -3 (dia) for females"
        }
    })
@app.route('/api/assessments/<assessment_id>/vitals', methods=['GET'])
def get_assessment_vitals(assessment_id):
    """Get vital signs data for a specific assessment"""
    try:
        if assessments_collection is None:
            return jsonify({"error": "Database connection not available"}), 500
            
        # Convert to ObjectId
        from bson.objectid import ObjectId
        obj_id = ObjectId(assessment_id)
        
        # Find the assessment
        assessment = assessments_collection.find_one(
            {"_id": obj_id},
            {"vitalSigns": 1, "vitalSignsImage": 1}
        )
        
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404
            
        if "vitalSigns" not in assessment:
            return jsonify({"error": "No vital signs data found for this assessment"}), 404
            
        response = {
            "vitalSigns": assessment["vitalSigns"]
        }
        
        # Include image if available and requested
        if "vitalSignsImage" in assessment and request.args.get('includeImage', 'false').lower() == 'true':
            response["image"] = assessment["vitalSignsImage"]
            
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error retrieving vital signs: {str(e)}")
        return jsonify({"error": "Server error"}), 500

if __name__ == '__main__':
    # Check if OpenCV face detector is available
    if not os.path.exists(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'):
        logger.error("OpenCV face detector not found!")
    # Start the Flask server
    app.run(host='0.0.0.0', port=5001, debug=False)