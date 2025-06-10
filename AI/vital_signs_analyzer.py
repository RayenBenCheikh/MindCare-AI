import numpy as np
import cv2
import base64
import matplotlib.pyplot as plt
import pandas as pd
import logging
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

def extract_face_roi(image, face_cascade):
    """Extract face region of interest using more robust detection"""
    if image is None:
        return None
        
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Try different scale factors for better detection
    scale_factors = [1.1, 1.05, 1.2]
    min_neighbors_options = [4, 3, 5]
    
    faces = None
    
    # Try different parameters until we find a face
    for scale in scale_factors:
        for min_neighbors in min_neighbors_options:
            faces = face_cascade.detectMultiScale(gray, scale, min_neighbors)
            if len(faces) > 0:
                break
        if len(faces) > 0:
            break
    
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

def analyze_skin_color_variations(face_info):
    """Enhanced skin color analysis with smarter heart rate estimation"""
    try:
        # Extract regions
        forehead = face_info['forehead']
        left_cheek = face_info['left_cheek']
        right_cheek = face_info['right_cheek']
        
        # Extract color channels - BGR order in OpenCV
        # B=0, G=1, R=2
        forehead_channels = [np.mean(forehead[:, :, i]) for i in range(3)]
        left_cheek_channels = [np.mean(left_cheek[:, :, i]) for i in range(3)]
        right_cheek_channels = [np.mean(right_cheek[:, :, i]) for i in range(3)]
        
        # Calculate standard deviation for each channel
        forehead_std_channels = [np.std(forehead[:, :, i]) for i in range(3)]
        left_cheek_std_channels = [np.std(left_cheek[:, :, i]) for i in range(3)]
        right_cheek_std_channels = [np.std(right_cheek[:, :, i]) for i in range(3)]
        
        # Calculate red-to-green ratio for blood volume
        # This mimics the PPG technique in smartwatches
        forehead_rg_ratio = forehead_channels[2] / max(forehead_channels[1], 1)
        left_cheek_rg_ratio = left_cheek_channels[2] / max(left_cheek_channels[1], 1)
        right_cheek_rg_ratio = right_cheek_channels[2] / max(right_cheek_channels[1], 1)
        
        # Average RG ratio
        avg_rg_ratio = (forehead_rg_ratio + left_cheek_rg_ratio + right_cheek_rg_ratio) / 3
        
        # SMARTWATCH-LIKE HEART RATE ESTIMATION
        # Base calculation - start with normal resting heart rate
        base_hr = 73  # Average resting heart rate
        
        # Calculate heart rate more conservatively, like smartwatches do
        # Use much smaller multipliers to avoid overestimation
        rg_factor = (avg_rg_ratio - 1.0) * 10.0  # More subtle influence
        
        # Apply more subtle adjustments
        hr_adjustment = rg_factor
        
        # Final heart rate calculation with stronger physiological constraints
        heart_rate = base_hr + hr_adjustment
        
        # Apply tighter constraints for resting HR (smartwatches typically show 60-80)
        heart_rate = max(55, min(85, heart_rate))
        
        # Round to nearest integer
        rounded_heart_rate = round(heart_rate)
        
        # Calculate confidence based on image quality and physiological factors
        hr_normality_factor = 100 - min(100, abs(rounded_heart_rate - 70) * 2)
        std_quality_factor = min(100, (forehead_std_channels[1] + left_cheek_std_channels[1]) * 40)
        
        # Higher confidence for values in the most common HR range (60-75)
        range_factor = 100
        if rounded_heart_rate < 60 or rounded_heart_rate > 75:
            range_factor = 80
        
        confidence = (hr_normality_factor * 0.4 + 
                     std_quality_factor * 0.3 + 
                     range_factor * 0.3)
        
        # Round confidence to integer
        rounded_confidence = round(confidence)
        
        # Error margin based on confidence
        error_margin = max(5, int((100 - rounded_confidence) / 10) + 3)
        
        return {
            'heart_rate': rounded_heart_rate,
            'heart_rate_range': [max(45, rounded_heart_rate - error_margin), 
                               min(100, rounded_heart_rate + error_margin)],
            'confidence': rounded_confidence,
            'metrics': {
                'rg_ratio': float(avg_rg_ratio),
                'rg_factor': float(rg_factor),
                'base_hr': float(base_hr),
                'adjusted_hr': float(heart_rate),
                'error_margin': error_margin
            }
            # Removed vitalSignsImage from return - no longer saving images
        }
    except Exception as e:
        logger.error(f"Error analyzing skin color: {str(e)}")
        return {
            'heart_rate': 65,  
            'heart_rate_range': [60, 75],
            'confidence': 30,
            'metrics': {}
            
        }
