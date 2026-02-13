/**
 * Example: Integrating CandidatePhotoUpload into Candidate Management
 * This shows how to add face embedding generation to your existing candidate pages
 *
 * Copyright (c) 2026 Neanv. All rights reserved.
 */

"use client";

import { useState } from "react";
import {
  CandidatePhotoUpload,
  PhotoUploadResult,
} from "@/components/candidate-photo-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera } from "lucide-react";

interface Candidate {
  id: string;
  full_name: string;
  photo_url?: string;
  face_embedding?: number[];
}

export function CandidatePhotoUploadExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );

  // Example candidate data
  const candidate: Candidate = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    full_name: "John Doe",
    photo_url: undefined,
  };

  const handlePhotoUploadSuccess = (result: PhotoUploadResult) => {
    console.log("✅ Photo uploaded successfully!");
    console.log("Photo URL:", result.photoUrl);
    console.log("Embedding dimensions:", result.faceEmbedding.length);
    console.log("Processing time:", result.processingTime, "ms");

    // Update candidate in state/database
    setSelectedCandidate((prev) =>
      prev
        ? {
            ...prev,
            photo_url: result.photoUrl,
            face_embedding: result.faceEmbedding,
          }
        : null,
    );

    // Close dialog
    setIsOpen(false);

    // Show success message
    alert("Photo and face embedding saved successfully!");
  };

  const handlePhotoUploadError = (error: Error) => {
    console.error("❌ Upload failed:", error);
    alert(`Upload failed: ${error.message}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Candidate Profile</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCandidate(candidate)}>
              <Camera className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Candidate Photo</DialogTitle>
              <DialogDescription>
                Upload a photo to generate face embedding for verification.
                Photo will be processed locally in your browser.
              </DialogDescription>
            </DialogHeader>

            {selectedCandidate && (
              <CandidatePhotoUpload
                candidateId={selectedCandidate.id}
                candidateName={selectedCandidate.full_name}
                existingPhotoUrl={selectedCandidate.photo_url}
                onUploadSuccess={handlePhotoUploadSuccess}
                onUploadError={handlePhotoUploadError}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Show current photo if exists */}
      {candidate.photo_url && (
        <div className="border rounded-lg overflow-hidden">
          <img
            src={candidate.photo_url}
            alt={candidate.full_name}
            className="w-full h-64 object-cover"
          />
          {candidate.face_embedding && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border-t">
              <p className="text-sm text-green-900 dark:text-green-100">
                ✅ Face embedding available ({candidate.face_embedding.length}{" "}
                dimensions)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Alternative: Inline Upload (No Dialog)
 */
export function InlinePhotoUploadExample() {
  const candidate: Candidate = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    full_name: "Jane Smith",
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Upload Photo</h3>

      <CandidatePhotoUpload
        candidateId={candidate.id}
        candidateName={candidate.full_name}
        onUploadSuccess={(result) => {
          console.log("Upload success:", result);
          // Refresh candidate data, update UI, etc.
        }}
        onUploadError={(error) => {
          console.error("Upload error:", error);
        }}
      />
    </div>
  );
}

/**
 * Integration into Existing Table
 */
export function CandidateTableWithUpload() {
  const candidates: Candidate[] = [
    {
      id: "1",
      full_name: "John Doe",
      photo_url: "https://example.com/photo1.jpg",
      face_embedding: new Array(128).fill(0),
    },
    {
      id: "2",
      full_name: "Jane Smith",
      photo_url: undefined,
      face_embedding: undefined,
    },
  ];

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Photo</th>
          <th>Embedding</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {candidates.map((candidate) => (
          <tr key={candidate.id}>
            <td>{candidate.full_name}</td>
            <td>
              {candidate.photo_url ? (
                <img
                  src={candidate.photo_url}
                  alt={candidate.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-400">No photo</span>
              )}
            </td>
            <td>
              {candidate.face_embedding ? (
                <span className="text-green-600">✓ Available</span>
              ) : (
                <span className="text-gray-400">Not generated</span>
              )}
            </td>
            <td>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUploadingId(candidate.id)}
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    {candidate.photo_url ? "Update" : "Upload"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {candidate.photo_url ? "Update" : "Upload"} Photo
                    </DialogTitle>
                  </DialogHeader>
                  <CandidatePhotoUpload
                    candidateId={candidate.id}
                    candidateName={candidate.full_name}
                    existingPhotoUrl={candidate.photo_url}
                    onUploadSuccess={() => {
                      // Refresh table data
                      window.location.reload();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
