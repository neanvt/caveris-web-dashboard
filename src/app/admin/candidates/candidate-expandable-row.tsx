"use client";

import { useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Eye as EyeIcon,
  Scan,
  CreditCard,
  Activity,
  Edit,
  Eye,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeVerificationBiometricScores } from "@/lib/api/verification-api";

export function resolveImageSrc(val: string | null | undefined): string | null {
  if (!val || val === "template" || val === "vector") return null;

  if (val.startsWith("data:image")) return val;
  if (val.startsWith("\\x")) return null;

  // Handle raw ISO/ANSI FMR templates (start with "FMR " -> Rk1SAC...)
  if (val.startsWith("Rk1SAC")) return null;

  // MUST check base64 headers BEFORE checking for "/" because JPEGs start with "/9j/"
  if (val.startsWith("/9j/")) return `data:image/jpeg;base64,${val}`;
  if (val.startsWith("iVBOR")) return `data:image/png;base64,${val}`;
  if (val.startsWith("R0lGO")) return `data:image/gif;base64,${val}`;
  if (val.startsWith("Qk0")) return `data:image/bmp;base64,${val}`; // BMP

  if (
    val.startsWith("http://") ||
    val.startsWith("https://") ||
    val.startsWith("/")
  )
    return val;

  return `data:image/jpeg;base64,${val}`; // Fallback assuming JPEG
}

export function parseRemarks(remarks: string | null | undefined) {
  if (!remarks) return { face: null, fpCaptured: false, irisCaptured: false };
  const faceMatch = remarks.match(/Face:\s*(\d+)%/i);
  const fpMatch = remarks.match(/FP:\s*(\d+)%/i);
  const irisMatch = remarks.match(/IRIS:\s*([A-Za-z]+)/i);
  return {
    face: faceMatch ? parseInt(faceMatch[1]) : null,
    fpCaptured: fpMatch ? parseInt(fpMatch[1]) > 0 : false,
    irisCaptured:
      irisMatch && irisMatch[1].toLowerCase() !== "n/a" ? true : false,
  };
}

export function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const cfg: Record<string, string> = {
    verified: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    absent: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cfg[s] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status || "—"}
    </span>
  );
}

export function MethodIcon({ method }: { method: string }) {
  if (method === "fingerprint")
    return <Fingerprint className="h-4 w-4 text-indigo-500" />;
  if (method === "iris") return <EyeIcon className="h-4 w-4 text-purple-500" />;
  if (method === "face") return <Scan className="h-4 w-4 text-blue-500" />;
  if (method === "aadhaar")
    return <CreditCard className="h-4 w-4 text-orange-500" />;
  return <Activity className="h-4 w-4 text-gray-400" />;
}

