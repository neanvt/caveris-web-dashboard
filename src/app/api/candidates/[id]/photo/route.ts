/**
 * API Route: Upload Candidate Photo with Face Embedding
 * Stores photo and 128-dimensional FaceNet embedding in database
 * Compatible with mobile app's local verification
 *
 * Copyright (c) 2026 Neanv. All rights reserved.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: candidateId } = await params;

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

    // Get Supabase admin client (bypasses RLS)
    const supabase = await createAdminClient();

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

    let photoUrl = null;

    // Try to upload photo to Supabase Storage (optional - fallback to database only)
    try {
      const { error: uploadError } = await supabase.storage
        .from("candidate-photos")
        .upload(storagePath, photoBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.warn(
          "Storage upload failed, will store photo in database only:",
          uploadError,
        );
      } else {
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("candidate-photos")
          .getPublicUrl(storagePath);
        photoUrl = publicUrlData.publicUrl;
      }
    } catch (storageError) {
      console.warn(
        "Storage operation failed, will store photo in database only:",
        storageError,
      );
    }

    // Update candidate record with photo URL (if available), binary data, and embedding
    const updateData: {
      photo_url: string | null;
      photo_data: Buffer;
      updated_at: string;
      face_embedding?: number[];
    } = {
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
      photoUrl: photoUrl || "stored in database only",
      hasEmbedding: !!faceEmbedding,
      embeddingDims: faceEmbedding?.length,
    });

    return NextResponse.json({
      success: true,
      photoUrl: photoUrl || `/api/candidates/${candidateId}/photo`,
      message: faceEmbedding
        ? "Photo and face embedding saved successfully"
        : "Photo saved successfully",
      storageUsed: !!photoUrl,
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: candidateId } = await params;
    const supabase = await createAdminClient();

    // Check if request wants metadata (JSON) or image data
    const acceptHeader = request.headers.get("accept") || "";
    const wantsJson = acceptHeader.includes("application/json");

    // Get candidate photo data
    const { data, error } = await supabase
      .from("candidates")
      .select("id, full_name, photo_url, photo_data, face_embedding")
      .eq("id", candidateId)
      .single();

    console.log("📸 GET photo request for candidate:", candidateId);
    console.log("Data found:", !!data);
    console.log("Has photo_data:", !!data?.photo_data);
    console.log("photo_data type:", typeof data?.photo_data);

    if (error || !data) {
      console.error("❌ Candidate not found:", error);
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    // If request wants JSON metadata, return that
    if (wantsJson) {
      return NextResponse.json({
        id: data.id,
        fullName: data.full_name,
        photoUrl: data.photo_url || `/api/candidates/${candidateId}/photo`,
        hasEmbedding: !!data.face_embedding,
        embeddingDimensions: data.face_embedding?.length || 0,
        hasPhotoData: !!data.photo_data,
      });
    }

    // Otherwise, return the actual image data
    if (!data.photo_data) {
      console.warn("⚠️ No photo_data found for candidate:", candidateId);
      return NextResponse.json(
        { error: "No photo available for this candidate" },
        { status: 404 },
      );
    }

    console.log("✅ Returning photo data for:", data.full_name);

    // Convert photo_data to Buffer if needed
    let photoBuffer: Buffer;
    if (Buffer.isBuffer(data.photo_data)) {
      photoBuffer = data.photo_data;
    } else if (typeof data.photo_data === "string") {
      // If it's a hex string or base64, convert it
      photoBuffer = Buffer.from(data.photo_data, "base64");
    } else {
      console.error("❌ Unexpected photo_data type:", typeof data.photo_data);
      return NextResponse.json(
        { error: "Invalid photo data format" },
        { status: 500 },
      );
    }

    // Return image data as JPEG
    return new NextResponse(photoBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("❌ Get photo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
