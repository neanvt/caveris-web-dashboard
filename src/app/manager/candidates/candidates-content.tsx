"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
        <CheckCircle className="mr-1 h-3 w-3" />Verified
      </Badge>
    );
  }
  if (status === "absent") {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="mr-1 h-3 w-3" />Absent
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
      <Clock className="mr-1 h-3 w-3" />Pending
    </Badge>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-300 inline" />;
  return sortDir === "asc"
    ? <ArrowUp className="ml-1 h-3 w-3 text-indigo-600 inline" />
    : <ArrowDown className="ml-1 h-3 w-3 text-indigo-600 inline" />;
}

function SortableHead({ col, label, sortKey, sortDir, onSort }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
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

function CandidateDetailModal({ candidateId, onClose }: { candidateId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const { getManagerCandidateDetail } = await import("@/app/actions/supabase-actions");
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
                <h2 className="text-xl font-bold text-gray-900">{detail.full_name}</h2>
                {detail.father_name && (
                  <p className="text-sm text-gray-600">S/D/W of {detail.father_name}</p>
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
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                <p className="mt-0.5 text-sm font-medium">
                  {detail.date_of_birth ? new Date(detail.date_of_birth).toLocaleDateString("en-IN") : "—"}
                </p>
              </div>
              {detail.aadhaar_number && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Aadhaar</p>
                  <p className="mt-0.5 text-sm font-medium">{detail.aadhaar_number}</p>
                </div>
              )}
              {detail.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="mt-0.5 text-sm font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />{detail.phone}
                  </p>
                </div>
              )}
              {detail.email && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="mt-0.5 text-sm font-medium flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />{detail.email}
                  </p>
                </div>
              )}
              {detail.address && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
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
                {detail.exam_code && <p className="text-xs text-gray-400">{detail.exam_code}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Centre
                </p>
                <p className="mt-0.5 text-sm font-medium">{detail.centre_name}</p>
                {detail.city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />{detail.city}
                  </p>
                )}
              </div>
            </div>

            {/* Verification Record */}
            {detail.latestVerification ? (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5 mb-3">
                  <Fingerprint className="h-4 w-4" />
                  Latest Verification Record
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-700">Result</p>
                    <p className="text-sm font-medium capitalize">
                      {detail.latestVerification.verification_result || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Date & Time</p>
                    <p className="text-sm font-medium">
                      {detail.latestVerification.created_at
                        ? new Date(detail.latestVerification.created_at).toLocaleString("en-IN")
                        : "—"}
                    </p>
                  </div>
                  {detail.latestVerification.face_match_score != null && (
                    <div>
                      <p className="text-xs text-green-700">Face Match Score</p>
                      <p className="text-sm font-medium">
                        {(detail.latestVerification.face_match_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {detail.latestVerification.fingerprint_match_score != null && (
                    <div>
                      <p className="text-xs text-green-700">Fingerprint Score</p>
                      <p className="text-sm font-medium">
                        {(detail.latestVerification.fingerprint_match_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {detail.latestVerification.verifier_id && (
                    <div>
                      <p className="text-xs text-green-700">Verified By</p>
                      <p className="text-sm font-medium font-mono">
                        {detail.latestVerification.verifier_id}
                      </p>
                    </div>
                  )}
                  {detail.latestVerification.device_id && (
                    <div>
                      <p className="text-xs text-green-700">Device</p>
                      <p className="text-sm font-medium">{detail.latestVerification.device_id}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">No verification record yet</p>
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
  const shiftId = searchParams.get("shiftId") || undefined;
  const shiftName = searchParams.get("shiftName") || undefined;
  const initialStatus = searchParams.get("status") || "all";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      if (centreId && shiftId) {
        const { getManagerCandidatesByShift } = await import("@/app/actions/supabase-actions");
        const data = await getManagerCandidatesByShift(centreId, shiftId);
        setCandidates(data || []);
      } else {
        const { getManagerCandidates } = await import("@/app/actions/supabase-actions");
        const data = await getManagerCandidates(centreId, city);
        setCandidates(data || []);
      }
    } catch (err) {
      console.error("Error loading candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [centreId, shiftId, city]);

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
    const matchesStatus = statusFilter === "all" || c.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = String(a[sortKey as keyof Candidate] || "");
    const bVal = String(b[sortKey as keyof Candidate] || "");
    return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const stats = {
    total: candidates.length,
    verified: candidates.filter((c) => c.verification_status === "verified").length,
    pending: candidates.filter((c) => c.verification_status === "pending").length,
    absent: candidates.filter((c) => c.verification_status === "absent").length,
  };

  // Breadcrumb
  const buildBreadcrumb = () => {
    const parts: { label: string; href?: string }[] = [
      { label: "Dashboard", href: "/manager/dashboard" },
    ];
    if (centreName) {
      parts.push({ label: "Centres", href: "/manager/centres" });
      parts.push({ label: centreName, href: centreId ? `/manager/centres/${centreId}` : undefined });
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

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="text-gray-600">Click column headers to sort · Click candidate to view details</p>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total", count: stats.total, colorClass: "border-blue-500 bg-blue-50 text-blue-700", filter: "all" },
          { label: "Verified", count: stats.verified, colorClass: "border-green-500 bg-green-50 text-green-700", filter: "verified" },
          { label: "Pending", count: stats.pending, colorClass: "border-amber-500 bg-amber-50 text-amber-700", filter: "pending" },
          { label: "Absent", count: stats.absent, colorClass: "border-red-500 bg-red-50 text-red-700", filter: "absent" },
        ].map(({ label, count, colorClass, filter }) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              statusFilter === filter ? colorClass : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
            }`}
          >
            <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
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
                {searchQuery ? "No matching candidates found" : "No candidates found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead col="roll_number" label="Roll No" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHead col="full_name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHead col="father_name" label="Father's Name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHead col="centre_name" label="Centre" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  {!shiftId && (
                    <SortableHead col="shift_name" label="Shift" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  )}
                  <SortableHead col="city" label="City" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHead col="exam_code" label="Exam" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHead col="verification_status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
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
                      <span className="font-mono text-sm text-gray-700">{candidate.roll_number}</span>
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
                        <p className="font-medium text-gray-900 whitespace-nowrap">{candidate.full_name}</p>
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
                        <p className="text-gray-400 truncate max-w-[100px]" title={candidate.exam_name}>
                          {candidate.exam_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={candidate.verification_status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