export function BiometricThumb({
  src,
  label,
  color,
  fallbackIcon,
}: {
  src: string | null | undefined;
  label: string;
  color: string;
  fallbackIcon?: React.ReactNode;
}) {
  const resolved = resolveImageSrc(src);
  const [errored, setErrored] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}
      >
        {label}
      </p>
      <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        {resolved && !errored ? (
          <img
            src={resolved}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            {fallbackIcon || <Activity className="h-8 w-8" />}
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchScore({
  pct,
  result,
  isStatusOnly = false,
  captured = false,
}: {
  pct?: number | null;
  result: string;
  isStatusOnly?: boolean;
  captured?: boolean;
}) {
  const score = pct != null ? Math.round(pct) : null;
  const isOk = result?.toLowerCase() === "success";

  if (isStatusOnly) {
    if (captured) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 text-white shadow-md">
            <CheckCircle className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-semibold uppercase text-indigo-600">
            Captured
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md">
          <span className="text-xl font-bold">—</span>
        </div>
        <span className="text-[10px] font-semibold uppercase text-gray-500">
          Missing
        </span>
      </div>
    );
  }

  const colorClass = isOk
    ? "from-green-400 to-emerald-500 text-white"
    : score != null && score >= 60
      ? "from-yellow-400 to-orange-400 text-white"
      : "from-red-400 to-rose-500 text-white";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${colorClass} shadow-md`}
      >
        <span className="text-sm font-bold">
          {score != null ? `${score}%` : isOk ? "✓" : "✗"}
        </span>
      </div>
      <span
        className={`text-[10px] font-semibold uppercase ${isOk ? "text-green-600" : "text-red-500"}`}
      >
        {isOk ? "Match" : "No Match"}
      </span>
    </div>
  );
}

export function BiometricTypeCard({
  title,
  titleColor,
  enrolledSrc,
  capturedSrc,
  score,
  result,
  isActive,
  isStatusOnly = false,
  captured = false,
}: any) {
  const FallbackIcon =
    title.toLowerCase() === "fingerprint" ? (
      <Fingerprint className="h-8 w-8" />
    ) : title.toLowerCase().includes("iris") ||
      title.toLowerCase().includes("eye") ? (
      <EyeIcon className="h-8 w-8" />
    ) : (
      <Scan className="h-8 w-8" />
    );

  return (
    <div
      className={`flex flex-1 flex-col justify-center rounded-2xl border bg-white p-4 shadow-sm transition-all ${isActive ? "ring-2 ring-indigo-200 bg-indigo-50/10" : "bg-gray-50/30"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col items-center">
          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
            Enrolled
          </span>
          <BiometricThumb
            src={enrolledSrc}
            label={title}
            color={titleColor}
            fallbackIcon={FallbackIcon}
          />
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center pt-4">
          {score != null || (isActive && result) || isStatusOnly ? (
            <MatchScore
              pct={score ?? null}
              result={result ?? ""}
              isStatusOnly={isStatusOnly}
              captured={captured}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-gray-200 text-xs text-gray-300">
              —
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center">
          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-green-500">
            Captured
          </span>
          <BiometricThumb
            src={capturedSrc}
            label={title}
            color={titleColor}
            fallbackIcon={FallbackIcon}
          />
        </div>
      </div>
    </div>
  );
}

export function StoredThumbMini({ src, icon, color, title }: any) {
  const resolved = resolveImageSrc(
    src === "template" || src === "vector" ? null : src,
  );
  const [errored, setErrored] = useState(false);
  const hasData = !!src;
  const colorMap: any = {
    blue: "ring-blue-300 bg-blue-50",
    indigo: "ring-indigo-300 bg-indigo-50",
    purple: "ring-purple-300 bg-purple-50",
  };
  const iconColorMap: any = {
    blue: "text-blue-400",
    indigo: "text-indigo-400",
    purple: "text-purple-400",
  };

  return (
    <div
      title={title}
      className={`relative h-10 w-10 overflow-hidden rounded-lg ring-1 ${hasData ? colorMap[color] : "ring-gray-200 bg-gray-50"}`}
    >
      {resolved && !errored && hasData ? (
        <img
          src={resolved}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center ${hasData ? iconColorMap[color] : "text-gray-200"}`}
        >
          {icon}
        </div>
      )}
      <span
        className={`absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${hasData ? `bg-${color}-500` : "bg-gray-300"}`}
      />
    </div>
  );
}

export function CandidateExpandableRow({
  candidate,
  verifications,
  onView,
  onEdit,
  isTestingExam,
}: {
  candidate: any;
  verifications: any[];
  onView: () => void;
  onEdit: () => void;
  isTestingExam: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  // Live scores override — updated after "Run Match" completes
  const [liveScores, setLiveScores] = useState<{
    fp?: number | null;
    iris?: number | null;
  } | null>(null);

  const cvs =
    verifications?.filter((v) => v.candidate_id === candidate.id) || [];

  const hasStoredFP =
    !!candidate.fingerprint_image_url ||
    !!candidate.fingerprint_image_base64 ||
    !!candidate.fingerprint_template;
  const hasStoredIris =
    !!candidate.iris_image_url ||
    !!candidate.iris_image_base64 ||
    !!candidate.iris_vector;

  const fpEnrolledSrc = candidate.fingerprint_image_url
    ? candidate.fingerprint_image_url
    : candidate.fingerprint_image_base64
      ? `data:image/jpeg;base64,${candidate.fingerprint_image_base64}`
      : hasStoredFP
        ? "template"
        : null;

  const irisEnrolledSrc = candidate.iris_image_url
    ? candidate.iris_image_url
    : candidate.iris_image_base64
      ? `data:image/jpeg;base64,${candidate.iris_image_base64}`
      : hasStoredIris
        ? "vector"
        : null;

  async function handleRunMatch(verificationId: string) {
    setIsMatching(true);
    setMatchError(null);
    try {
      const res = await computeVerificationBiometricScores(verificationId);
      setLiveScores({
        fp: res.fingerprintMatchScore,
        iris: res.irisMatchScore,
      });
    } catch (err: any) {
      setMatchError(err?.message ?? "Match failed");
    } finally {
      setIsMatching(false);
    }
  }

  return (
    <>
      <tr
        className={`border-b transition-colors hover:bg-gray-50 ${expanded ? "bg-indigo-50/40" : ""}`}
      >
        <td className="px-4 py-3">
          <button
            onClick={() => setExpanded((p) => !p)}
            disabled={cvs.length === 0}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px]">
              {cvs.length}
            </span>
          </button>
        </td>

        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <StoredThumbMini
              src={candidate.photo_url}
              icon={<Scan className="h-3 w-3" />}
              color="blue"
              title="Photo"
            />
            <StoredThumbMini
              src={fpEnrolledSrc}
              icon={<Fingerprint className="h-3 w-3" />}
              color="indigo"
              title="Fingerprint"
            />
            <StoredThumbMini
              src={irisEnrolledSrc}
              icon={<EyeIcon className="h-3 w-3" />}
              color="purple"
              title="Iris"
            />
          </div>
        </td>

        <td className="px-4 py-3 font-mono text-sm text-gray-700">
          {candidate.roll_number}
        </td>

        <td className="px-4 py-3">
          <p className="font-medium text-gray-900">{candidate.full_name}</p>
          {candidate.father_name && (
            <p className="text-xs text-gray-400">S/o {candidate.father_name}</p>
          )}
        </td>

        <td className="px-4 py-3 hidden md:table-cell">
          <span className="text-sm text-gray-600">
            {candidate.email || "-"}
          </span>
        </td>

        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="text-sm text-gray-600">
            {candidate.phone || "-"}
          </span>
        </td>

        <td className="px-4 py-3">
          <StatusPill status={candidate.verification_status} />
        </td>

        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="mr-2 h-4 w-4" /> View
            </Button>
            {isTestingExam && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b bg-gradient-to-b from-indigo-50/30 to-white">
          <td colSpan={8} className="px-4 py-4">
            {cvs.length === 0 ? (
              <p className="text-center text-sm text-gray-400">
                No verification attempts yet.
              </p>
            ) : (
              (() => {
                const v = cvs[0];
                const method = v.verification_method?.toLowerCase();
                const score = v.verification_percentage ?? v.confidence_score;
                const result = v.verification_result;
                const parsedRemarks = parseRemarks(v.remarks);
                const faceScore = parsedRemarks.face;

                // Use live scores (post-match) if available, otherwise fall back to DB values
                const fpScore =
                  liveScores?.fp !== undefined
                    ? liveScores.fp
                    : (v.fingerprint_match_score ?? null);
                const irisScore =
                  liveScores?.iris !== undefined
                    ? liveScores.iris
                    : (v.iris_match_score ?? null);
                const hasBiometricData = !!(
                  v.captured_fingerprint_image ||
                  v.captured_fingerprint_vector ||
                  v.iris_image ||
                  v.iris_image_url
                );

                return (
                  <div>
                    <div className="mb-3 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <MethodIcon method={method} />
                        <span className="text-sm font-semibold capitalize text-gray-700">
                          {method === "face"
                            ? "Face Scan"
                            : method === "fingerprint"
                              ? `Fingerprint${v.finger_name ? ` (${v.finger_name})` : ""}`
                              : method === "iris"
                                ? `Iris${v.eye_name ? ` (${v.eye_name})` : ""}`
                                : method}
                        </span>
                        {v.aadhaar_verified != null && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${v.aadhaar_verified ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}
                          >
                            Aadhaar {v.aadhaar_verified ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        {v.verifier_name && (
                          <span>
                            by{" "}
                            <span className="font-medium text-gray-600">
                              {v.verifier_name}
                            </span>
                          </span>
                        )}
                        <span>
                          {new Date(v.created_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <BiometricTypeCard
                        title="Face"
                        titleColor="text-blue-600"
                        enrolledSrc={candidate.photo_url}
                        capturedSrc={
                          v.captured_photo ||
                          v.captured_photo_url ||
                          v.photo_captured_url
                        }
                        score={faceScore ?? (method === "face" ? score : null)}
                        result={method === "face" ? result : null}
                        isActive={method === "face"}
                      />
                      <BiometricTypeCard
                        title="Fingerprint"
                        titleColor="text-indigo-600"
                        enrolledSrc={fpEnrolledSrc}
                        capturedSrc={
                          v.captured_fingerprint_image ||
                          v.fingerprint_image_url
                        }
                        score={fpScore}
                        result={
                          fpScore != null
                            ? fpScore >= 60
                              ? "success"
                              : "failed"
                            : null
                        }
                        isActive={fpScore != null}
                        isStatusOnly={
                          fpScore == null &&
                          !!(
                            v.captured_fingerprint_image ||
                            v.captured_fingerprint_vector
                          )
                        }
                        captured={
                          !!(
                            v.captured_fingerprint_image ||
                            v.captured_fingerprint_vector
                          )
                        }
                      />
                      <BiometricTypeCard
                        title="IRIS"
                        titleColor="text-purple-600"
                        enrolledSrc={irisEnrolledSrc}
                        capturedSrc={v.iris_image || v.iris_image_url}
                        score={irisScore}
                        result={
                          irisScore != null
                            ? irisScore >= 60
                              ? "success"
                              : "failed"
                            : null
                        }
                        isActive={irisScore != null}
                        isStatusOnly={
                          irisScore == null &&
                          !!(v.iris_image || v.iris_image_url)
                        }
                        captured={!!(v.iris_image || v.iris_image_url)}
                      />
                    </div>

                    {/* Run Iris & Fingerprint Match button */}
                    {hasBiometricData && (
                      <div className="mt-3 flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isMatching}
                          onClick={() => handleRunMatch(v.id)}
                          className="text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                        >
                          {isMatching ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{" "}
                              Running Match…
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-3.5 w-3.5" /> Run Iris
                              &amp; Fingerprint Match
                            </>
                          )}
                        </Button>
                        {matchError && (
                          <span className="text-xs text-red-500">
                            {matchError}
                          </span>
                        )}
                        {liveScores && !isMatching && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Match scores updated — FP:{" "}
                            {liveScores.fp ?? "n/a"}% · Iris:{" "}
                            {liveScores.iris ?? "n/a"}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </td>
        </tr>
      )}
    </>
  );
}
