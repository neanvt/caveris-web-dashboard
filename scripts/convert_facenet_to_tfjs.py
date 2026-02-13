"""
Convert FaceNet TFLite model to TensorFlow.js format for web dashboard.
This enables the same FaceNet model used in mobile app to run in browsers.

Copyright (c) 2026 Neanv. All rights reserved.
"""
import tensorflow as tf
import tensorflowjs as tfjs
from pathlib import Path
import shutil

def convert_tflite_to_tfjs():
    """Convert FaceNet TFLite model to TensorFlow.js format."""
    
    # Paths
    script_dir = Path(__file__).parent
    tflite_path = script_dir / '../FaceRecognition/models/tflite/facenet_quantized.tflite'
    tfjs_output_path = script_dir / 'public/models/facenet'
    temp_saved_model = script_dir / 'temp_saved_model'
    
    # Create output directory
    tfjs_output_path.mkdir(parents=True, exist_ok=True)
    
    if not tflite_path.exists():
        raise FileNotFoundError(
            f"TFLite model not found at {tflite_path}"
        )
    
    print(f"📦 Loading TFLite model from {tflite_path}")
    
    # Load TFLite model
    interpreter = tf.lite.Interpreter(model_path=str(tflite_path))
    interpreter.allocate_tensors()
    
    # Get input/output details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print(f"✅ Model loaded")
    print(f"   Input shape: {input_details[0]['shape']}")
    print(f"   Output shape: {output_details[0]['shape']}")
    
    # We need to use the original Keras model for conversion
    # TFLite -> SavedModel -> TensorFlow.js
    try:
        from keras_facenet import FaceNet
        print("📥 Loading original FaceNet Keras model...")
        embedder = FaceNet()
        model = embedder.model
        
        # Save as SavedModel first
        print(f"💾 Saving as SavedModel to {temp_saved_model}")
        tf.saved_model.save(model, str(temp_saved_model))
        
        # Convert SavedModel to TensorFlow.js
        print(f"🔄 Converting to TensorFlow.js format...")
        tfjs.converters.convert_tf_saved_model(
            str(temp_saved_model),
            str(tfjs_output_path),
            skip_op_check=True,
            strip_debug_ops=True
        )
        
        # Clean up temp directory
        if temp_saved_model.exists():
            shutil.rmtree(temp_saved_model)
        
        print(f"\n✅ Conversion successful!")
        print(f"📁 TensorFlow.js model saved to: {tfjs_output_path}")
        
        # List generated files
        files = list(tfjs_output_path.glob('*'))
        total_size = sum(f.stat().st_size for f in files if f.is_file())
        print(f"📊 Generated {len(files)} files, total size: {total_size / 1024 / 1024:.2f} MB")
        
        print("\n" + "="*60)
        print("✅ Model ready for web dashboard!")
        print("="*60)
        print("\nNext steps:")
        print("1. Model files are in: public/models/facenet/")
        print("2. Web app will load from: /models/facenet/model.json")
        print("3. First load will download ~23 MB to browser")
        print("4. Browser will cache model for subsequent visits")
        print("="*60)
        
        return tfjs_output_path
        
    except ImportError:
        print("❌ keras-facenet not installed.")
        print("   Install with: pip install keras-facenet")
        raise

if __name__ == "__main__":
    try:
        convert_tflite_to_tfjs()
    except Exception as e:
        print(f"\n❌ Conversion failed: {e}")
        raise
