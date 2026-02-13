#!/bin/bash

# FaceNet Model Setup for Web Dashboard
# Converts mobile's TFLite model to TensorFlow.js format
# 
# Copyright (c) 2026 Neanv. All rights reserved.

set -e

echo "🚀 FaceNet Model Setup for Web Dashboard"
echo "=========================================="
echo ""

# Check if Python 3.11 is available
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
    echo "✅ Using Python 3.11"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$PYTHON_VERSION" == "3.11" ]; then
        PYTHON_CMD="python3"
        echo "✅ Using Python 3"
    else
        echo "⚠️  Warning: Python $PYTHON_VERSION detected (recommended: 3.11)"
        echo "   Python 3.13 has compatibility issues with tensorflowjs"
        read -p "   Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        PYTHON_CMD="python3"
    fi
else
    echo "❌ Python 3 not found. Please install Python 3.11"
    exit 1
fi

# Check for required Python packages
echo ""
echo "📦 Installing Python dependencies..."
$PYTHON_CMD -m pip install --quiet tensorflowjs keras-facenet tensorflow

# Check if TFLite model exists
TFLITE_MODEL="../FaceRecognition/models/tflite/facenet_quantized.tflite"
if [ ! -f "$TFLITE_MODEL" ]; then
    echo "❌ TFLite model not found at: $TFLITE_MODEL"
    echo "   Please ensure the FaceRecognition folder exists with the model"
    exit 1
fi

echo "✅ TFLite model found"

# Create output directory
mkdir -p public/models/facenet
echo "✅ Output directory created: public/models/facenet"

# Run conversion
echo ""
echo "🔄 Converting FaceNet model to TensorFlow.js..."
echo "   This may take 2-3 minutes..."
$PYTHON_CMD scripts/convert_facenet_to_tfjs.py

# Check if conversion succeeded
if [ -f "public/models/facenet/model.json" ]; then
    echo ""
    echo "✅ Model conversion successful!"
    echo ""
    echo "📊 Model files:"
    ls -lh public/models/facenet/
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Start the dev server: npm run dev"
    echo "2. Navigate to candidate management"
    echo "3. Upload a photo - model will load automatically"
    echo ""
    echo "Note: First photo upload will take 2-4 seconds as model loads"
    echo "      Subsequent uploads will be faster (~1-2 seconds)"
else
    echo ""
    echo "❌ Model conversion failed"
    echo "   Check the error messages above for details"
    exit 1
fi
