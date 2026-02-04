"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatDateForDisplay, isDateBetween, parseDDMMYYYY } from "@/lib/date-utils";
import { importCandidateRow, bulkImportCandidates } from "@/app/actions/supabase-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileUp,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Candidate {
  id: string;
  roll_number: string;
  full_name: string;
  father_name?: string;
  email?: string;
  phone?: string;
  verification_status: string;
  verification_attempts: number;
  exam_id: string;
  exam_date?: string;
  centre_id?: string;
  shift_id?: string;
  created_at: string;
}

interface Exam {
  id: string;
  exam_name: string;
  exam_code: string;
  exam_date: string;
  start_date: string;
  end_date: string;
}

interface Centre {
  id: string;
  centre_name: string;
  centre_code: string;
  city: string;
}

interface Shift {
  id: string;
  shift_name: string;
  shift_code: string;
}

interface Manager {
  id: string;
  full_name: string;
  email: string;
}

interface Verifier {
  id: string;
  full_name: string;
  email: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

export function CandidatesContent() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [centreFilter, setCentreFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSuccess, setImportSuccess] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [currentProcessingRow, setCurrentProcessingRow] = useState(0);
  const [selectedExamForImport, setSelectedExamForImport] = useState<string>("");
  const [selectedDateForImport, setSelectedDateForImport] = useState<string>("");
  
  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { 
        getExams, 
        getCentres, 
        getShifts, 
        getManagers, 
        getVerifiers, 
        getCandidates 
      } = await import("@/app/actions/supabase-actions");

      // Load all data using server actions
      const [
        examData,
        centreData,
        shiftData,
        managerData,
        verifierData
      ] = await Promise.all([
        getExams(),
        getCentres(),
        getShifts(),
        getManagers(),
        getVerifiers()
      ]);

      setExams(examData);
      setCentres(centreData);
      setShifts(shiftData);
      setManagers(managerData);
      setVerifiers(verifierData);

      console.log('Loaded exams:', examData);
      console.log('Exams count:', examData?.length || 0);

      const examIds = examData?.map((e: any) => e.id) || [];

