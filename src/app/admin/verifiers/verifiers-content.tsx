"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  getCentres, 
  getShifts
} from "@/app/actions/supabase-actions";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Shield,
  Mail,
  Phone,
  Activity,
  Eye,
  Edit,
  UserPlus,
  Upload,
  Download,
  FileUp,
  AlertCircle,
  X,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  ArrowUpDown,
} from "lucide-react";
import { CreateVerifierModal } from "@/components/admin/create-verifier-modal";
import { ViewVerifierModal } from "@/components/admin/view-verifier-modal";
import { EditVerifierModal } from "@/components/admin/edit-verifier-modal";
import { AssignVerifierModal } from "@/components/admin/assign-verifier-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Verifier {
  id: string;
  full_name: string;
  father_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  city: string;
  is_active: boolean;
  created_at: string;
}

export function VerifiersContent() {
  const router = useRouter();
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState<Verifier | null>(
    null,
  );

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<
    Array<{ row: number; field: string; message: string }>
  >([]);
  const [importSuccess, setImportSuccess] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  
  // Assignment state for Import
  const [exams, setExams] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedExamForImport, setSelectedExamForImport] = useState<string>("");
  const [importAssignmentDate, setImportAssignmentDate] = useState<string>("");


  // Email invitation state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedVerifiers, setSelectedVerifiers] = useState<string[]>([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(0);
  const [emailErrors, setEmailErrors] = useState<
    Array<{ email: string; message: string }>
  >([]);

  useEffect(() => {
    loadVerifiers();
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
      try {
        const { getExams } = await import("@/app/actions/supabase-actions");
        const examData = await getExams();
        setExams(examData || []);
      } catch(e) { console.error(e) }
  }

  const loadVerifiers = async () => {
    try {
      const { getVerifiers } = await import("@/app/actions/supabase-actions");
      const data = await getVerifiers();
      setVerifiers(data || []);
    } catch (error) {
      console.error("Error loading verifiers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     if (selectedExamForImport) {
         fetchCentres();
     } else {
         setCentres([]);
         setShifts([]);
     }
  }, [selectedExamForImport]);

  // Removed separate selectedCentreForImport effect since we want all shifts for the Exam, not filtered by Centre (usually shifts are Exam-wide or Centre-wide?)
  // If Shifts are per-Centre, we need to fetch shifts for ALL centres?
  // Usually Shifts are defined per Exam (Morning/Evening) and apply to all Centres.
  // master_shifts struct: exam_id, shift_code.
  // So fetching shifts by exam_id is correct.


  const fetchCentres = async () => {
      try {
        const data = await getCentres();
        setCentres(data || []);
      } catch (error) {
        console.error("Error fetching centres:", error);
      }
      
      // Also fetch shifts
      fetchShifts();
  };

  const fetchShifts = async () => {
    try {
      const data = await getShifts();
      setShifts(data || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
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



  const normalizePhoneNumber = (phone: string): string => {
    if (!phone || phone.trim() === "") return phone;

    // Check if phone is in scientific notation (e.g., 9.19877E+11)
    if (/^\d+\.?\d*[eE][+-]?\d+$/.test(phone)) {
      // Convert scientific notation to regular number
      const num = parseFloat(phone);
      phone = num.toString();
    }

    // Remove any non-digit characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, "");

    // If it starts with multiple + signs, keep only the first one
    if (cleaned.startsWith("+")) {
      cleaned = "+" + cleaned.substring(1).replace(/\+/g, "");
    }

    // If the number doesn't start with + and has 10 digits, add +91 for India
    if (!cleaned.startsWith("+") && /^\d{10}$/.test(cleaned)) {
      cleaned = "+91" + cleaned;
    }

    return cleaned;
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

      if (rows.length < 2) throw new Error("CSV file is empty or invalid");

      const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/\*/g, ""));
      const dataRows = rows.slice(1);
      setImportTotal(dataRows.length);

      const requiredHeaders = ["full_name", "email", "phone"];
      const missing = requiredHeaders.filter(h => !headers.includes(h));
      if (missing.length > 0) {
          setImportErrors([{ row: 0, field: "Headers", message: `Missing: ${missing.join(", ")}` }]);
          setImporting(false);
          return;
      }

      const formattedRows = dataRows.map((row) => {
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = row[i]?.trim() || "");
          // Phone normalization
          if (obj.phone) obj.phone = normalizePhoneNumber(obj.phone);
          return obj;
      }).filter(r => r.full_name || r.email);

      const { bulkImportVerifiers } = await import("@/app/actions/supabase-actions");
      const result = await bulkImportVerifiers(formattedRows);

      if (result.errors && result.errors.length > 0) {
          setImportErrors(result.errors.map((e: any) => ({ row: e.row, field: "Error", message: e.error })));
      }
      setImportSuccess(result.count || 0);

      loadVerifiers(); // Refresh list

    } catch (error: any) {
      setImportErrors([{ row: 0, field: "System", message: error.message }]);
    } finally {
      setImporting(false);
    }
  };


  const downloadSampleCSV = () => {
    const headers = [
      "full_name*",
      "email*",
      "phone*",
      "father_name",
      "date_of_birth",
      "address",
      "city",
      "assignment_exam_name",
      "assignment_exam_id",
      "assignment_centre_name",
      "assignment_centre_id",
      "assignment_shift_code",
      "assignment_shift_id",
      "assignment_date"
    ];

    const exam = exams.find(e => e.id === selectedExamForImport);
    const examName = exam ? exam.exam_name : "";
    const examId = exam ? exam.id : "";
    const date = importAssignmentDate || "";
    
    const rows: string[] = [];

    // Generate Cartesian Product: Every Centre x Every Shift
    // Only if an exam is selected, otherwise just blank
    if (examId && centres.length > 0 && shifts.length > 0) {
        centres.forEach(centre => {
            shifts.forEach(shift => {
                const row = [
                    "", // full_name
                    "", // email
                    "", // phone
                    "", // father_name
                    "", // dob
                    "", // address
                    "", // city
                    examName,
                    examId,
                    centre.centre_name || "Unknown Centre",
                    centre.id,
                    shift.shift_code || shift.shift_name,
                    shift.id,
                    date
                ];
                // Escape entries if needed (simple CSV)
                rows.push(row.map(c => `"${c || ""}"`).join(","));
            });
        });
    } else {
        // Fallback sample if no metadata selected
        const sample1 = [
            "Amit Verma", "amit.verma@example.com", "+919876543220", "Suresh", "20/08/1990", "Address", "City",
            "Example Exam", "uuid", "Example Centre", "uuid", "Morning", "uuid", "2024-01-01"
        ];
        rows.push(sample1.map(c => `"${c}"`).join(","));
    }

    const csv = [headers.join(","), ...rows].join("\n");
    
    // Use data URI instead of Blob for better filename support
    const csvContent = "\ufeff" + csv; // Add BOM for Excel
    const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    
    const link = document.createElement("a");
        link.href = dataUri;
    link.download = "verifiers_import_template.csv";
    link.click();
  };

  // Enhanced search filter
  const filteredVerifiers = verifiers.filter((verifier) => {
    const query = searchQuery.toLowerCase();
    
    // Search in basic verifier fields
    const matchesBasic = 
      verifier.full_name.toLowerCase().includes(query) ||
      verifier.email.toLowerCase().includes(query) ||
      verifier.city?.toLowerCase().includes(query);
    
    // Search in assignments
    const matchesAssignments = (verifier as any).assignments?.some((assignment: any) =>
      assignment.exam_name?.toLowerCase().includes(query) ||
      assignment.centre_name?.toLowerCase().includes(query) ||
      assignment.shift_name?.toLowerCase().includes(query)
    );
    
    return matchesBasic || matchesAssignments;
  });

  // Sorting logic
  const sortedVerifiers = [...filteredVerifiers].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue: any;
    let bValue: any;
    
    switch (sortColumn) {
      case "name":
        aValue = a.full_name.toLowerCase();
        bValue = b.full_name.toLowerCase();
        break;
      case "phone":
        aValue = a.phone || "";
        bValue = b.phone || "";
        break;
      case "city":
        aValue = a.city?.toLowerCase() || "";
        bValue = b.city?.toLowerCase() || "";
        break;
      case "status":
        aValue = a.is_active ? 1 : 0;
        bValue = b.is_active ? 1 : 0;
        break;
      case "assignments":
        aValue = (a as any).assignments?.length || 0;
        bValue = (b as any).assignments?.length || 0;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading verifiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verifiers</h1>
          <p className="text-gray-600">
            Manage biometric verification personnel
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              const inactiveVerifiers = verifiers
                .filter((v) => !v.is_active)
                .map((v) => v.id);
              setSelectedVerifiers(inactiveVerifiers);
              setShowEmailModal(true);
            }}
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
            disabled={verifiers.filter((v) => !v.is_active).length === 0}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Invitations ({verifiers.filter((v) => !v.is_active).length})
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            onClick={() => router.push("/admin/verifiers/bulk-assign")}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Bulk Assign
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Verifier
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Verifiers
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {verifiers.length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {verifiers.filter((v) => v.is_active).length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="mt-2 text-3xl font-bold text-gray-600">
                  {verifiers.filter((v) => !v.is_active).length}
                </p>
              </div>
              <div className="rounded-full bg-gray-100 p-3">
                <Shield className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search verifiers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredVerifiers.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No verifiers found
              </h3>
              <p className="mt-2 text-gray-600">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create verifiers to handle biometric verification"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Verifier
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="h-8 px-2 hover:bg-transparent"
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("phone")}
                      className="h-8 px-2 hover:bg-transparent"
                    >
                      Phone
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("city")}
                      className="h-8 px-2 hover:bg-transparent"
                    >
                      City
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("assignments")}
                      className="h-8 px-2 hover:bg-transparent"
                    >
                      Assignments
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="h-8 px-2 hover:bg-transparent"
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVerifiers.map((verifier) => (
                  <TableRow key={verifier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                          {verifier.full_name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900">
                          {verifier.full_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        {verifier.phone || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-600">{verifier.city || "N/A"}</p>
                    </TableCell>
                    <TableCell>
                      {verifier.assignments && verifier.assignments.length > 0 ? (
                        <div className="space-y-1">
                          {verifier.assignments.map((assignment: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-blue-600">{assignment.exam_name}</span>
                              </div>
                              <div className="text-gray-500">
                                {assignment.centre_name} • {assignment.shift_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No assignments</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          verifier.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {verifier.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedVerifier(verifier);
                                  setShowViewModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Details</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => {
                                  setSelectedVerifier(verifier);
                                  setShowEditModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Verifier</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedVerifier(verifier);
                                  setShowAssignModal(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Assign to Exam</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateVerifierModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadVerifiers}
      />

      <ViewVerifierModal
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedVerifier(null);
        }}
        verifier={selectedVerifier}
      />

      <EditVerifierModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedVerifier(null);
        }}
        verifier={selectedVerifier}
        onSuccess={loadVerifiers}
      />

      <AssignVerifierModal
        open={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedVerifier(null);
        }}
        verifier={selectedVerifier}
        onSuccess={loadVerifiers}
      />

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Bulk Import Verifiers</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import verifiers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">CSV Format</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>MANDATORY:</strong> full_name, email, phone
                  </p>
                  <p className="text-sm text-blue-700 mb-3">
                    <strong>OPTIONAL:</strong> father_name, assignment_* fields
                  </p>
                  
                  {/* Exam Selector */}
                  <div className="space-y-3 mb-4 mt-4 border-t border-blue-200 pt-3">
                       <label className="text-xs font-semibold uppercase text-blue-800">Generate Assignment Rows (Optional)</label>
                       <p className="text-xs text-blue-600 mb-2">Select an Exam to generate a template row for <strong>every Centre & Shift</strong> combination.</p>
                       
                       <div className="flex flex-col sm:flex-row items-center gap-3">
                           <div className="flex-1 w-full">
                               <Select value={selectedExamForImport} onValueChange={setSelectedExamForImport}>
                                 <SelectTrigger className="bg-white h-10"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                                 <SelectContent>
                                   {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.exam_name}</SelectItem>)}
                                 </SelectContent>
                               </Select>
                           </div>

                           <div className="shrink-0">
                               <Popover>
                                 <PopoverTrigger asChild>
                                   <Button
                                     variant={"outline"}
                                     className={cn(
                                       "w-[160px] h-10 justify-start text-left font-normal bg-white",
                                       !importAssignmentDate && "text-muted-foreground"
                                     )}
                                   >
                                     <CalendarIcon className="mr-2 h-4 w-4" />
                                     {importAssignmentDate ? format(new Date(importAssignmentDate), "dd/MM/yyyy") : <span>Pick a date</span>}
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-auto p-0" align="end">
                                   <CalendarPicker
                                     mode="single"
                                     selected={importAssignmentDate ? new Date(importAssignmentDate) : undefined}
                                     onSelect={(date) => {
                                       if (date) {
                                         setImportAssignmentDate(format(date, "yyyy-MM-dd"));
                                       }
                                     }}
                                     initialFocus
                                   />
                                 </PopoverContent>
                               </Popover>
                           </div>
                       </div>
                       
                       {(centres.length > 0 || shifts.length > 0) && (
                           <p className="text-xs text-green-700">
                               Found {centres.length} centres and {shifts.length} shifts. Template will have {centres.length * shifts.length} rows.
                           </p>
                       )}
                  </div>

                  <Button
                    onClick={downloadSampleCSV}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template Validated with Assignment
                  </Button>
                </div>
              </div>
            </div>

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

            {importing && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                  <span className="font-medium text-gray-900">
                    Importing verifiers...
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Progress: {importSuccess} / {importTotal} verifiers imported
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all duration-300"
                    style={{
                      width: `${importTotal > 0 ? (importSuccess / importTotal) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {!importing && importSuccess > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      Successfully imported {importSuccess} verifier
                      {importSuccess !== 1 ? "s" : ""}
                    </p>
                    {importErrors.length === 0 && (
                      <p className="text-sm text-green-700">
                        All verifiers were imported without errors.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                    Import Verifiers
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-purple-600">
              Send Invitation Emails
            </DialogTitle>
            <DialogDescription>
              Send invitation emails to inactive verifiers to complete their
              registration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!sendingEmails &&
              emailErrors.length === 0 &&
              emailSuccess === 0 && (
                <>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="flex-1 text-sm text-purple-900">
                        <p className="font-medium mb-1">
                          Ready to send invitations
                        </p>
                        <p>
                          {selectedVerifiers.length} inactive verifier
                          {selectedVerifiers.length !== 1 ? "s" : ""} will
                          receive an invitation email to complete their
                          registration.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verifiers
                          .filter((v) => selectedVerifiers.includes(v.id))
                          .map((verifier) => (
                            <TableRow key={verifier.id}>
                              <TableCell className="font-medium">
                                {verifier.full_name}
                              </TableCell>
                              <TableCell>{verifier.email}</TableCell>
                              <TableCell>{verifier.phone}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

            {sendingEmails && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                  <p className="text-sm font-medium">
                    Sending invitation emails...
                  </p>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full transition-all duration-300"
                    style={{
                      width: `${selectedVerifiers.length > 0 ? (emailSuccess / selectedVerifiers.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 text-center">
                  {emailSuccess} of {selectedVerifiers.length} emails sent
                </p>
              </div>
            )}

            {!sendingEmails && emailSuccess > 0 && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">
                        Successfully sent {emailSuccess} invitation email
                        {emailSuccess !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {emailErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 mb-2">
                          Failed to send {emailErrors.length} email
                          {emailErrors.length !== 1 ? "s" : ""}
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {emailErrors.map((error, idx) => (
                            <p key={idx} className="text-xs text-red-800">
                              • {error.email}: {error.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setShowEmailModal(false);
                setEmailSuccess(0);
                setEmailErrors([]);
                setSelectedVerifiers([]);
              }}
              variant="outline"
              disabled={sendingEmails}
            >
              {emailSuccess > 0 ? "Close" : "Cancel"}
            </Button>
            {!sendingEmails && emailSuccess === 0 && (
              <Button
                onClick={async () => {
                  const supabase = createClient();
                  setSendingEmails(true);
                  setEmailSuccess(0);
                  setEmailErrors([]);

                  const errors: Array<{ email: string; message: string }> = [];
                  let success = 0;

                  for (const verifierId of selectedVerifiers) {
                    const verifier = verifiers.find((v) => v.id === verifierId);
                    if (!verifier) continue;

                    try {
                      // Generate invitation token
                      const token =
                        Math.random().toString(36).substring(2) +
                        Date.now().toString(36);

                      // Update user with invitation token and expiry (7 days)
                      const { error: updateError } = await supabase
                        .from("users")
                        .update({
                          invitation_token: token,
                          invitation_sent_at: new Date().toISOString(),
                          invitation_expires_at: new Date(
                            Date.now() + 7 * 24 * 60 * 60 * 1000,
                          ).toISOString(),
                        })
                        .eq("id", verifierId);

                      if (updateError) {
                        // Check if it's a column doesn't exist error
                        if (
                          updateError.message.includes("column") ||
                          updateError.code === "42703"
                        ) {
                          throw new Error(
                            "Database not ready. Please run: add-invitation-fields.sql in Supabase SQL Editor first.",
                          );
                        }
                        throw updateError;
                      }

                      // Send invitation email via .NET API
                      const response = await fetch(
                        "http://localhost:5001/api/invitations/send",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            email: verifier.email,
                            name: verifier.full_name,
                            role: "verifier",
                            token: token,
                          }),
                        },
                      );

                      if (!response.ok) {
                        const data = await response.json();

                        // Handle Resend testing limitation gracefully
                        if (
                          response.status === 403 &&
                          data.error?.includes("only send testing emails")
                        ) {
                          throw new Error(
                            `⚠️ Testing Mode: Can only send to neelesh001@gmail.com. Verify a domain at resend.com/domains to send to ${verifier.email}`,
                          );
                        }

                        throw new Error(data.error || "Failed to send email");
                      }

                      success++;
                      setEmailSuccess(success);
                    } catch (error: any) {
                      const errorMessage = error.message || "Unknown error";
                      errors.push({
                        email: verifier.email,
                        message: errorMessage,
                      });
                      setEmailErrors([...errors]);

                      // Show toast for Resend limitations
                      if (errorMessage.includes("Testing Mode")) {
                        toast.warning(errorMessage, { duration: 8000 });
                      }
                    }

                    // Small delay to avoid overwhelming the email service
                    await new Promise((resolve) => setTimeout(resolve, 500));
                  }

                  setSendingEmails(false);

                  if (success > 0) {
                    toast.success(
                      `Successfully sent ${success} invitation email${success !== 1 ? "s" : ""}`,
                    );
                  }

                  if (errors.length > 0) {
                    toast.error(
                      `Failed to send ${errors.length} email${errors.length !== 1 ? "s" : ""}`,
                    );
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Invitations
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
