/**
 * Candidate Photo Upload Component with Face Embedding Generation
 * Generates 128-dimensional FaceNet embeddings on the client side
 * Same model and preprocessing as mobile app for consistency
 *
 * Copyright (c) 2026 Neanv. All rights reserved.
 */

"use client";

import { useState, useRef } from "react";
import { faceNetService } from "@/lib/facenet-service";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Camera, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PhotoUploadResult {
  photoBase64: string;
  faceEmbedding: number[];
  photoUrl?: string;
  processingTime: number;
}

interface CandidatePhotoUploadProps {
  candidateId: string;
  candidateName: string;
  existingPhotoUrl?: string;
  onUploadSuccess?: (result: PhotoUploadResult) => void;
  onUploadError?: (error: Error) => void;
}

type UploadState =
  | "idle"
  | "loading-model"
  | "processing"
  | "uploading"
  | "success"
  | "error";

export function CandidatePhotoUpload({
  candidateId,
  candidateName,
  existingPhotoUrl,
  onUploadSuccess,
  onUploadError,
}: CandidatePhotoUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingPhotoUrl || null,
  );
  const [embedding, setEmbedding] = useState<Float32Array | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file (JPG, PNG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Step 1: Load model if needed
      setState("loading-model");
      setProgress(0);

      if (!faceNetService.isReady()) {
        toast({
          title: "Loading face recognition model",
          description: "First-time download (~23 MB), cached for future use",
        });

        await faceNetService.loadModel((p) => setProgress(p));
      }

      // Step 2: Generate embedding
      setState("processing");
      toast({
        title: "Processing photo",
        description: "Generating face embedding...",
      });

      const startTime = performance.now();
      const result = await faceNetService.generateEmbedding(file);
      const totalTime = Math.round(performance.now() - startTime);

      setEmbedding(result.embedding);
      setProcessingTime(totalTime);
      setProgress(100);

      console.log("✅ Face embedding generated:", {
        dimensions: result.dimensions,
        processingTime: result.processingTime,
        range: [Math.min(...result.embedding), Math.max(...result.embedding)],
      });

      // Step 3: Upload to backend
      setState("uploading");
      await uploadPhotoWithEmbedding(file, result.embedding);

      setState("success");
      toast({
        title: "Photo uploaded successfully",
        description: `Face embedding generated (128 dims) in ${totalTime}ms`,
      });
    } catch (error) {
      console.error("❌ Photo upload failed:", error);
      setState("error");
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      onUploadError?.(error as Error);
    }
  };

  const uploadPhotoWithEmbedding = async (
    file: File,
    faceEmbedding: Float32Array,
  ): Promise<void> => {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Upload to backend API
    const response = await fetch(`/api/candidates/${candidateId}/photo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        photoBase64: base64,
        faceEmbedding: Array.from(faceEmbedding), // Convert Float32Array to regular array
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }

    const data = await response.json();

    onUploadSuccess?.({
      photoBase64: base64,
      faceEmbedding: Array.from(faceEmbedding),
      photoUrl: data.photoUrl,
      processingTime,
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = () => {
    switch (state) {
      case "loading-model":
      case "processing":
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "loading-model":
        return "Loading model...";
      case "processing":
        return "Processing photo...";
      case "uploading":
        return "Uploading...";
      case "success":
        return "Uploaded successfully";
      case "error":
        return "Upload failed";
      default:
        return "Upload photo";
    }
  };

  const isProcessing = ["loading-model", "processing", "uploading"].includes(
    state,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            onClick={handleButtonClick}
            disabled={isProcessing}
            variant={state === "success" ? "outline" : "default"}
            className="w-full"
          >
            {getStatusIcon()}
            <span className="ml-2">{getStatusText()}</span>
          </Button>
        </div>
      </div>

      {/* Progress bar during model loading/processing */}
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            {state === "loading-model" && `Loading model: ${progress}%`}
            {state === "processing" && "Generating face embedding..."}
            {state === "uploading" && "Uploading to server..."}
          </p>
        </div>
      )}

      {/* Photo preview */}
      {previewUrl && (
        <div className="border rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt={`${candidateName} photo`}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Embedding info */}
      {embedding && state === "success" && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Face embedding generated
              </p>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                <li>• Dimensions: {embedding.length}</li>
                <li>• Processing time: {processingTime}ms</li>
                <li>
                  • Range: [{Math.min(...embedding).toFixed(3)},{" "}
                  {Math.max(...embedding).toFixed(3)}]
                </li>
                <li>• Compatible with mobile app verification</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Model info */}
      {faceNetService.isReady() && state === "idle" && (
        <div className="text-xs text-muted-foreground">
          <p>✅ Face recognition model loaded</p>
          <p>📊 FaceNet (160x160 → 128 dims)</p>
        </div>
      )}
    </div>
  );
}
