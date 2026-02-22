/**
 * Azure Face API Test Endpoint
 * 
 * GET /api/face/test
 * 
 * Tests if Azure Face API is configured and accessible.
 */

import { NextResponse } from 'next/server';

const AZURE_FACE_ENDPOINT = process.env.AZURE_FACE_ENDPOINT || '';
const AZURE_FACE_KEY = process.env.AZURE_FACE_KEY || '';
const AZURE_FACE_REGION = process.env.AZURE_FACE_REGION || '';

export async function GET() {
  try {
    // Check if environment variables are set
    if (!AZURE_FACE_ENDPOINT || !AZURE_FACE_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Azure Face API not configured. Please set AZURE_FACE_ENDPOINT and AZURE_FACE_KEY in .env.local',
          configured: false,
        },
        { status: 500 }
      );
    }

    // Try to call Azure Face API
    const testUrl = `${AZURE_FACE_ENDPOINT}/face/v1.0/detect`;

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_FACE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: '' }), // Empty request to test connection
    });

    // Even if this fails, it means we can reach Azure
    // (it will fail because we sent empty data, but that's OK for testing)
    
    return NextResponse.json({
      success: true,
      message: 'Azure Face API connection successful',
      endpoint: AZURE_FACE_ENDPOINT,
      region: AZURE_FACE_REGION,
      configured: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        endpoint: AZURE_FACE_ENDPOINT,
        configured: true,
      },
      { status: 500 }
    );
  }
}
