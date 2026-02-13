/**
 * API Route: Upload Candidate Photo with Face Embedding
 * Stores photo and 128-dimensional FaceNet embedding in database
 * Compatible with mobile app's local verification
 *
 * Copyright (c) 2026 Neanv. All rights reserved.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const candidateId = params.id;

    // Parse request body
    const body = await request.json();
    const { photoBase64, faceEmbedding } = body;

    // Validate input
    if (!photoBase64) {
      return NextResponse.json(
        { error: "Photo data is required" },
        { status: 400 },
      );
    }

    // Validate embedding if provided
    if (
      faceEmbedding &&
      (!Array.isArray(faceEmbedding) || faceEmbedding.length !== 128)
    ) {
      return NextResponse.json(
        { error: "Face embedding must be an array of 128 numbers" },
        { status: 400 },
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Verify candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, full_name")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    // Convert base64 to buffer
    const photoBuffer = Buffer.from(photoBase64, "base64");

    // Generate filename
    const timestamp = Date.now();
    const filename = `${candidateId}_${timestamp}.jpg`;
    const storagePath = `candidates/${filename}`;

    // Upload photo to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("candidate-photos")
      .upload(storagePath, photoBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload photo to storage" },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("candidate-photos")
      .getPublicUrl(storagePath);

    const photoUrl = publicUrlData.publicUrl;

    // Update candidate record with photo URL, binary data, and embedding
    const updateData: any = {
      photo_url: photoUrl,
      photo_data: photoBuffer,
      updated_at: new Date().toISOString(),
    };

    // Add face embedding if provided (same format as mobile app)
    if (faceEmbedding) {
      // PostgreSQL vector format: [0.123, -0.456, ...]
      updateData.face_embedding = faceEmbedding;
    }

    const { error: updateError } = await supabase
      .from("candidates")
      .update(updateData)
      .eq("id", candidateId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update candidate record" },
        { status: 500 },
      );
    }

    console.log(`✅ Photo uploaded for candidate ${candidateId}`, {
      filename,
      photoUrl,
      hasEmbedding: !!faceEmbedding,
      embeddingDims: faceEmbedding?.length,
    });

    return NextResponse.json({
      success: true,
      photoUrl,
      message: faceEmbedding
        ? "Photo and face embedding saved successfully"
        : "Photo saved successfully",
      embedding: faceEmbedding
        ? {
            dimensions: faceEmbedding.length,
            sample: faceEmbedding.slice(0, 5), // First 5 values for verification
          }
        : undefined,
    });
  } catch (error) {
    console.error("❌ Photo upload error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const candidateId = params.id;
    const supabase = await createClient();

    // Get candidate photo and embedding
    const { data, error } = await supabase
      .from("candidates")
      .select("id, full_name, photo_url, face_embedding")
      .eq("id", candidateId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: data.id,
      fullName: data.full_name,
      photoUrl: data.photo_url,
      hasEmbedding: !!data.face_embedding,
      embeddingDimensions: data.face_embedding?.length || 0,
    });
  } catch (error) {
    console.error("❌ Get photo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
