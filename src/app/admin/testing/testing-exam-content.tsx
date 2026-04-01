"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FlaskConical,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Eye as EyeIcon,
  Scan,
  CreditCard,
  AlertTriangle,
  Activity,
} from "lucide-react";


// ─── Types ────────────────────────────────────────────────────────────────────
interface TestingCandidate {
  id: string;
  roll_number: string;
  full_name: string;
  father_name?: string;
  verification_status: string;
  verification_attempts: number;
  centre_id?: string;
  shift_id?: string;
  created_at: string;
  // Stored biometrics
  photo_url?: string | null;
  fingerprint_image_url?: string | null;
  iris_image_url?: string | null;
  fingerprint_template?: string | null;
  iris_vector?: string | null;
}

interface TestingVerification {
  id: string;
  candidate_id: string;
  verifier_id?: string;
  verifier_name?: string;
  verification_method: string;
  verification_result: string;
  verification_percentage?: number;
  confidence_score?: number;
  created_at: string;
  candidate_roll_no?: string;
  candidate_name?: string;
  finger_name?: string;
  eye_name?: string;
  is_testing_mode?: boolean;
  aadhaar_verified?: boolean;
  // Captured biometrics — real column names from verifications table
  captured_photo?: string | null;
  captured_photo_url?: string | null;
  photo_captured_url?: string | null;         // alternate column name
  captured_fingerprint_image?: string | null;
  fingerprint_image_url?: string | null;
  iris_image?: string | null;
  iris_image_url?: string | null;
  // Remarks field — format: "Face: 19% | FP: 83% | Aadhaar: false | IRIS: LEFT"
  remarks?: string | null;
}

interface TestingExam {
  id: string;
  exam_name: string;
  exam_code: string;
  status: string;
  start_date?: string;
  end_date?: string;
}

// ─── Image resolver ───────────────────────────────────────────────────────────
// IMPORTANT: /9j/4AAQ... is base64 JPEG but also starts with "/" — so we MUST
// check for base64 signatures BEFORE checking for URL paths.
function resolveImageSrc(val: string | null | undefined): string | null {
  if (!val) return null;
  // 1. Base64 JPEG/PNG/GIF — check FIRST because /9j/ starts with "/" and would
  //    otherwise match the URL check below
  if (val.startsWith("/9j/") || val.startsWith("iVBOR") || val.startsWith("R0lGO"))
    return `data:image/jpeg;base64,${val}`;
  // 2. Already a data URI
  if (val.startsWith("data:image")) return val;
  // 3. Real HTTP(S) URL or relative path
  if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/"))
    return val;
  // 4. Postgres hex bytea (\x...) — cannot display inline
  if (val.startsWith("\\x")) return null;
  // 5. Fallback: try as raw base64
  return `data:image/jpeg;base64,${val}`;
}

// ─── Remarks parser ──────────────────────────────────────────────────────────
// Parses "Face: 19% | FP: 83% | Aadhaar: false | IRIS: LEFT" into per-method scores
function parseRemarks(remarks: string | null | undefined) {
  if (!remarks) return { face: null, fp: null };
  const faceMatch = remarks.match(/Face:\s*(\d+)%/i);
  const fpMatch = remarks.match(/FP:\s*(\d+)%/i);
  return {
    face: faceMatch ? parseInt(faceMatch[1]) : null,
    fp: fpMatch ? parseInt(fpMatch[1]) : null,
  };
}


function BiometricThumb({
  src,
  label,
  color,
}: {
  src: string | null | undefined;
  label: string;
  color: string;
}) {
  const resolved = resolveImageSrc(src);
  const [errored, setErrored] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>
        {label}
      </p>
      <div className="relative h-24 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        {resolved && !errored ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolved}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="h-full w-full rounded-xl bg-gray-100" />
        )}
      </div>
    </div>
  );
}

