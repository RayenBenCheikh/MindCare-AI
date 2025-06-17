import os
import pickle
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_model_availability():
    """Check if the trained model is available and working"""
    
    print("🔍 CHECKING TRAINED MODEL STATUS")
    print("=" * 50)
    
    # Check if model file exists
    model_paths = [
        'tuned_high_performance_hr_classifier.pkl',
        './tuned_high_performance_hr_classifier.pkl',
        '../tuned_high_performance_hr_classifier.pkl',
        'AI/tuned_high_performance_hr_classifier.pkl',
        'backend/tuned_high_performance_hr_classifier.pkl'
    ]
    
    model_found = False
    model_path = None
    
    for path in model_paths:
        if os.path.exists(path):
            model_found = True
            model_path = path
            print(f"✅ Model found at: {path}")
            break
    
    if not model_found:
        print("❌ Model file not found in any of these locations:")
        for path in model_paths:
            print(f"   - {path}")
        return False, None
    
    # Try to load the model
    try:
        with open(model_path, 'rb') as f:
            pipeline = pickle.load(f)
            
        print(f"✅ Model loaded successfully!")
        print(f"📊 Model name: {pipeline.get('model_name', 'Unknown')}")
        print(f"🎯 Model accuracy: {pipeline.get('accuracy', 'Unknown')}")
        print(f"📈 Features: {pipeline.get('feature_count', 'Unknown')}")
        print(f"🔧 Components: {list(pipeline.keys())}")
        
        # Check required components
        required_components = ['model', 'scaler', 'feature_selector']
        missing_components = []
        
        for component in required_components:
            if component not in pipeline:
                missing_components.append(component)
            else:
                print(f"   ✅ {component}: {type(pipeline[component]).__name__}")
        
        if missing_components:
            print(f"❌ Missing components: {missing_components}")
            return False, model_path
        
        print(f"✅ All required components present!")
        return True, model_path
        
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return False, model_path

if __name__ == "__main__":
    success, path = check_model_availability()
    if success:
        print(f"\n🎉 Model is ready for use!")
    else:
        print(f"\n💡 Need to train the model or fix the path")