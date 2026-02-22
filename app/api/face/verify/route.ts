/**
 * Azure Face API Integration - Next.js API Route
 * 
 * POST /api/face/verify
 * 
 * This endpoint securely calls Azure Face API for face verification.
 * The API key is stored in environment variables, never exposed to mobile app.
 */

import { NextRequest, NextResponse } from 'next/server';

// Azure Face API Configuration
const AZURE_FACE_ENDPOINT = process.env.AZURE_FACE_ENDPOINT || '';
const AZURE_FACE_KEY = process.env.AZURE_FACE_KEY || '';

// Verification thresholds
const CONFIDENCE_THRESHOLD = 0.60; // 60% - Azure is much more accurate
const HIGH_CONFIDENCE = 0.80; // 80%+ = high confidence
const LOW_CONFIDENCE = 0.50; // <50% = likely different

interface DetectResponse {
  faceId: string;
  faceAttributes?: {
    blur?: { blurLevel: string };
    exposure?: { exposureLevel: string };
    noise?: { noiseLevel: string };
  };
}

interface VerifyResponse {
  isIdentical: boolean;
  confidence: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();
    const { capturedImage, referenceImage } = body;

    // Validate input
    if (!capturedImage || !referenceImage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both capturedImage and referenceImage are required',
        },
        { status: 400 }
      );
    }

    // Check Azure configuration
    if (!AZURE_FACE_ENDPOINT || !AZURE_FACE_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Azure Face API not configured',
        },
        { status: 500 }
      );
    }

    console.log('🔷 Azure Face API - Starting verification...');

    // Step 1: Detect face in captured image
    const capturedFaceId = await detectFace(capturedImage, 'captured');
    if (!capturedFaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No face detected in captured image',
          verdict: 'REJECT',
          reason: 'Face detection failed in captured image',
        },
        { status: 400 }
      );
    }

    // Step 2: Detect face in reference image
    const referenceFaceId = await detectFace(referenceImage, 'reference');
    if (!referenceFaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No face detected in reference image',
          verdict: 'REJECT',
          reason: 'Face detection failed in reference image',
        },
        { status: 400 }
      );
    }

    // Step 3: Verify faces
    const verificationResult = await verifyFaces(capturedFaceId, referenceFaceId);

    const processingTimeMs = Date.now() - startTime;

    // Determine verdict based on confidence
    const confidence = verificationResult.confidence;
    let verdict: 'ACCEPT' | 'REJECT';
    let reason: string;
    let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';

    if (confidence >= HIGH_CONFIDENCE) {
      verdict = 'ACCEPT';
      reason = 'High confidence match - faces are identical';
      confidenceLevel = 'HIGH';
    } else if (confidence >= CONFIDENCE_THRESHOLD) {
      verdict = 'ACCEPT';
      reason = 'Faces match with good confidence';
      confidenceLevel = 'MEDIUM';
    } else if (confidence >= LOW_CONFIDENCE) {
      verdict = 'REJECT';
      reason = `Low confidence (${(confidence * 100).toFixed(1)}% < ${CONFIDENCE_THRESHOLD * 100}%)`;
      confidenceLevel = 'LOW';
    } else {
      verdict = 'REJECT';
      reason = `Faces do not match (${(confidence * 100).toFixed(1)}% confidence)`;
      confidenceLevel = 'HIGH';
    }

    console.log(`✅ Azure Face API - ${verdict} (${(confidence * 100).toFixed(1)}% confidence)`);

    // Return result
    return NextResponse.json({
      success: true,
      isMatch: verdict === 'ACCEPT',
      confidence: confidence,
      confidencePercent: confidence * 100,
      verdict: verdict,
      reason: reason,
      confidenceLevel: confidenceLevel,
      method: 'azure',
      processingTimeMs: processingTimeMs,
      azureResult: {
        isIdentical: verificationResult.isIdentical,
        confidence: verificationResult.confidence,
      },
    });
  } catch (error: any) {
    console.error('❌ Azure Face API Error:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        verdict: 'ERROR',
        reason: 'Face verification service error',
        method: 'azure',
      },
      { status: 500 }
    );
  }
}

/**
 * Detect face in image and return face ID
 */
async function detectFace(base64Image: string, imageType: string): Promise<string | null> {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Call Azure Face API - Detect
    const detectUrl = `${AZURE_FACE_ENDPOINT}/face/v1.0/detect`;

    const response = await fetch(detectUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_FACE_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Face detection failed');
    }

    const faces: DetectResponse[] = await response.json();

    if (!faces || faces.length === 0) {
      console.warn(`⚠️  No face detected in ${imageType} image`);
      return null;
    }

    if (faces.length > 1) {
      console.warn(`⚠️  Multiple faces detected in ${imageType} image (${faces.length}), using first face`);
    }

    const face = faces[0];
    const faceId = face.faceId;

    // Check image quality
    const attributes = face.faceAttributes;
    if (attributes) {
      if (attributes.blur && attributes.blur.blurLevel === 'high') {
        console.warn(`⚠️  ${imageType} image is blurry`);
      }
      if (attributes.exposure && attributes.exposure.exposureLevel !== 'goodExposure') {
        console.warn(`⚠️  ${imageType} image has poor exposure: ${attributes.exposure.exposureLevel}`);
      }
      if (attributes.noise && attributes.noise.noiseLevel === 'high') {
        console.warn(`⚠️  ${imageType} image is noisy`);
      }
    }

    console.log(`✅ Face detected in ${imageType} image (ID: ${faceId.substring(0, 8)}...)`);

    return faceId;
  } catch (error: any) {
    console.error(`❌ Face detection failed for ${imageType} image:`, error.message);
    throw new Error(`Face detection failed: ${error.message}`);
  }
}

/**
 * Verify two faces using their face IDs
 */
async function verifyFaces(faceId1: string, faceId2: string): Promise<VerifyResponse> {
  try {
    const verifyUrl = `${AZURE_FACE_ENDPOINT}/face/v1.0/verify`;

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_FACE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        faceId1: faceId1,
        faceId2: faceId2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Face verification failed');
    }

    const result: VerifyResponse = await response.json();

    console.log(`🔍 Azure verification result: ${result.isIdentical ? 'IDENTICAL' : 'DIFFERENT'} (${(result.confidence * 100).toFixed(1)}% confidence)`);

    return result;
  } catch (error: any) {
    console.error('❌ Face verification failed:', error.message);
    throw new Error(`Face verification failed: ${error.message}`);
  }
}