      if (examIds.length > 0) {
        const candidateData = await getCandidates(examIds);
        setCandidates(candidateData);
      }
    } catch (error) {
      console.error("Error loading candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setImportErrors([]);
    } else {
      alert("Please select a valid CSV file");
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const handleImport = async () => {
    if (!csvFile) return;

    setImporting(true);
    setImportErrors([]);
    setImportSuccess(0);
    setImportTotal(0);

    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        throw new Error("CSV file is empty or invalid");
      }

      const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/\*/g, ''));
      const dataRows = rows.slice(1);
      
      const errors: ImportError[] = [];
      let successCount = 0;

      // Expected headers
      const requiredHeaders = [
        "roll_number", "full_name", "exam_name", "exam_code", "exam_date",
        "exam_start_date", "exam_end_date", "shift_code", "shift_name",
        "gate_open_time", "gate_close_time", "start_time", "end_time",
        "centre_name", "centre_code", "centre_city", "centre_state", "centre_address",
        "centre_contact_person", "centre_phone"
      ];

      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          errors.push({ row: 0, field: required, message: `Missing required column: ${required}` });
        }
      }

      if (errors.length > 0) {
        setImportErrors(errors);
        setImporting(false);
        return;
      }

      const validRows: any[] = [];

      // Validate all rows locally first
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2; 

        // Update UI occasionally during validation too if list is huge
        if (i % 500 === 0) {
             setCurrentProcessingRow(i + 1);
             await new Promise(r => setTimeout(r, 0));
        }

        const candidate: any = {};
        headers.forEach((header, index) => {
          candidate[header] = row[index]?.trim() || "";
        });
        
        // Skip completely empty rows
        if (!Object.values(candidate).some(v => v)) continue;

        // Validation Checks
        let rowHasError = false;

        const mandatoryFields = [
            "roll_number", "full_name", "exam_name", "exam_code", "exam_date", 
            "exam_start_date", "exam_end_date", "shift_code", "shift_name", 
            "gate_open_time", "gate_close_time", "start_time", "end_time",
            "centre_name", "centre_code", "centre_city", "centre_state", "centre_address", 
            "centre_contact_person", "centre_phone"
        ];

        for (const field of mandatoryFields) {
            if (!candidate[field]) {
                errors.push({ row: rowNum, field, message: `${field} is MANDATORY` });
                rowHasError = true;
            }
        }

        if (rowHasError) continue;

        // Basic Format Checks (No conversion, just validation)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
        if (
            candidate.exam_date && !dateRegex.test(candidate.exam_date) ||
            candidate.exam_start_date && !dateRegex.test(candidate.exam_start_date) ||
            candidate.exam_end_date && !dateRegex.test(candidate.exam_end_date)
        ) {
            errors.push({ row: rowNum, field: "dates", message: "Dates must be in YYYY-MM-DD format" });
            continue;
        }

        // Add to valid list
        validRows.push(candidate);
      }

      if (errors.length > 0) {
        setImportErrors(errors);
        setImporting(false);
        return;
      }

      // Start Bulk Import
      setImportTotal(validRows.length);
      const BATCH_SIZE = 200;

      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(validRows.length / BATCH_SIZE);
        
        // Update UI
        setCurrentProcessingRow(Math.min(i + BATCH_SIZE, validRows.length));
        await new Promise(r => setTimeout(r, 0));

        const batch = validRows.slice(i, i + BATCH_SIZE);
        const result = await bulkImportCandidates(batch);

        if (result.error) {
             setImportErrors(prev => [...prev, { row: i, field: "bulk_batch_" + batchNumber, message: result.error || "Unknown batch error" }]);
             // Continue? Or abort? Usually safe to continue if batches are independent, 
             // but if exams/centres are shared it might be messy. 
             // But existing ones are idempotently created.
        } else {
             successCount += (result.count || 0);
             setImportSuccess(successCount);
             // Log duplicates skipped if any
             if (result.duplicates && result.duplicates > 0) {
                console.log(`Batch ${batchNumber}: Skipped ${result.duplicates} duplicate roll numbers (assignments still created)`);
             }
             // Log assignment creations
             if (result.examCentreAssignments) {
                const eca = result.examCentreAssignments;
                console.log(`Batch ${batchNumber}: exam_centre_assignments - ${eca.new} new, ${eca.existing} existing`);
             }
             if (result.centreShiftAssignments) {
                const csa = result.centreShiftAssignments;
                console.log(`Batch ${batchNumber}: centre_shift_assignments - ${csa.new} new, ${csa.existing} existing`);
             }
             // Log debug info
             if (result.debug) {
                console.log(`Batch ${batchNumber} DEBUG:`, JSON.stringify(result.debug, null, 2));
             }
        }
      }

      // Finish
      if (successCount > 0) {
        await loadData();
      }

      if (importErrors.length === 0) { // Check current ref if possible, but state is async. Use successCount vs total.
        setTimeout(() => {
          if (successCount === validRows.length) {
              setShowImportModal(false);
              setCsvFile(null);
          }
        }, 2000);
      }

    } catch (error: any) {
      console.error("Import error:", error);
      setImportErrors([{ row: 0, field: "general", message: error.message || "Import failed" }]);
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    // Find selected exam if one is selected
    const selectedExam = selectedExamForImport
      ? exams.find((e) => e.id === selectedExamForImport)
      : null;

    const headers = [
      // Candidate details
      "roll_number*",
      "full_name*",
      "father_name",
      "date_of_birth",
      "gender",
      "aadhaar_number",
      "address",
      "email",
      "phone",
      "photo_url",
      "exam_date*",
      // Exam details
      "exam_name*",
      "exam_start_date*",
      "exam_end_date*",
      "exam_code*",
      // Shift details
      "shift_code*",
      "shift_name*",
      "gate_open_time*",
      "gate_close_time*",
      "start_time*",
      "end_time*",
      // Centre details
      "centre_name*",
      "centre_code*",
      "centre_city*",
      "centre_state*",
      "centre_pincode",
      "centre_address*",
      "centre_contact_person*",
      "centre_phone*",
      "centre_email",
    ];

    // Pre-fill exam details if exam is selected
    const examName = selectedExam?.exam_name || "Engineering Entrance Exam";
    const examCode = selectedExam?.exam_code || "EXAM001";
    // Format dates as YYYY-MM-DD for the template (raw format as requested)
    const examStartDate = selectedExam?.start_date || "2026-02-15";
    const examEndDate = selectedExam?.end_date || "2026-02-15";
    
    let rawExamDate = selectedDateForImport || selectedExam?.exam_date || selectedExam?.start_date || "2026-02-15";
    const examDate = rawExamDate;

    const sample1 = [
      // Candidate
      "ROLL000001",
      "John Doe",
      "Robert Doe",
      "1995-05-15",
      "Male",
      "123456789012",
      "123 Main Street, Andheri West, Mumbai",
      "john@example.com",
      "9000000001",
      "https://example.com/photo1.jpg",
      examDate,
      // Exam (pre-filled if selected)
      examName,
      examStartDate,
      examEndDate,
      examCode,
      // Shift
      "SHIFT01",
      "Morning Shift",
      "08:00:00",
      "08:30:00",
      "09:00:00",
      "12:00:00",
      // Centre
      "City Central School",
      "CTR001",
      "Mumbai",
      "Maharashtra",
      "400053",
      "123 Main Street, Andheri West",
      "Mr. Sharma",
      "2212345678",
      "centre@example.com",
    ];

    const sample2 = [
      // Candidate (with optional fields empty)
      "ROLL000002",
      "Jane Smith",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      examDate,
      // Exam (same exam, pre-filled if selected)
      examName,
      examStartDate,
      examEndDate,
      examCode,
      // Shift (different shift)
      "SHIFT02",
      "Afternoon Shift",
      "12:30:00",
      "13:00:00",
      "13:30:00",
      "16:30:00",
      // Centre (same centre)
      "City Central School",
      "CTR001",
      "Mumbai",
      "Maharashtra",
      "400053",
      "123 Main Street, Andheri West",
      "Mr. Sharma",
      "",
      "",
    ];

    const csv = [headers.join(","), sample1.join(","), sample2.join(",")].join(
      "\n",
    );
    
    // Use data URI instead of Blob for better filename support
    const csvContent = "\ufeff" + csv; // Add BOM for Excel
    const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    
    const link = document.createElement("a");
    const filename = selectedExam && selectedDateForImport
      ? `candidate_import_${examCode}_${examName.replace(/\s+/g, "_")}_${selectedDateForImport.replace(/-/g, "_")}.csv`
      : "candidate_import_sample.csv";
    link.href = dataUri;
    link.download = filename;
    link.click();
  };

  const [visibleCount, setVisibleCount] = useState(50);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, statusFilter, examFilter, dateFilter, centreFilter, shiftFilter]);

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || candidate.verification_status === statusFilter;
    const matchesExam =
      examFilter === "all" || candidate.exam_id === examFilter;
    const matchesDate =
      dateFilter === "all" || candidate.exam_date === dateFilter;
    const matchesCentre =
      centreFilter === "all" || candidate.centre_id === centreFilter;
    const matchesShift =
      shiftFilter === "all" || candidate.shift_id === shiftFilter;
    return (
      matchesSearch &&
      matchesStatus &&
      matchesExam &&
      matchesDate &&
      matchesCentre &&
      matchesShift
    );
  });
  
  const displayedCandidates = filteredCandidates.slice(0, visibleCount);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "absent":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600">
            Manage candidate records and verifications
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Candidates
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2"
            >
              <option value="all">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed</option>
            </select>
            <Input
              type="date"
              placeholder="Filter by date..."
              value={dateFilter === "all" ? "" : dateFilter}
              onChange={(e) => setDateFilter(e.target.value || "all")}
            />
            <select
              value={centreFilter}
              onChange={(e) => setCentreFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2"
            >
              <option value="all">All Centres</option>
              {centres.map((centre) => (
                <option key={centre.id} value={centre.id}>
                  {centre.centre_name} - {centre.city}
                </option>
              ))}
            </select>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2"
            >
              <option value="all">All Shifts</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.shift_name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredCandidates.length === 0 ? (
            <div className="py-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No candidates found
              </h3>
              <p className="mt-2 text-gray-600">
                {searchQuery || statusFilter !== "all" || examFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Import candidates to get started"}
              </p>
              {!searchQuery &&
                statusFilter === "all" &&
                examFilter === "all" && (
                  <Button
                    onClick={() => setShowImportModal(true)}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Candidates
                  </Button>
                )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Father&apos;s Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-medium">
                        {candidate.roll_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900">
                        {candidate.full_name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {candidate.father_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {candidate.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {candidate.phone}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(candidate.verification_status)}
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(candidate.verification_status)}`}
                        >
                          {candidate.verification_status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {candidate.verification_attempts}/3
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {visibleCount < filteredCandidates.length && (
            <div className="flex justify-center p-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + 50)}
              >
                Load More ({filteredCandidates.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Import Candidates</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import candidates with their exam
              assignments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Exam Date
              </label>
              <Input
                type="date"
                value={selectedDateForImport}
                onChange={(e) => {
                  setSelectedDateForImport(e.target.value);
                  setSelectedExamForImport(""); // Reset exam selection when date changes
                }}
                className="w-full"
                disabled={importing}
              />
              <p className="text-xs text-gray-500">
                Select a date to see exams scheduled for that day
              </p>
            </div>

            {/* Exam Selector - Only show if date is selected */}
            {selectedDateForImport && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Exam (Optional)
                </label>
                {(() => {
                  // Filter exams that include the selected date (using string comparison to avoid timezone issues)
                  const examsForDate = exams.filter((exam) => {
                    if (!exam.start_date || !exam.end_date) return false;
                    // Use utility function for date comparison
                    return isDateBetween(selectedDateForImport, exam.start_date, exam.end_date);
                  });

                  if (examsForDate.length === 0) {
                    return (
                      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                        <p className="text-sm text-yellow-800">
                          No exams scheduled for {formatDateForDisplay(selectedDateForImport)}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <select
                        value={selectedExamForImport}
                        onChange={(e) => setSelectedExamForImport(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        disabled={importing}
                      >
                        <option value="">
                          No exam selected (download generic template)
                        </option>
                        {examsForDate.map((exam) => (
                          <option key={exam.id} value={exam.id}>
                            {exam.exam_name} ({exam.exam_code})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">
                        {selectedExamForImport
                          ? "Template will be pre-filled with selected exam details"
                          : "Select an exam to pre-fill exam details in the template"}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Sample CSV Download */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">
                    CSV Format - Comprehensive Import
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>MANDATORY Candidate:</strong> roll_number, full_name
                  </p>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>OPTIONAL Candidate:</strong> father_name, date_of_birth, gender, aadhaar_number, address, email,
                    phone (10 digits, no ISD code), photo_url
                  </p>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>MANDATORY Exam:</strong> exam_name, exam_start_date,
                    exam_end_date, exam_code, exam_date
                  </p>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>MANDATORY Shift:</strong> shift_code, shift_name,
                    gate_open_time, gate_close_time, start_time, end_time
                  </p>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>MANDATORY Centre:</strong> centre_name, centre_code,
                    centre_city, centre_address, centre_contact_person,
                    centre_phone (10 digits, no ISD code)
                  </p>
                  <p className="text-sm text-blue-700 mb-3">
                    <strong>OPTIONAL Centre:</strong> centre_email
                  </p>
                  <Button
                    onClick={downloadSampleCSV}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {selectedExamForImport
                      ? "Download Template with Exam Details"
                      : "Download Generic Template"}
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select CSV File
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                  className="flex-1"
                />
                {csvFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCsvFile(null);
                      setImportErrors([]);
                    }}
                    disabled={importing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {csvFile && (
                <p className="text-sm text-gray-600">
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)}{" "}
                  KB)
                </p>
              )}
            </div>

            {/* Import Progress */}
            {importing && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                  <span className="font-medium text-gray-900">
                    Importing candidates...
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Processing row {currentProcessingRow} of {importTotal}</p>
                  <p className="text-xs mt-1 text-gray-500">
                    Success: {importSuccess} | Errors: {importErrors.length}
                  </p>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all duration-300"
                    style={{
                      width: `${importTotal > 0 ? (currentProcessingRow / importTotal) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {!importing && importSuccess > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      Successfully imported {importSuccess} candidate
                      {importSuccess !== 1 ? "s" : ""}
                    </p>
                    {importErrors.length === 0 && (
                      <p className="text-sm text-green-700">
                        All candidates were imported without errors.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {importErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 max-h-60 overflow-y-auto">
                <div className="flex items-start gap-3 mb-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">
                      {importErrors.length} error
                      {importErrors.length !== 1 ? "s" : ""} found
                    </p>
                    <p className="text-sm text-red-700">
                      Please fix these issues and try again
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {importErrors.map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-red-800 bg-white rounded p-2"
                    >
                      <span className="font-medium">Row {error.row}:</span>{" "}
                      {error.field} - {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportModal(false);
                  setCsvFile(null);
                  setImportErrors([]);
                  setImportSuccess(0);
                  setImportTotal(0);
                }}
                disabled={importing}
              >
                {importSuccess > 0 && importErrors.length === 0
                  ? "Close"
                  : "Cancel"}
              </Button>
              <Button
                onClick={handleImport}
                disabled={!csvFile || importing}
                className="bg-green-600 hover:bg-green-700"
              >
                {importing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Import Candidates
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedCandidate?.roll_number}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Full Name</p>
                  <p className="font-medium">{selectedCandidate.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Roll Number</p>
                  <p className="font-medium">{selectedCandidate.roll_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Father&apos;s Name</p>
                  <p className="font-medium">{selectedCandidate.father_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusIcon(selectedCandidate.verification_status)}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedCandidate.verification_status)}`}>
                      {selectedCandidate.verification_status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selectedCandidate.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{selectedCandidate.phone || "N/A"}</p>
                </div>

                <div className="col-span-2 border-t pt-3 mt-1">
                  <p className="text-gray-900 font-semibold mb-2">Exam Assignment</p>
                </div>

                <div className="col-span-2">
                  <p className="text-gray-500">Exam</p>
                  <p className="font-medium">
                    {exams.find((e) => e.id === selectedCandidate.exam_id)?.exam_name || "Unknown Exam"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Exam Date</p>
                  <p className="font-medium">{(selectedCandidate as any).exam_date || "N/A"}</p>
                </div>
               
                <div className="col-span-2">
                  <p className="text-gray-500">Centre</p>
                  <p className="font-medium">
                    {centres.find((c) => c.id === (selectedCandidate as any).centre_id)?.centre_name || "Unknown Centre"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {centres.find((c) => c.id === (selectedCandidate as any).centre_id)?.city || ""}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Shift</p>
                  <p className="font-medium">
                    {shifts.find((s) => s.id === (selectedCandidate as any).shift_id)?.shift_name || "Unknown Shift"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
