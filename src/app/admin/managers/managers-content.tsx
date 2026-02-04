"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hashPassword, generateDefaultPassword } from "@/lib/password-utils";
import { getCurrentUser } from "@/lib/auth";
import { createManagerAssignmentAction } from "@/app/actions/supabase-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  UserCog,
  Mail,
  Phone,
  Eye,
  Edit,
  MapPin,
  Upload,
  Download,
  FileUp,
  AlertCircle,
  X,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreateManagerModal } from "@/components/admin/create-manager-modal";
import { ViewManagerModal } from "@/components/admin/view-manager-modal";
import { EditManagerModal } from "@/components/admin/edit-manager-modal";
import { AssignManagerModal } from "@/components/admin/assign-manager-modal";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getCentres,
  getShifts
} from "@/app/actions/supabase-actions";

interface Manager {
  id: string;
  full_name: string;
  father_name: string | null;
  email: string;
  phone: string;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
}

export function ManagersContent() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());

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
  const [selectedShiftForImport, setSelectedShiftForImport] = useState<string[]>([]);


  // Email invitation state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(0);
  const [emailErrors, setEmailErrors] = useState<
    Array<{ email: string; message: string }>
  >([]);

  useEffect(() => {
    loadManagers();
    loadMetadata();
  }, []);

  // Fetch centres and shifts when exam is selected
  useEffect(() => {
    if (selectedExamForImport) {
      fetchCentresAndShifts(selectedExamForImport);
    } else {
      setCentres([]);
      setShifts([]);
    }
  }, [selectedExamForImport]);

  const loadMetadata = async () => {
    try {
      const { getExams } = await import("@/app/actions/supabase-actions");
      const examData = await getExams();
      setExams(examData || []);
    } catch(e) { console.error(e) }
  }

  const fetchCentresAndShifts = async (examId: string) => {
    try {
      const [centresData, shiftsData] = await Promise.all([
        getCentres(examId),
        getShifts(examId)
      ]);
      setCentres(centresData || []);
      setShifts(shiftsData || []);
    } catch (error) {
      console.error("Error fetching centres and shifts:", error);
    }
  };

  const loadManagers = async () => {
    try {
      const { getManagers } = await import("@/app/actions/supabase-actions");
      const data = await getManagers();
      console.log("📊 Managers loaded from getManagers:", {
        totalManagers: data?.length || 0,
        managers: data?.map(m => ({
          id: m.id,
          name: m.full_name,
          email: m.email,
          assignmentCount: (m as any).assignments?.length || 0,
          assignments: (m as any).assignments
        }))
      });
      setManagers(data || []);
    } catch (error) {
      console.error("Error loading managers:", error);
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

  const convertDateFormat = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === "") return null;

    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month}-${day}`;
    }

    // Convert DD-MM-YYYY to YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split("-");
      return `${year}-${month}-${day}`;
    }

    return null;
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
      // Initialize Supabase client
      const supabase = createClient();

      // Get current user from session
      const user = getCurrentUser();

      if (!user) {
        throw new Error("Authentication required. Please log in again.");
      }

      const text = await csvFile.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        throw new Error("CSV file is empty or invalid");
      }

      const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/\*/g, ""));
      const dataRows = rows.slice(1);
      setImportTotal(dataRows.length);

      const errors: Array<{ row: number; field: string; message: string }> = [];
      let successCount = 0;

      const requiredHeaders = ["full_name", "email", "phone"];

      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          errors.push({
            row: 0,
            field: required,
            message: `Missing required column: ${required}`,
          });
        }
      }

      if (errors.length > 0) {
        setImportErrors(errors);
        setImporting(false);
        return;
      }

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;

        try {
          const manager: Record<string, string> = {};
          headers.forEach((header, index) => {
            manager[header] = row[index]?.trim() || "";
          });

          if (!manager.full_name) {
            errors.push({
              row: rowNum,
              field: "full_name",
              message: "Full name is MANDATORY",
            });
            continue;
          }
          if (!manager.email) {
            errors.push({
              row: rowNum,
              field: "email",
              message: "Email is MANDATORY",
            });
            continue;
          }
          if (!manager.phone) {
            errors.push({
              row: rowNum,
              field: "phone",
              message: "Phone is MANDATORY",
            });
            continue;
          }


          // Check if user already exists by email
          // If exists, only create assignment (don't create duplicate user)
          const { data: existingUser } = await supabase
            .from("users")
            .select("id, role, full_name")
            .eq("email", manager.email)
            .single();

          let managerId: string;

          if (existingUser) {
            // User already exists (could be manager or verifier), use their ID
            managerId = existingUser.id;
            console.log(`User with email ${manager.email} already exists as ${existingUser.role}, skipping user creation, will only create assignment`);
          } else {
            // Insert into users table without creating auth user
            // Auth account will be created when user accepts invitation
            const convertedDate = convertDateFormat(manager.date_of_birth);

          // Generate UUID for the user
          const newUserId = crypto.randomUUID();

          // Generate default password and hash it
          const defaultPassword = generateDefaultPassword(manager.phone);
          const { hash, salt } = await hashPassword(defaultPassword);

          const { error: insertError } = await supabase.from("users").insert({
            id: newUserId,
            full_name: manager.full_name,
            father_name: manager.father_name || null,
            email: manager.email,
            phone: manager.phone,
            date_of_birth: convertedDate,
            address: manager.address || null,
            city: manager.city || null,
            role: "manager",
            is_active: true, // Active by default
            created_by: user.userId,
            password_hash: hash,
            password_salt: salt,
          });

          if (insertError) {
            errors.push({
              row: rowNum,
              field: "database",
              message: insertError.message,
            });
            continue;
          }

          managerId = newUserId;
          successCount++;
          setImportSuccess(successCount);
          } // Close else block

          // Create manager assignment if assignment columns are present AND non-empty
          const hasCompleteAssignment = 
            manager.assignment_exam_id?.trim() && 
            manager.assignment_centre_id?.trim() && 
            manager.assignment_shift_id?.trim() &&
            manager.assignment_exam_id.length > 10 && // UUID check
            manager.assignment_centre_id.length > 10 &&
            manager.assignment_shift_id.length > 10;

          if (hasCompleteAssignment) {
            const assignmentDate = manager.assignment_date || importAssignmentDate || new Date().toISOString().split('T')[0];
            
            console.log(`Creating assignment for ${manager.email}:`, {
              exam_id: manager.assignment_exam_id,
              centre_id: manager.assignment_centre_id,
              shift_id: manager.assignment_shift_id,
              date: assignmentDate
            });

            const result = await createManagerAssignmentAction(
              managerId,
              manager.assignment_exam_id.trim(),
              manager.assignment_centre_id.trim(),
              manager.assignment_shift_id.trim(),
              assignmentDate
            );

            if (!result.success) {
              console.error(`Failed to create assignment for ${manager.email}:`, result.error);
              // Don't fail the entire import, just log the error
              errors.push({
                row: rowNum,
                field: "assignment",
                message: `User created but assignment failed: ${result.error}`,
              });
            } else {
              console.log(`✓ Assignment created successfully for ${manager.email}`);
            }
          } else if (manager.assignment_exam_id || manager.assignment_centre_id || manager.assignment_shift_id) {
            // Some assignment fields present but incomplete
            console.warn(`Incomplete assignment data for ${manager.email}, skipping assignment creation`);
          }

        } catch (error) {
          errors.push({
            row: rowNum,
            field: "general",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      setImportErrors(errors);

      if (errors.length === 0) {
        toast.success(`Successfully imported ${successCount} managers`);
        await loadManagers(); // Refresh the list
        setTimeout(() => {
          setShowImportModal(false);
          setCsvFile(null);
        }, 2000);
      }
    } catch (error) {
      setImportErrors([
        {
          row: 0,
          field: "general",
          message: error instanceof Error ? error.message : "Import failed",
        },
      ]);
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
        // Filter shifts if specific shifts are selected
        const shiftsToUse = selectedShiftForImport.length > 0
          ? shifts.filter(s => selectedShiftForImport.includes(s.id))
          : shifts;

        centres.forEach(centre => {
            shiftsToUse.forEach(shift => {
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
            "Rajesh Kumar", "rajesh.kumar@example.com", "+919876543210", "Ram Kumar", "15/05/1985", "123 MG Road", "Mumbai",
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
    link.download = "managers_import_template.csv";
    link.click();
  };

  // Enhanced search filter
  const filteredManagers = managers.filter((manager) => {
    const query = searchQuery.toLowerCase();
    
    // Search in basic manager fields
    const matchesBasic = 
      manager.full_name.toLowerCase().includes(query) ||
      manager.city?.toLowerCase().includes(query);
    
    // Search in assignments
    const matchesAssignments = (manager as any).assignments?.some((assignment: any) =>
      assignment.exam_name?.toLowerCase().includes(query) ||
      assignment.centre_name?.toLowerCase().includes(query) ||
      assignment.shift_name?.toLowerCase().includes(query)
    );
    
    return matchesBasic || matchesAssignments;
  });

  // Sorting logic
  const sortedManagers = [...filteredManagers].sort((a, b) => {
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
          <p className="mt-4 text-gray-600">Loading managers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Managers</h1>
          <p className="text-gray-600">
            Manage centre managers and assignments
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              const inactiveManagers = managers
                .filter((m) => !m.is_active)
                .map((m) => m.id);
              setSelectedManagers(inactiveManagers);
              setShowEmailModal(true);
            }}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            disabled={managers.filter((m) => !m.is_active).length === 0}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Invitations ({managers.filter((m) => !m.is_active).length})
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Manager
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search managers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredManagers.length === 0 ? (
            <div className="py-12 text-center">
              <UserCog className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No managers found
              </h3>
              <p className="mt-2 text-gray-600">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create managers to oversee exam centres"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Manager
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
                {sortedManagers.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                          {manager.full_name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900">
                          {manager.full_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        {manager.phone || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {manager.city || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(manager as any).assignments && (manager as any).assignments.length > 0 ? (
                        <div>
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedManagers);
                              if (newExpanded.has(manager.id)) {
                                newExpanded.delete(manager.id);
                              } else {
                                newExpanded.add(manager.id);
                              }
                              setExpandedManagers(newExpanded);
                            }}
                            className="flex items-center gap-2 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                          >
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {(manager as any).assignments.length} Assignment{(manager as any).assignments.length > 1 ? 's' : ''}
                            </Badge>
                            {expandedManagers.has(manager.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4 -rotate-90" />
                            )}
                          </button>
                          {expandedManagers.has(manager.id) && (
                            <div className="mt-2 space-y-2 pl-2 border-l-2 border-purple-200">
                              {(manager as any).assignments.map((assignment: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-purple-600">{assignment.exam_name}</span>
                                  </div>
                                  <div className="text-gray-500">
                                    {assignment.centre_name} • {assignment.shift_name}
                                  </div>
                                  {assignment.assignment_date && (
                                    <div className="text-gray-400 text-xs">
                                      {new Date(assignment.assignment_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No assignments</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          manager.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {manager.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedManager(manager);
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
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedManager(manager);
                                  setShowEditModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Manager</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedManager(manager);
                                  setShowAssignModal(true);
                                }}
                              >
                                <MapPin className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Assign Centres</p>
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

      <CreateManagerModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadManagers}
      />

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Bulk Import Managers</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import managers
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
                    <strong>OPTIONAL:</strong> father_name, date_of_birth
                    (YYYY-MM-DD), address, city
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

                           <div className="flex-1 w-full">
                               <Popover>
                                 <PopoverTrigger asChild>
                                   <Button variant="outline" className="w-full justify-between bg-white h-10 px-3 font-normal text-left">
                                      <span className={cn("truncate", selectedShiftForImport.length === 0 && "text-muted-foreground")}>
                                        {selectedShiftForImport.length === 0 
                                          ? "Select Shifts" 
                                          : selectedShiftForImport.length === shifts.length
                                            ? "All Shifts Selected"
                                            : `${selectedShiftForImport.length} Shift${selectedShiftForImport.length > 1 ? 's' : ''} Selected`}
                                      </span>
                                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-[200px] p-0" align="start">
                                   <div className="p-2 border-b">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox 
                                          id="select-all-shifts"
                                          checked={selectedShiftForImport.length === shifts.length && shifts.length > 0}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedShiftForImport(shifts.map(s => s.id));
                                            } else {
                                              setSelectedShiftForImport([]);
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor="select-all-shifts"
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                          Select All
                                        </label>
                                      </div>
                                   </div>
                                   <div className="max-h-[200px] overflow-y-auto p-2 space-y-2">
                                     {shifts.map((shift) => (
                                       <div key={shift.id} className="flex items-center space-x-2">
                                         <Checkbox 
                                           id={`shift-${shift.id}`}
                                           checked={selectedShiftForImport.includes(shift.id)}
                                           onCheckedChange={(checked) => {
                                             if (checked) {
                                               setSelectedShiftForImport([...selectedShiftForImport, shift.id]);
                                             } else {
                                               setSelectedShiftForImport(selectedShiftForImport.filter(id => id !== shift.id));
                                             }
                                           }}
                                         />
                                         <label
                                           htmlFor={`shift-${shift.id}`}
                                           className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                         >
                                           {shift.shift_name}
                                         </label>
                                       </div>
                                     ))}
                                     {shifts.length === 0 && (
                                       <p className="text-xs text-muted-foreground text-center py-2">No shifts found</p>
                                     )}
                                   </div>
                                 </PopoverContent>
                               </Popover>
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
                               Found {centres.length} centres and {selectedShiftForImport.length > 0 ? selectedShiftForImport.length : shifts.length} shifts. Template will have {centres.length * (selectedShiftForImport.length > 0 ? selectedShiftForImport.length : shifts.length)} rows.
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
                    Importing managers...
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Progress: {importSuccess} / {importTotal} managers imported
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
                      Successfully imported {importSuccess} manager
                      {importSuccess !== 1 ? "s" : ""}
                    </p>
                    {importErrors.length === 0 && (
                      <p className="text-sm text-green-700">
                        All managers were imported without errors.
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
                    Import Managers
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
            <DialogTitle className="text-xl font-semibold text-blue-600">
              Send Invitation Emails
            </DialogTitle>
            <DialogDescription>
              Send invitation emails to inactive managers to complete their
              registration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!sendingEmails &&
              emailErrors.length === 0 &&
              emailSuccess === 0 && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1 text-sm text-blue-900">
                        <p className="font-medium mb-1">
                          Ready to send invitations
                        </p>
                        <p>
                          {selectedManagers.length} inactive manager
                          {selectedManagers.length !== 1 ? "s" : ""} will
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
                        {managers
                          .filter((m) => selectedManagers.includes(m.id))
                          .map((manager) => (
                            <TableRow key={manager.id}>
                              <TableCell className="font-medium">
                                {manager.full_name}
                              </TableCell>
                              <TableCell>{manager.email}</TableCell>
                              <TableCell>{manager.phone}</TableCell>
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
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm font-medium">
                    Sending invitation emails...
                  </p>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{
                      width: `${selectedManagers.length > 0 ? (emailSuccess / selectedManagers.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 text-center">
                  {emailSuccess} of {selectedManagers.length} emails sent
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
                setSelectedManagers([]);
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

                  for (const managerId of selectedManagers) {
                    const manager = managers.find((m) => m.id === managerId);
                    if (!manager) continue;

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
                        .eq("id", managerId);

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
                            email: manager.email,
                            name: manager.full_name,
                            role: "manager",
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
                            `⚠️ Testing Mode: Can only send to neelesh001@gmail.com. Verify a domain at resend.com/domains to send to ${manager.email}`,
                          );
                        }

                        throw new Error(data.error || "Failed to send email");
                      }

                      success++;
                      setEmailSuccess(success);
                    } catch (error) {
                      const errorMessage =
                        error instanceof Error
                          ? error.message
                          : "Unknown error";
                      errors.push({
                        email: manager.email,
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Invitations
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedManager && (
        <>
          <ViewManagerModal
            open={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedManager(null);
            }}
            manager={selectedManager}
          />

          <EditManagerModal
            open={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedManager(null);
            }}
            manager={selectedManager}
            onSuccess={() => {
              loadManagers();
              setShowEditModal(false);
              setSelectedManager(null);
            }}
          />

          <AssignManagerModal
            open={showAssignModal}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedManager(null);
            }}
            manager={selectedManager}
          />
        </>
      )}
    </div>
  );
}
