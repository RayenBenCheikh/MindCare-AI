import numpy as np
import pickle
import re
import os
import logging

logger = logging.getLogger(__name__)

class DeepLearningEmotionDetector:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.label_encoder = None
        self.max_len = 50
        self.emotions = ['anger', 'fear', 'joy', 'sadness']  # Based on your filtered dataset
        
    def load_model(self, model_path='emotion_model.h5', tokenizer_path='tokenizer.pkl', encoder_path='label_encoder.pkl'):
        """Load the trained model and preprocessing objects"""
        try:
            # Check if TensorFlow is available
            try:
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
            logger.info("Deep learning emotion model loaded successfully")
            
            # Load tokenizer
            with open(tokenizer_path, 'rb') as f:
                self.tokenizer = pickle.load(f)
            logger.info("Tokenizer loaded successfully")
            
            # Load label encoder
            with open(encoder_path, 'rb') as f:
                self.label_encoder = pickle.load(f)
            logger.info("Label encoder loaded successfully")
            
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
            # Use keyword-based fallback
            return self._fallback_predict_emotion(text)
        
        try:
            from tensorflow.keras.preprocessing.sequence import pad_sequences
            
            clean_text = self.preprocess_text(text)
            if not clean_text:
                return None, 0.0
            
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
            return 'sadness', 0.4  # Default to sadness for mental health context
    
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