// ─── Match score pill ─────────────────────────────────────────────────────────
function MatchScore({ pct, result }: { pct?: number | null; result: string }) {
  const score = pct != null ? Math.round(pct) : null;
  const isOk = result?.toLowerCase() === "success";
  const colorClass = isOk
    ? "from-green-400 to-emerald-500 text-white"
    : score != null && score >= 60
    ? "from-yellow-400 to-orange-400 text-white"
    : "from-red-400 to-rose-500 text-white";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${colorClass} shadow-md`}>
        <span className="text-sm font-bold">
          {score != null ? `${score}%` : isOk ? "✓" : "✗"}
        </span>
      </div>
      <span className={`text-[10px] font-semibold uppercase ${isOk ? "text-green-600" : "text-red-500"}`}>
        {isOk ? "Match" : "No Match"}
      </span>
    </div>
  );
}


// ─── Standalone card for one biometric type ───────────────────────────────────

function BiometricTypeCard({
  title, titleColor,
  enrolledSrc, capturedSrc,
  score, result, isActive,
}: {
  title: string; titleColor: string;
  enrolledSrc: string | null | undefined;
  capturedSrc: string | null | undefined;
  score?: number | null; result?: string | null; isActive: boolean;
}) {
  return (
    <div className={`flex flex-1 flex-col justify-center rounded-2xl border bg-white p-4 shadow-sm transition-all ${
      isActive ? "ring-2 ring-indigo-200 bg-indigo-50/10" : "bg-gray-50/30"
    }`}>
      <div className="flex items-center justify-between gap-3">
        {/* Enrolled */}
        <div className="flex flex-1 flex-col items-center">
          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">Enrolled</span>
          <BiometricThumb src={enrolledSrc} label={title} color={titleColor} />
        </div>

        {/* Score */}
        <div className="flex shrink-0 flex-col items-center justify-center pt-4">
          {score != null || (isActive && result) ? (
            <MatchScore pct={score ?? null} result={result ?? ""} />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-gray-200 text-xs text-gray-300">—</div>
          )}
        </div>

        {/* Captured */}
        <div className="flex flex-1 flex-col items-center">
          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-green-500">Captured</span>
          <BiometricThumb src={capturedSrc} label={title} color={titleColor} />
        </div>
      </div>
    </div>
  );
}



// ─── Candidate row ────────────────────────────────────────────────────────────
function CandidateRow({
  candidate,
  verifications,
}: {
  candidate: TestingCandidate;
  verifications: TestingVerification[];
}) {
  const [expanded, setExpanded] = useState(false);
  const cvs = verifications.filter((v) => v.candidate_id === candidate.id);
  const latestSuccess = cvs.find(
    (v) => v.verification_result?.toLowerCase() === "success"
  );

  const hasStoredFP = !!candidate.fingerprint_image_url || !!candidate.fingerprint_template;
  const hasStoredIris = !!candidate.iris_image_url || !!candidate.iris_vector;


  return (
    <>
      {/* Summary row */}
      <tr className={`border-b transition-colors hover:bg-gray-50 ${expanded ? "bg-indigo-50/40" : ""}`}>
        <td className="px-4 py-3">
          <button
            onClick={() => setExpanded((p) => !p)}
            disabled={cvs.length === 0}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px]">
              {cvs.length}
            </span>
          </button>
        </td>

        {/* Stored biometric thumbnails */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <StoredThumbMini src={candidate.photo_url} icon={<Scan className="h-3 w-3" />} color="blue" title="Photo" />
            <StoredThumbMini src={candidate.fingerprint_image_url || (hasStoredFP ? "template" : null)} icon={<Fingerprint className="h-3 w-3" />} color="indigo" title="Fingerprint" />
            <StoredThumbMini src={candidate.iris_image_url || (hasStoredIris ? "vector" : null)} icon={<EyeIcon className="h-3 w-3" />} color="purple" title="Iris" />
          </div>
        </td>

        <td className="px-4 py-3 font-mono text-sm text-gray-700">{candidate.roll_number}</td>
        <td className="px-4 py-3">
          <p className="font-medium text-gray-900">{candidate.full_name}</p>
          {candidate.father_name && (
            <p className="text-xs text-gray-400">S/o {candidate.father_name}</p>
          )}
        </td>
        <td className="px-4 py-3"><StatusPill status={candidate.verification_status} /></td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {latestSuccess
            ? new Date(latestSuccess.created_at).toLocaleString("en-IN", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
              })
            : "—"}
        </td>
      </tr>

      {/* Expanded: 3 biometric type cards from latest verification */}
      {expanded && (
        <tr className="border-b bg-gradient-to-b from-indigo-50/30 to-white">
          <td colSpan={6} className="px-4 py-4">
            {cvs.length === 0 ? (
              <p className="text-center text-sm text-gray-400">No verification attempts yet.</p>
            ) : (() => {
              const v = cvs[0]; // latest verification
              const method = v.verification_method?.toLowerCase();
              const score = v.verification_percentage ?? v.confidence_score;
              const result = v.verification_result;
              const { face: faceScore, fp: fpScore } = parseRemarks(v.remarks);
              return (
                <div>
                  {/* Shared header: method + date + verifier */}
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <MethodIcon method={method} />
                      <span className="text-sm font-semibold capitalize text-gray-700">
                        {method === "face" ? "Face Scan" : method === "fingerprint" ? `Fingerprint${v.finger_name ? ` (${v.finger_name})` : ""}` : method === "iris" ? `Iris${v.eye_name ? ` (${v.eye_name})` : ""}` : method}
                      </span>
                      {v.aadhaar_verified != null && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${v.aadhaar_verified ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}>
                          Aadhaar {v.aadhaar_verified ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      {v.verifier_name && <span>by <span className="font-medium text-gray-600">{v.verifier_name}</span></span>}
                      <span>{new Date(v.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  {/* 3 biometric type cards in a row */}
                  <div className="flex gap-4">
                    <BiometricTypeCard
                      title="Face" titleColor="text-blue-600"
                      enrolledSrc={candidate.photo_url}
                      capturedSrc={v.captured_photo || v.captured_photo_url || v.photo_captured_url}
                      score={faceScore ?? (method === "face" ? score : null)}
                      result={method === "face" ? result : null}
                      isActive={method === "face"}
                    />
                    <BiometricTypeCard
                      title="Fingerprint" titleColor="text-indigo-600"
                      enrolledSrc={candidate.fingerprint_image_url}
                      capturedSrc={v.captured_fingerprint_image || v.fingerprint_image_url}
                      score={fpScore ?? (method === "fingerprint" ? score : null)}
                      result={method === "fingerprint" ? result : null}
                      isActive={method === "fingerprint"}
                    />
                    <BiometricTypeCard
                      title="IRIS" titleColor="text-purple-600"
                      enrolledSrc={candidate.iris_image_url}
                      capturedSrc={v.iris_image || v.iris_image_url}
                      score={method === "iris" ? score : null}
                      result={method === "iris" ? result : null}
                      isActive={method === "iris"}
                    />
                  </div>
                </div>
              );
            })()}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Mini stored thumb (table cell) ──────────────────────────────────────────
function StoredThumbMini({
  src,
  icon,
  color,
  title,
}: {
  src: string | null | undefined;
  icon: React.ReactNode;
  color: "blue" | "indigo" | "purple";
  title: string;
}) {
  const resolved = resolveImageSrc(src === "template" || src === "vector" ? null : src);
  const [errored, setErrored] = useState(false);
  const hasData = !!src; // true if URL or template/vector exists
  const colorMap = {
    blue: "ring-blue-300 bg-blue-50",
    indigo: "ring-indigo-300 bg-indigo-50",
    purple: "ring-purple-300 bg-purple-50",
  };
  const iconColorMap = {
    blue: "text-blue-400",
    indigo: "text-indigo-400",
    purple: "text-purple-400",
  };

  return (
    <div title={title} className={`relative h-10 w-10 overflow-hidden rounded-lg ring-1 ${hasData ? colorMap[color] : "ring-gray-200 bg-gray-50"}`}>
      {resolved && !errored && hasData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center ${hasData ? iconColorMap[color] : "text-gray-200"}`}>
          {icon}
        </div>
      )}
      {/* Enrollment dot */}
      <span className={`absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${hasData ? `bg-${color}-500` : "bg-gray-300"}`} />
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const cfg: Record<string, string> = {
    verified: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    absent: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cfg[s] ?? "bg-gray-100 text-gray-600"}`}>
      {status || "—"}
    </span>
  );
}

function MethodIcon({ method }: { method: string }) {
  if (method === "fingerprint") return <Fingerprint className="h-4 w-4 text-indigo-500" />;
  if (method === "iris") return <EyeIcon className="h-4 w-4 text-purple-500" />;
  if (method === "face") return <Scan className="h-4 w-4 text-blue-500" />;
  if (method === "aadhaar") return <CreditCard className="h-4 w-4 text-orange-500" />;
  return <Activity className="h-4 w-4 text-gray-400" />;
}

function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="rounded-xl bg-gray-50 p-3">{icon}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TestingExamContent() {
  const [exam, setExam] = useState<TestingExam | null>(null);
  const [candidates, setCandidates] = useState<TestingCandidate[]>([]);
  const [verifications, setVerifications] = useState<TestingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { getTestingExamData } = await import("@/app/actions/supabase-actions");
      const data = await getTestingExamData();
      if (data) {
        setExam(data.exam);
        setCandidates(data.candidates);
        setVerifications(data.verifications);
      }
    } catch (err) {
      console.error("Error loading testing exam data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = candidates.length;
    const verified = candidates.filter((c) => c.verification_status === "verified").length;
    const pending = candidates.filter((c) => c.verification_status === "pending").length;
    const failed = candidates.filter((c) => c.verification_status === "failed").length;
    const totalAttempts = verifications.length;
    const successAttempts = verifications.filter((v) => v.verification_result?.toLowerCase() === "success").length;
    const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
    return { total, verified, pending, failed, totalAttempts, successAttempts, pct };
  }, [candidates, verifications]);

  const methods = useMemo(
    () => [...new Set(verifications.map((v) => v.verification_method).filter(Boolean))],
    [verifications]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return candidates.filter((c) => {
      const matchSearch = !q || c.full_name.toLowerCase().includes(q) || c.roll_number.toLowerCase().includes(q) || (c.father_name ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.verification_status === statusFilter;
      const cvs = verifications.filter((v) => v.candidate_id === c.id);
      const matchMethod = methodFilter === "all" || cvs.some((v) => v.verification_method === methodFilter);
      return matchSearch && matchStatus && matchMethod;
    });
  }, [candidates, verifications, search, statusFilter, methodFilter]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-500">Loading testing exam data…</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="rounded-2xl bg-yellow-50 p-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
          <h2 className="mt-3 text-xl font-semibold text-gray-800">No Testing Exam Found</h2>
          <p className="mt-1 text-sm text-gray-500">Mark an exam as <strong>Testing Exam</strong> from the Exams page to see its data here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <FlaskConical className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Testing Exam Dashboard</h1>
            <p className="text-sm text-gray-500">
              {exam.exam_name}{" "}
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-mono text-indigo-700">{exam.exam_code}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Users className="h-6 w-6 text-indigo-600" />} label="Total" value={stats.total} color="text-indigo-700" />
        <StatCard icon={<CheckCircle className="h-6 w-6 text-green-600" />} label="Verified" value={stats.verified} color="text-green-700" sub={`${stats.pct}% complete`} />
        <StatCard icon={<Clock className="h-6 w-6 text-yellow-500" />} label="Pending" value={stats.pending} color="text-yellow-700" />
        <StatCard icon={<XCircle className="h-6 w-6 text-red-500" />} label="Failed" value={stats.failed} color="text-red-700" />
        <StatCard icon={<Activity className="h-6 w-6 text-purple-500" />} label="Attempts" value={stats.totalAttempts} color="text-purple-700" />
        <StatCard icon={<CheckCircle className="h-6 w-6 text-teal-500" />} label="Successful" value={stats.successAttempts} color="text-teal-700"
          sub={`${stats.totalAttempts > 0 ? Math.round((stats.successAttempts / stats.totalAttempts) * 100) : 0}% pass`} />
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Verification Progress</span>
          <span className="font-semibold text-indigo-600">{stats.verified} / {stats.total} ({stats.pct}%)</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-green-500 transition-all duration-700" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Verified: {stats.verified}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Pending: {stats.pending}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Failed: {stats.failed}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, roll number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="failed">Failed</option>
          <option value="absent">Absent</option>
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="all">All Methods</option>
          {methods.map((m) => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-gray-400">{filtered.length} of {candidates.length} candidates</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white px-4 py-3 text-xs text-gray-500 shadow-sm">
        <span className="font-semibold text-gray-600">Stored biometrics:</span>
        <span className="flex items-center gap-1"><Scan className="h-3.5 w-3.5 text-blue-400" /> Photo</span>
        <span className="flex items-center gap-1"><Fingerprint className="h-3.5 w-3.5 text-indigo-400" /> Fingerprint</span>
        <span className="flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5 text-purple-400" /> Iris</span>
        <span className="ml-2 text-gray-300">|</span>
        <span className="text-gray-400">Click ▾ to expand and see Enrolled vs Captured comparison with match score.</span>
      </div>

      {/* Candidates Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 w-16">Verif.</th>
                <th className="px-3 py-3">Stored Biometrics</th>
                <th className="px-4 py-3">Roll No.</th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Verified</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <Users className="mx-auto mb-2 h-10 w-10 text-gray-200" />
                    {candidates.length === 0 ? "No candidates enrolled in the testing exam yet." : "No candidates match your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((candidate) => (
                  <CandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    verifications={verifications}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
