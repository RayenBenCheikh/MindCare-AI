from emotion_detector_dl import DeepLearningEmotionDetector
import logging

logging.basicConfig(level=logging.INFO)

def test_integration():
    # Test the emotion detector
    detector = DeepLearningEmotionDetector()
    
    if detector.load_model():
        test_texts = [
            "I'm feeling really depressed and hopeless",
            "I'm so excited and happy about my new job!",
            "This situation is making me furious",
            "I'm terrified about what might happen"
        ]
        
        print("Testing Emotion Detection Integration:")
        print("=" * 50)
        
        for text in test_texts:
            emotion, confidence = detector.predict_emotion(text)
            probs = detector.get_emotion_probabilities(text)
            
            print(f"Text: '{text}'")
            print(f"Predicted Emotion: {emotion}")
            print(f"Confidence: {confidence:.3f}")
            print(f"All Probabilities: {probs}")
            print("-" * 50)
    else:
        print("❌ Failed to load emotion detection model")
        print("Make sure you've trained the model using createDataset.ipynb")

if __name__ == "__main__":
    test_integration()