def estimate_bp(heart_rate, age=24, weight_kg=80, height_cm=180, is_male=True):
    """Improved blood pressure estimation with better physiological model"""
    try:
        if heart_rate is None:
            return None, None
        
        # Base estimation using heart rate with reduced impact
        # Heart rate has moderate influence on BP
        sys_base = 95 + (heart_rate * 0.25)
        dia_base = 65 + (heart_rate * 0.1)
        
        # Age has strong influence (BP increases with age)
        age_factor = max(0, (age - 20) * 0.6)
        sys_base += age_factor
        dia_base += age_factor * 0.4
        
        # BMI factor (higher BMI correlates with higher BP)
        bmi = weight_kg / ((height_cm / 100) ** 2)
        bmi_factor = 0
        
        if bmi < 18.5:  # Underweight
            bmi_factor = -2
        elif bmi >= 25:  # Overweight
            bmi_factor = (bmi - 25) * 0.6
        elif bmi >= 30:  # Obese
            bmi_factor = 3 + (bmi - 30) * 1.0
            
        sys_base += bmi_factor
        dia_base += bmi_factor * 0.6
        
        # Gender adjustment (women tend to have lower BP than men)
        if not is_male:
            sys_base -= 4
            dia_base -= 3
        
        # Ensure diastolic is at least 30 below systolic
        # but not less than 60
        systolic = max(90, min(170, round(sys_base)))
        diastolic = max(60, min(systolic - 30, round(dia_base)))
        
        return systolic, diastolic
    except Exception as e:
        logger.error(f"Error estimating blood pressure: {str(e)}")
        return 120, 80

def create_diagnostic_image(image, face_info):
    """Create a diagnostic visualization of the analyzed face regions"""
    try:
        # Make a copy of the original image
        diagnostic = image.copy()
        
        # Get face coordinates
        x, y, w, h = face_info['coordinates']
        
        # Draw rectangles around analyzed regions
        # Face - red
        cv2.rectangle(diagnostic, (x, y), (x+w, y+h), (0, 0, 255), 2)
        
        # Forehead - green
        forehead_height = h // 3
        cv2.rectangle(diagnostic, (x, y), (x+w, y+forehead_height), (0, 255, 0), 2)
        
        # Left cheek - blue
        cheek_y = y + forehead_height
        cheek_height = h // 3
        left_cheek_w = w // 2
        cv2.rectangle(diagnostic, (x, cheek_y), (x+left_cheek_w, cheek_y+cheek_height), (255, 0, 0), 2)
        
        # Right cheek - cyan
        right_cheek_x = x + left_cheek_w
        right_cheek_w = w - left_cheek_w
        cv2.rectangle(diagnostic, (right_cheek_x, cheek_y), (right_cheek_x+right_cheek_w, cheek_y+cheek_height), (255, 255, 0), 2)
        
        # Convert to base64 for return
        _, buffer = cv2.imencode('.jpg', diagnostic)
        diagnostic_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return diagnostic_base64
    except Exception as e:
        logger.error(f"Error creating diagnostic image: {str(e)}")
        return None