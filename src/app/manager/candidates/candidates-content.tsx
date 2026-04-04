"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShiftFilterBar } from "@/components/manager/shift-filter-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  MapPin,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  User,
  FileText,
  Phone,
  Mail,
  Building2,
  Fingerprint,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface Candidate {
  id: string;
  roll_number: string;
  full_name: string;
  father_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  aadhaar_number: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  verification_status: string;
  verification_attempts: number;
  centre_id: string;
  shift_id?: string;
  exam_id: string;
  centre_name: string;
  city: string;
  shift_name?: string;
  shift_code?: string;
  exam_name: string;
  exam_code: string;
}

interface CandidateDetail extends Candidate {
  centre_code: string;
  centre_address: string;
  latestVerification: any;
}

type SortKey = keyof Candidate | "";
type SortDir = "asc" | "desc";

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="mr-1 h-3 w-3" />
        Verified
      </Badge>
    );
  }
  if (status === "absent") {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="mr-1 h-3 w-3" />
        Absent
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
      <Clock className="mr-1 h-3 w-3" />
      Pending
    </Badge>
  );
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (col !== sortKey)
    return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-300 inline" />;
  return sortDir === "asc" ? (
    <ArrowUp className="ml-1 h-3 w-3 text-indigo-600 inline" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3 text-indigo-600 inline" />
  );
}

function SortableHead({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
}: {
  col: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;
}) {
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-gray-50"
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </TableHead>
  );
}

