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
  ArrowLeft,
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
  Calendar,
  Fingerprint,
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
  exam_id: string;
  centre_name: string;
  city: string;
  exam_name: string;
  exam_code: string;
}

interface CandidateDetail extends Candidate {
  centre_code: string;
  centre_address: string;
  latestVerification: any;
}

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
        const { getManagerCandidateDetail } = await import(
          "@/app/actions/supabase-actions"
        );
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
            <p className="mt-3 text-gray-600">Loading candidate details...</p>
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
                    className="h-24 w-24 rounded-lg object-cover border-2 border-indigo-100"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <User className="h-12 w-12 text-indigo-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{detail.full_name}</h2>
                {detail.father_name && (
                  <p className="text-sm text-gray-600">S/D/W of {detail.father_name}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={detail.verification_status} />
                  {detail.verification_attempts > 0 && (
                    <span className="text-xs text-gray-500">
                      {detail.verification_attempts} attempt(s)
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    <FileText className="h-3.5 w-3.5" />
                    Roll No: {detail.roll_number}
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-gray-50">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900">
                  {detail.date_of_birth
                    ? new Date(detail.date_of_birth).toLocaleDateString("en-IN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 capitalize">
                  {detail.gender || "—"}
                </p>
              </div>
              {detail.aadhaar_number && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Aadhaar</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">
                    {detail.aadhaar_number}
                  </p>
                </div>
              )}
              {detail.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {detail.phone}
                  </p>
                </div>
              )}
              {detail.email && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {detail.email}
                  </p>
                </div>
              )}
              {detail.address && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{detail.address}</p>
                </div>
              )}
            </div>

            {/* Exam & Centre Info */}
            <div className="grid grid-cols-2 gap-4 border rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Exam
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900">{detail.exam_name}</p>
                {detail.exam_code && (
                  <p className="text-xs text-gray-500">{detail.exam_code}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Centre
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900">{detail.centre_name}</p>
                {detail.city && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {detail.city}
                  </p>
                )}
              </div>
            </div>

            {/* Latest Verification */}
            {detail.latestVerification && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5 mb-2">
                  <Fingerprint className="h-4 w-4" />
                  Last Verification Record
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-700">Result</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {detail.latestVerification.verification_result || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {detail.latestVerification.created_at
                        ? new Date(detail.latestVerification.created_at).toLocaleString("en-IN")
                        : "—"}
                    </p>
                  </div>
                  {detail.latestVerification.face_match_score != null && (
                    <div>
                      <p className="text-xs text-green-700">Face Match Score</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(detail.latestVerification.face_match_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
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

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const { getManagerCandidates } = await import("@/app/actions/supabase-actions");
      const data = await getManagerCandidates(centreId, city);
      setCandidates(data || []);
    } catch (err) {
      console.error("Error loading candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [centreId, city]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // Build page title
  const pageTitle = centreName
    ? `Candidates — ${centreName}`
    : city
    ? `Candidates — ${city}`
    : "All Candidates";

  const breadcrumb = centreName
    ? `Centre: ${centreName}`
    : city
    ? `City: ${city}`
    : "All Centres";

  // Filter candidates
  const filtered = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.full_name.toLowerCase().includes(q) ||
      c.roll_number.toLowerCase().includes(q) ||
      c.centre_name.toLowerCase().includes(q) ||
      (c.father_name?.toLowerCase().includes(q) ?? false);
    const matchesStatus =
      statusFilter === "all" || c.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: candidates.length,
    verified: candidates.filter((c) => c.verification_status === "verified").length,
    pending: candidates.filter((c) => c.verification_status === "pending").length,
    absent: candidates.filter((c) => c.verification_status === "absent").length,
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/manager/dashboard" as any)}
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Dashboard
        </Button>
        <div className="text-sm text-gray-500">/</div>
        <div className="text-sm text-gray-700 font-medium">{breadcrumb}</div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="text-gray-600">Detailed candidate list with verification status</p>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total", count: stats.total, color: "blue", filter: "all" },
          { label: "Verified", count: stats.verified, color: "green", filter: "verified" },
          { label: "Pending", count: stats.pending, color: "amber", filter: "pending" },
          { label: "Absent", count: stats.absent, color: "red", filter: "absent" },
        ].map(({ label, count, color, filter }) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              statusFilter === filter
                ? `border-${color}-500 bg-${color}-50`
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, roll number, or centre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Candidates Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-indigo-600" />
            {filtered.length} of {candidates.length} candidates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
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
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Father's Name</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((candidate) => (
                  <TableRow key={candidate.id}>
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
                        <p className="font-medium text-gray-900">{candidate.full_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {candidate.father_name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        {candidate.centre_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {candidate.city || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-600">
                        <p className="font-medium">{candidate.exam_code}</p>
                        <p className="text-gray-400 truncate max-w-[120px]" title={candidate.exam_name}>
                          {candidate.exam_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={candidate.verification_status} />
                    </TableCell>
                    <TableCell className="text-right">
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

      {/* Candidate Detail Modal */}
      {selectedCandidateId && (
        <CandidateDetailModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
        />
      )}
    </div>
  );
}
