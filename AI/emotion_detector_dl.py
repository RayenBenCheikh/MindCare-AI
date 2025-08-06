import numpy as np
import pickle
import re
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeepLearningEmotionDetector:
    def __init__(self):
        print("🧠 DeepLearningEmotionDetector initialized")
        self.model = None
        self.tokenizer = None
        self.label_encoder = None
        self.max_len = 50
        self.emotions = ['anger', 'fear', 'joy', 'sadness', 'neutral']
        
        # Get the correct model path
        self.model_dir = os.path.join(os.path.dirname(__file__), 'models')
        print(f"📂 Model directory: {self.model_dir}")
        
    def load_model(self, model_path=None, tokenizer_path=None, encoder_path=None, config_path=None):
        """Load the trained model and preprocessing objects"""
        try:
            # Set default paths if not provided
            if model_path is None:
                model_path = os.path.join(self.model_dir, 'emotion_model.h5')
            if tokenizer_path is None:
                tokenizer_path = os.path.join(self.model_dir, 'tokenizer.pkl')
            if encoder_path is None:
                encoder_path = os.path.join(self.model_dir, 'label_encoder.pkl')
            if config_path is None:
                config_path = os.path.join(self.model_dir, 'model_config.pkl')
            
            print(f"📂 Loading emotion model from {model_path}")
            
            # Check if TensorFlow is available
            try:
                import tensorflow as tf
                from tensorflow.keras.models import load_model
                from tensorflow.keras.preprocessing.sequence import pad_sequences
            except ImportError:
                logger.warning("TensorFlow not available. Emotion detection will use fallback.")
                return False
            
            # Check if all required files exist
            missing_files = []
            for file_path in [model_path, tokenizer_path, encoder_path]:
                if not os.path.exists(file_path):
                    missing_files.append(file_path)
            
            if missing_files:
                logger.warning(f"Missing emotion model files: {missing_files}")
                logger.warning("Run the createDataset.ipynb notebook to train the model first.")
                return False
            
            # Load the trained model
            self.model = load_model(model_path)
            print("✅ Emotion model loaded successfully")
            
            # Load tokenizer
            with open(tokenizer_path, 'rb') as f:
                self.tokenizer = pickle.load(f)
            print("✅ Tokenizer loaded successfully")
            
            # Load label encoder
            with open(encoder_path, 'rb') as f:
                self.label_encoder = pickle.load(f)
            print("✅ Label encoder loaded successfully")
            
            # Load model config if available
            if os.path.exists(config_path):
                with open(config_path, 'rb') as f:
                    config = pickle.load(f)
                    self.max_len = config.get('max_len', 50)
                print(f"📊 Model config loaded - Max length: {self.max_len}")
            
            # Print available emotions
            if hasattr(self.label_encoder, 'classes_'):
                print(f"📊 Available emotions: {list(self.label_encoder.classes_)}")
            
            return True
            
        except Exception as e:
            logger.warning(f"Error loading emotion detection model: {e}")
            return False
      
    def preprocess_text(self, text):
        """Clean and preprocess text data"""
        if not isinstance(text, str):
            return ""
        
        text = text.lower()
        text = re.sub(r'[^a-zA-Z\s!?.]', '', text)
        text = ' '.join(text.split())
        
        return text
    
    def predict_emotion(self, text):
        """Predict emotion from text using deep learning model or fallback"""
        if not self.model or not self.tokenizer or not self.label_encoder:
            return self._fallback_predict_emotion(text)
        
        try:
            from tensorflow.keras.preprocessing.sequence import pad_sequences
            
            clean_text = self.preprocess_text(text)
            if not clean_text:
                return 'neutral', 0.5
            
            sequences = self.tokenizer.texts_to_sequences([clean_text])
            padded_sequence = pad_sequences(sequences, maxlen=self.max_len)
            
            predictions = self.model.predict(padded_sequence, verbose=0)
            predicted_class_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class_idx])
            
            predicted_emotion = self.label_encoder.inverse_transform([predicted_class_idx])[0]
            
            return predicted_emotion, confidence
            
        except Exception as e:
            logger.error(f"Error predicting emotion: {e}")
            return self._fallback_predict_emotion(text)
    
    def _fallback_predict_emotion(self, text):
        """Fallback emotion prediction using keywords"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['happy', 'excited', 'joy', 'great', 'amazing', 'wonderful']):
            return 'joy', 0.7
        elif any(word in text_lower for word in ['angry', 'mad', 'furious', 'hate', 'annoyed']):
            return 'anger', 0.7
        elif any(word in text_lower for word in ['sad', 'depressed', 'upset', 'crying', 'hopeless']):
            return 'sadness', 0.7
        elif any(word in text_lower for word in ['scared', 'afraid', 'worried', 'anxious', 'fear']):
            return 'fear', 0.7
        else:
            return 'neutral', 0.6
    
    def get_emotion_probabilities(self, text):
        """Get probabilities for all emotions"""
        if not self.model or not self.tokenizer or not self.label_encoder:
            emotion, confidence = self._fallback_predict_emotion(text)
            probs = {e: 0.1 for e in self.emotions}
            probs[emotion] = confidence
            return probs
        
        try:
            from tensorflow.keras.preprocessing.sequence import pad_sequences
            
            clean_text = self.preprocess_text(text)
            if not clean_text:
                return {}
            
            sequences = self.tokenizer.texts_to_sequences([clean_text])
            padded_sequence = pad_sequences(sequences, maxlen=self.max_len)
            predictions = self.model.predict(padded_sequence, verbose=0)
            
            emotion_probs = {}
            for i, emotion in enumerate(self.label_encoder.classes_):
                emotion_probs[emotion] = float(predictions[0][i])
            
            return emotion_probs
            
        except Exception as e:
            logger.error(f"Error getting emotion probabilities: {e}")
            emotion, confidence = self._fallback_predict_emotion(text)
            probs = {e: 0.1 for e in self.emotions}
            probs[emotion] = confidence
            return probs
    
    def is_model_loaded(self):
        """Check if all model components are loaded"""
        return all([
            self.model is not None,
            self.tokenizer is not None,
            self.label_encoder is not None
        ])
        
    def get_emotion_based_response_tone(self, emotion, confidence):
        """Get response tone based on detected emotion"""
        tone_mapping = {
            'joy': 'cheerful and encouraging',
            'sadness': 'gentle and supportive', 
            'anger': 'calm and understanding',
            'fear': 'reassuring and comforting',
            'neutral': 'balanced and helpful'
        }
        
        # Adjust tone based on confidence
        if confidence < 0.6:
            return 'gentle and understanding'
            
        return tone_mapping.get(emotion, 'balanced and helpful')
    
    def get_model_info(self):
        """Get information about the loaded model"""
        if not self.is_model_loaded():
            return {'status': 'not_loaded'}
            
        return {
            'status': 'loaded',
            'emotions': list(self.label_encoder.classes_) if self.label_encoder else self.emotions,
            'max_sequence_length': self.max_len,
            'model_type': 'deep_learning_cnn',
            'confidence_threshold': 0.6
        }

# Test function
def test_emotion_detector():
    """Test the emotion detector with sample texts"""
    detector = DeepLearningEmotionDetector()
    
    if detector.load_model():
        test_texts = [
            "I'm feeling really sad today",
            "I'm so happy and excited!",
            "This is making me angry",
            "I'm worried about the future",
            "I feel amazing and full of energy"
        ]
        
        print("Testing Deep Learning Emotion Detection:")
        for text in test_texts:
            emotion, confidence = detector.predict_emotion(text)
            probs = detector.get_emotion_probabilities(text)
            print(f"Text: '{text}'")
            print(f"Emotion: {emotion} (confidence: {confidence:.3f})")
            print(f"All probabilities: {probs}")
            print("-" * 50)
    else:
        print("Failed to load emotion detection model")

if __name__ == "__main__":
    test_emotion_detector()