function CandidateDetailModal({
  candidateId,
  onClose,
}: {
  candidateId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const { getManagerCandidateDetail } =
          await import("@/app/actions/supabase-actions");
        const data = await getManagerCandidateDetail(candidateId);
        setDetail(data as any);
      } catch (err) {
        console.error("Error loading candidate detail:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [candidateId]);

  // Helper: format a score that is already stored as 0-100 (not 0-1)
  const fmtScore = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "—";
    return `${Number(val).toFixed(1)}%`;
  };

  const methodBadge = (method: string) => {
    const map: Record<string, { label: string; color: string }> = {
      face: { label: "Face", color: "bg-blue-100 text-blue-800" },
      fingerprint: {
        label: "Fingerprint",
        color: "bg-purple-100 text-purple-800",
      },
      iris: { label: "Iris", color: "bg-cyan-100 text-cyan-800" },
      aadhaar: { label: "Aadhaar", color: "bg-orange-100 text-orange-800" },
    };
    const m = map[method] || {
      label: method,
      color: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.color}`}
      >
        {m.label}
      </span>
    );
  };

  const scoreColor = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "text-gray-700";
    if (val >= 80) return "text-green-700 font-semibold";
    if (val >= 60) return "text-amber-700 font-semibold";
    return "text-red-600 font-semibold";
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-indigo-600" />
            Candidate Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
            <p className="mt-3 text-gray-600">Loading...</p>
          </div>
        ) : !detail ? (
          <div className="py-12 text-center">
            <p className="text-red-600">Could not load candidate details.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Photo + Status */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                {detail.photo_url ? (
                  <img
                    src={detail.photo_url}
                    alt={detail.full_name}
                    className="h-28 w-28 rounded-xl object-cover border-2 border-indigo-100 shadow"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <User className="h-14 w-14 text-indigo-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">
                  {detail.full_name}
                </h2>
                {detail.father_name && (
                  <p className="text-sm text-gray-600">
                    S/D/W of {detail.father_name}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <StatusBadge status={detail.verification_status} />
                  {detail.verification_attempts > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {detail.verification_attempts} attempt(s)
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    <FileText className="h-3.5 w-3.5" />
                    Roll: {detail.roll_number}
                  </span>
                  {detail.gender && (
                    <span className="inline-flex items-center text-sm bg-gray-100 px-2 py-1 rounded capitalize">
                      {detail.gender}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 bg-gray-50">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Date of Birth
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {detail.date_of_birth
                    ? new Date(detail.date_of_birth).toLocaleDateString("en-IN")
                    : "—"}
                </p>
              </div>
              {detail.aadhaar_number && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Aadhaar
                  </p>
                  <p className="mt-0.5 text-sm font-medium">
                    {detail.aadhaar_number}
                  </p>
                </div>
              )}
              {detail.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="mt-0.5 text-sm font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {detail.phone}
                  </p>
                </div>
              )}
              {detail.email && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="mt-0.5 text-sm font-medium flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {detail.email}
                  </p>
                </div>
              )}
              {detail.address && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Address
                  </p>
                  <p className="mt-0.5 text-sm font-medium">{detail.address}</p>
                </div>
              )}
            </div>

            {/* Exam & Centre */}
            <div className="grid grid-cols-2 gap-3 border rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Exam
                </p>
                <p className="mt-0.5 text-sm font-medium">{detail.exam_name}</p>
                {detail.exam_code && (
                  <p className="text-xs text-gray-400">{detail.exam_code}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Centre
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {detail.centre_name}
                </p>
                {detail.city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    {detail.city}
                  </p>
                )}
              </div>
            </div>

            {/* Verification Record */}
            {detail.latestVerification ? (
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                    <Fingerprint className="h-4 w-4" />
                    Latest Verification Record
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {detail.latestVerification.verification_method &&
                      methodBadge(
                        detail.latestVerification.verification_method,
                      )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        detail.latestVerification.verification_result ===
                        "success"
                          ? "bg-green-100 text-green-800"
                          : detail.latestVerification.verification_result ===
                              "retry"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(
                        detail.latestVerification.verification_result || "—"
                      ).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Basic info row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Date &amp; Time</p>
                      <p className="text-sm font-medium">
                        {detail.latestVerification.created_at
                          ? new Date(
                              detail.latestVerification.created_at,
                            ).toLocaleString("en-IN")
                          : "—"}
                      </p>
                    </div>
                    {detail.latestVerification.device_id && (
                      <div>
                        <p className="text-xs text-gray-500">Device</p>
                        <p className="text-sm font-medium">
                          {detail.latestVerification.device_id}
                        </p>
                      </div>
                    )}
                    {detail.latestVerification.verifier_id && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">
                          Verified By (ID)
                        </p>
                        <p className="text-sm font-mono text-gray-600 break-all">
                          {detail.latestVerification.verifier_name ||
                            detail.latestVerification.verifier_id}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── FACE ── */}
                  {(detail.latestVerification.verification_method === "face" ||
                    detail.latestVerification.verification_percentage != null ||
                    detail.latestVerification.confidence_score != null ||
                    detail.latestVerification.captured_photo ||
                    detail.latestVerification.photo_captured_url) && (
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 space-y-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        Face Verification
                      </p>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-3">
                        {detail.latestVerification.verification_percentage !=
                          null && (
                          <div>
                            <p className="text-xs text-blue-600">Match Score</p>
                            <p
                              className={`text-base ${scoreColor(detail.latestVerification.verification_percentage)}`}
                            >
                              {fmtScore(
                                detail.latestVerification
                                  .verification_percentage,
                              )}
                            </p>
                          </div>
                        )}
                        {detail.latestVerification.confidence_score != null && (
                          <div>
                            <p className="text-xs text-blue-600">
                              Confidence Score
                            </p>
                            <p
                              className={`text-base ${scoreColor(detail.latestVerification.confidence_score)}`}
                            >
                              {fmtScore(
                                detail.latestVerification.confidence_score,
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Side-by-side: Stored photo vs Captured photo */}
                      {(detail.photo_url ||
                        detail.latestVerification.captured_photo ||
                        detail.latestVerification.photo_captured_url) && (
                        <div className="grid grid-cols-2 gap-3">
                          {/* Stored / Registered photo */}
                          <div className="text-center">
                            <p className="text-xs text-blue-600 mb-1.5 font-medium">
                              Registered Photo
                            </p>
                            {detail.photo_url ? (
                              <img
                                src={detail.photo_url}
                                alt="Stored"
                                className="w-full max-w-[140px] mx-auto aspect-square rounded-xl object-cover border-2 border-blue-200 shadow"
                              />
                            ) : (
                              <div className="w-full max-w-[140px] mx-auto aspect-square rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                <User className="h-10 w-10 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Captured photo during verification */}
                          <div className="text-center">
                            <p className="text-xs text-blue-600 mb-1.5 font-medium">
                              Captured at Verification
                            </p>
                            {(() => {
                              const capturedUrl =
                                detail.latestVerification.photo_captured_url;
                              const capturedBase64 =
                                detail.latestVerification.captured_photo;
                              console.log(
                                "capturedBase64 length:",
                                capturedBase64 ? capturedBase64.length : 0,
                              );
                              // Use URL if available, otherwise build data URL from base64
                              const src = capturedUrl
                                ? capturedUrl
                                : capturedBase64
                                  ? capturedBase64.startsWith("data:")
                                    ? capturedBase64
                                    : `data:image/jpeg;base64,${capturedBase64}`
                                  : null;
                              return src ? (
                                <img
                                  src={src}
                                  alt="Captured"
                                  className="w-full max-w-[140px] mx-auto aspect-square rounded-xl object-cover border-2 border-blue-300 shadow"
                                />
                              ) : (
                                <div className="w-full max-w-[140px] mx-auto aspect-square rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                  <p className="text-xs text-gray-400 text-center px-2">
                                    Not captured
                                  </p>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── FINGERPRINT ── */}
                  {(detail.latestVerification.verification_method ===
                    "fingerprint" ||
                    detail.latestVerification.fingerprint_match_score != null ||
                    detail.latestVerification.captured_fingerprint_vector ||
                    detail.latestVerification.captured_fingerprint_image) && (
                    <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 space-y-3">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                        Fingerprint Verification
                      </p>

                      {/* Scores + finger name */}
                      <div className="grid grid-cols-2 gap-3">
                        {detail.latestVerification.fingerprint_match_score !=
                          null && (
                          <div>
                            <p className="text-xs text-purple-600">
                              Match Score
                            </p>
                            <p
                              className={`text-base ${scoreColor(detail.latestVerification.fingerprint_match_score)}`}
                            >
                              {fmtScore(
                                detail.latestVerification
                                  .fingerprint_match_score,
                              )}
                            </p>
                          </div>
                        )}
                        {detail.latestVerification.fingerprint_quality !=
                          null && (
                          <div>
                            <p className="text-xs text-purple-600">Quality</p>
                            <p
                              className={`text-base ${scoreColor(detail.latestVerification.fingerprint_quality)}`}
                            >
                              {fmtScore(
                                detail.latestVerification.fingerprint_quality,
                              )}
                            </p>
                          </div>
                        )}
                        {detail.latestVerification.finger_name && (
                          <div className="col-span-2">
                            <p className="text-xs text-purple-600">
                              Finger Used
                            </p>
                            <p className="text-sm font-medium capitalize">
                              {detail.latestVerification.finger_name.replace(
                                /_/g,
                                " ",
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Captured fingerprint image */}
                      {(detail.latestVerification.captured_fingerprint_image ||
                        detail.latestVerification
                          .captured_fingerprint_vector) && (
                        <div>
                          <p className="text-xs text-purple-600 mb-1.5 font-medium">
                            Captured Fingerprint Image
                          </p>
                          {(() => {
                            const raw = (detail.latestVerification
                              .captured_fingerprint_image ||
                              detail.latestVerification
                                .captured_fingerprint_vector) as string;
                            // The Mantra SDK returns a base64 BMP image.
                            // Try to render it; support both raw base64 and URLs
                            const src = raw.startsWith("http")
                              ? raw
                              : raw.startsWith("data:")
                                ? raw
                                : `data:image/bmp;base64,${raw}`;
                            return (
                              <img
                                src={src}
                                alt="Captured fingerprint"
                                className="h-36 w-28 mx-auto object-contain rounded-lg border-2 border-purple-200 bg-white shadow"
                                onError={(e) => {
                                  // fallback: try png if bmp fails
                                  const t = e.currentTarget;
                                  if (t.src.startsWith("data:image/bmp")) {
                                    t.src = `data:image/png;base64,${raw}`;
                                  } else {
                                    t.style.display = "none";
                                    t.nextElementSibling?.classList.remove(
                                      "hidden",
                                    );
                                  }
                                }}
                              />
                            );
                          })()}
                          <p className="hidden text-xs text-center text-gray-400 mt-1">
                            Image could not be displayed
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── IRIS ── */}
                  {(detail.latestVerification.verification_method === "iris" ||
                    detail.latestVerification.eye_name ||
                    detail.latestVerification.iris_match_score != null ||
                    detail.latestVerification.iris_image ||
                    detail.latestVerification.iris_image_url) && (
                    <div className="rounded-lg bg-cyan-50 border border-cyan-100 p-3 space-y-2">
                      <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">
                        Iris Verification
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {detail.latestVerification.iris_match_score != null && (
                          <div>
                            <p className="text-xs text-cyan-600">Match Score</p>
                            <p
                              className={`text-base ${scoreColor(detail.latestVerification.iris_match_score)}`}
                            >
                              {fmtScore(
                                detail.latestVerification.iris_match_score,
                              )}
                            </p>
                          </div>
                        )}
                        {detail.latestVerification.iris_quality != null && (
                          <div>
                            <p className="text-xs text-cyan-600">Quality</p>
                            <p
                              className={`text-base ${scoreColor(detail.latestVerification.iris_quality)}`}
                            >
                              {fmtScore(detail.latestVerification.iris_quality)}
                            </p>
                          </div>
                        )}
                        {detail.latestVerification.eye_name && (
                          <div>
                            <p className="text-xs text-cyan-600">Eye Used</p>
                            <p className="text-sm font-medium capitalize">
                              {detail.latestVerification.eye_name.replace(
                                /_/g,
                                " ",
                              )}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-cyan-600">Iris Data</p>
                          <p className="text-sm font-medium">
                            {detail.latestVerification.iris_vector
                              ? "Captured ✓"
                              : "—"}
                          </p>
                        </div>
                      </div>
                      {(detail.latestVerification.iris_image ||
                        detail.latestVerification.iris_image_url) && (
                        <div>
                          <p className="text-xs text-cyan-600 mb-1.5 font-medium">
                            Captured Iris Image
                          </p>
                          {(() => {
                            const raw = (detail.latestVerification
                              .iris_image_url ||
                              detail.latestVerification.iris_image) as string;
                            const src =
                              raw.startsWith("http") || raw.startsWith("data:")
                                ? raw
                                : `data:image/jpeg;base64,${raw}`;
                            return (
                              <img
                                src={src}
                                alt="Captured iris"
                                className="h-28 w-28 mx-auto object-cover rounded-full border-2 border-cyan-200 bg-white shadow"
                              />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── AADHAAR ── */}
                  {(detail.latestVerification.verification_method ===
                    "aadhaar" ||
                    detail.latestVerification.aadhaar_verified != null ||
                    detail.latestVerification.aadhaar_verification_status) && (
                    <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 space-y-2">
                      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                        Aadhaar Verification
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {detail.latestVerification
                          .aadhaar_verification_status && (
                          <div>
                            <p className="text-xs text-orange-600">Status</p>
                            <p className="text-sm font-medium capitalize">
                              {
                                detail.latestVerification
                                  .aadhaar_verification_status
                              }
                            </p>
                          </div>
                        )}
                        {detail.latestVerification.aadhaar_verified != null && (
                          <div>
                            <p className="text-xs text-orange-600">Verified</p>
                            <p className="text-sm font-medium">
                              {detail.latestVerification.aadhaar_verified
                                ? "Yes ✓"
                                : "No"}
                            </p>
                          </div>
                        )}
                        {detail.latestVerification.aadhaar_number_masked && (
                          <div className="col-span-2">
                            <p className="text-xs text-orange-600">
                              Aadhaar (Masked)
                            </p>
                            <p className="text-sm font-mono">
                              {detail.latestVerification.aadhaar_number_masked}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">
                  No verification record yet
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ManagerCandidatesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const centreId = searchParams.get("centreId") || undefined;
  const centreName = searchParams.get("centreName") || undefined;
  const city = searchParams.get("city") || undefined;
  const urlShiftId = searchParams.get("shiftId") || undefined;
  const shiftName = searchParams.get("shiftName") || undefined;
  const initialStatus = searchParams.get("status") || "all";

  // Shift filter: use URL param if present (came from drill-down), else use dropdown state
  const [selectedShiftId, setSelectedShiftId] = useState<string | undefined>(
    undefined,
  );
  const effectiveShiftId = urlShiftId || selectedShiftId;
  const shiftId = urlShiftId; // keep old var for table column hiding

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      if (centreId && effectiveShiftId) {
        const { getManagerCandidatesByShift } =
          await import("@/app/actions/supabase-actions");
        const data = await getManagerCandidatesByShift(
          centreId,
          effectiveShiftId,
        );
        setCandidates(data || []);
      } else {
        const { getManagerCandidates } =
          await import("@/app/actions/supabase-actions");
        const data = await getManagerCandidates(
          centreId,
          city,
          effectiveShiftId,
        );
        setCandidates(data || []);
      }
    } catch (err) {
      console.error("Error loading candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [centreId, effectiveShiftId, city]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleSort = (col: SortKey) => {
    if (sortKey === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("asc");
    }
  };

  // Filter
  const filtered = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.full_name.toLowerCase().includes(q) ||
      c.roll_number.toLowerCase().includes(q) ||
      c.centre_name.toLowerCase().includes(q) ||
      (c.father_name?.toLowerCase().includes(q) ?? false) ||
      (c.shift_name?.toLowerCase().includes(q) ?? false);
    const matchesStatus =
      statusFilter === "all" || c.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = String(a[sortKey as keyof Candidate] || "");
    const bVal = String(b[sortKey as keyof Candidate] || "");
    return sortDir === "asc"
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

  const stats = {
    total: candidates.length,
    verified: candidates.filter((c) => c.verification_status === "verified")
      .length,
    pending: candidates.filter((c) => c.verification_status === "pending")
      .length,
    absent: candidates.filter((c) => c.verification_status === "absent").length,
  };

  // Breadcrumb
  const buildBreadcrumb = () => {
    const parts: { label: string; href?: string }[] = [
      { label: "Dashboard", href: "/manager/dashboard" },
    ];
    if (centreName) {
      parts.push({ label: "Centres", href: "/manager/centres" });
      parts.push({
        label: centreName,
        href: centreId ? `/manager/centres/${centreId}` : undefined,
      });
      if (shiftName) parts.push({ label: shiftName });
      else parts.push({ label: "Candidates" });
    } else if (city) {
      parts.push({ label: `City: ${city}` });
    } else {
      parts.push({ label: "All Candidates" });
    }
    return parts;
  };

  const breadcrumbs = buildBreadcrumb();
  const pageTitle = shiftName
    ? `Candidates — ${shiftName}`
    : centreName
      ? `Candidates — ${centreName}`
      : city
        ? `Candidates — ${city}`
        : "All Candidates";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
        <p className="mt-4 text-gray-600">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm flex-wrap">
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            {b.href ? (
              <button
                onClick={() => router.push(b.href as any)}
                className="text-indigo-600 hover:underline"
              >
                {b.label}
              </button>
            ) : (
              <span className="text-gray-700 font-medium">{b.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 text-sm">
            Click column headers to sort · Click candidate to view details
          </p>
        </div>
        {/* Show shift dropdown only when not already filtered via URL (e.g. centre drill-down) */}
        {!urlShiftId && (
          <ShiftFilterBar
            selectedShiftId={selectedShiftId}
            onShiftChange={(id) => setSelectedShiftId(id)}
          />
        )}
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Total",
            count: stats.total,
            colorClass: "border-blue-500 bg-blue-50 text-blue-700",
            filter: "all",
          },
          {
            label: "Verified",
            count: stats.verified,
            colorClass: "border-green-500 bg-green-50 text-green-700",
            filter: "verified",
          },
          {
            label: "Pending",
            count: stats.pending,
            colorClass: "border-amber-500 bg-amber-50 text-amber-700",
            filter: "pending",
          },
          {
            label: "Absent",
            count: stats.absent,
            colorClass: "border-red-500 bg-red-50 text-red-700",
            filter: "absent",
          },
        ].map(({ label, count, colorClass, filter }) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              statusFilter === filter
                ? colorClass
                : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
            }`}
          >
            <p className="text-xs uppercase tracking-wide opacity-70">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, roll number, centre, shift..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-indigo-600" />
            {sorted.length} of {candidates.length} candidates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">
                {searchQuery
                  ? "No matching candidates found"
                  : "No candidates found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead
                    col="roll_number"
                    label="Roll No"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    col="full_name"
                    label="Name"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    col="father_name"
                    label="Father's Name"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    col="centre_name"
                    label="Centre"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  {!shiftId && (
                    <SortableHead
                      col="shift_name"
                      label="Shift"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  )}
                  <SortableHead
                    col="city"
                    label="City"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    col="exam_code"
                    label="Exam"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    col="verification_status"
                    label="Status"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    className="cursor-pointer hover:bg-indigo-50/50"
                    onClick={() => setSelectedCandidateId(candidate.id)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm text-gray-700">
                        {candidate.roll_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {candidate.photo_url ? (
                          <img
                            src={candidate.photo_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-indigo-600">
                              {candidate.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <p className="font-medium text-gray-900 whitespace-nowrap">
                          {candidate.full_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                      {candidate.father_name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-700 whitespace-nowrap">
                        <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        {candidate.centre_name}
                      </div>
                    </TableCell>
                    {!shiftId && (
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {candidate.shift_name || "—"}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {candidate.city || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-600">
                        <p className="font-medium">{candidate.exam_code}</p>
                        <p
                          className="text-gray-400 truncate max-w-[100px]"
                          title={candidate.exam_name}
                        >
                          {candidate.exam_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={candidate.verification_status} />
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => setSelectedCandidateId(candidate.id)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedCandidateId && (
        <CandidateDetailModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
        />
      )}
    </div>
  );
}
