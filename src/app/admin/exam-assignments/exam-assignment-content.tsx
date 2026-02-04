"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: string;
  exam_name: string;
  exam_code: string;
  start_date: string;
  end_date: string;
}

interface Centre {
  id: string;
  centre_name: string;
  centre_code: string;
  city: string;
  capacity: number;
}

interface Shift {
  id: string;
  shift_name: string;
  shift_code: string;
  gate_open_time: string;
  gate_close_time: string;
  start_time: string;
  end_time: string;
}

interface CentreAssignment {
  centreId: string;
  capacity: number;
  shifts: ShiftAssignment[];
}

interface ShiftAssignment {
  shiftId: string;
  capacity: number;
}

import { 
  getExams, 
  getCentres, 
  getShifts, 
  getExamAssignments, 
  saveExamAssignments 
} from "@/app/actions/supabase-actions";

// ... (keep interfaces)

export function ExamAssignmentContent() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ... (keep state variables)
  
  // Selection states
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [openExamDropdown, setOpenExamDropdown] = useState(false);

  // Search states
  const [examSearch, setExamSearch] = useState("");
  const [centreSearch, setCentreSearch] = useState<{ [key: number]: string }>(
    {},
  );
  const [shiftSearch, setShiftSearch] = useState<{ [key: number]: string }>({});

  // Data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Assignment state
  const [centreAssignments, setCentreAssignments] = useState<
    CentreAssignment[]
  >([]);
  
  // ... (keep other state variables)
  const [openCentreDropdowns, setOpenCentreDropdowns] = useState<{
    [key: number]: boolean;
  }>({});
  const [openShiftDropdowns, setOpenShiftDropdowns] = useState<{
    [key: number]: boolean;
  }>({});

  useEffect(() => {
    loadExams();
    loadCentres();
    loadShifts();
  }, []);

  useEffect(() => {
    if (selectedExam && selectedDate) {
      loadExistingAssignments();
    } else {
      setCentreAssignments([]);
    }
  }, [selectedExam, selectedDate]);

  const loadExams = async () => {
    try {
      const data = await getExams();
      setExams(data || []);
    } catch (error: any) {
      console.error("Error loading exams:", error);
      toast({
        title: "Error",
        description: "Failed to load exams",
        variant: "destructive",
      });
    }
  };

  const loadCentres = async () => {
    try {
      const data = await getCentres();
      setCentres(data || []);
    } catch (error: any) {
      console.error("Error loading centres:", error);
      toast({
        title: "Error",
        description: "Failed to load centres",
        variant: "destructive",
      });
    }
  };

  const loadShifts = async () => {
    try {
      const data = await getShifts();
      setShifts(data || []);
    } catch (error: any) {
      console.error("Error loading shifts:", error);
      toast({
        title: "Error",
        description: "Failed to load shifts",
        variant: "destructive",
      });
    }
  };

  const loadExistingAssignments = async () => {
    try {
      setLoading(true);
      const result = await getExamAssignments(selectedExam, selectedDate);
      
      if (result.error) throw new Error(result.error);
      
      setCentreAssignments(result.assignments || []);
    } catch (error: any) {
      console.error("Error loading assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load existing assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCentreAssignment = () => {
    setCentreAssignments([
      ...centreAssignments,
      {
        centreId: "",
        capacity: 0,
        shifts: [],
      },
    ]);
  };

  const removeCentreAssignment = (index: number) => {
    setCentreAssignments(centreAssignments.filter((_, i) => i !== index));
  };

  const updateCentreAssignment = (
    index: number,
    field: keyof CentreAssignment,
    value: any,
  ) => {
    const updated = [...centreAssignments];
    updated[index] = { ...updated[index], [field]: value };
    setCentreAssignments(updated);
  };

  const addShiftToAssignment = (centreIndex: number, shiftId: string) => {
    const updated = [...centreAssignments];
    const existingShift = updated[centreIndex].shifts.find(
      (s) => s.shiftId === shiftId,
    );

    if (!existingShift) {
      updated[centreIndex].shifts.push({
        shiftId,
        capacity: 0,
      });
      setCentreAssignments(updated);
    }
  };

  const removeShiftFromAssignment = (
    centreIndex: number,
    shiftIndex: number,
  ) => {
    const updated = [...centreAssignments];
    updated[centreIndex].shifts = updated[centreIndex].shifts.filter(
      (_, i) => i !== shiftIndex,
    );
    setCentreAssignments(updated);
  };

  const updateShiftCapacity = (
    centreIndex: number,
    shiftIndex: number,
    capacity: number,
  ) => {
    const updated = [...centreAssignments];
    updated[centreIndex].shifts[shiftIndex].capacity = capacity;
    setCentreAssignments(updated);
  };

  const handleSave = async () => {
    if (!selectedExam || !selectedDate) {
      toast({
        title: "Validation Error",
        description: "Please select exam and date",
        variant: "destructive",
      });
      return;
    }

    if (centreAssignments.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one centre assignment",
        variant: "destructive",
      });
      return;
    }

    // Validate assignments
    for (const assignment of centreAssignments) {
      if (!assignment.centreId) {
        toast({
          title: "Validation Error",
          description: "All centre assignments must have a centre selected",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      if (assignment.capacity <= 0) {
        toast({
          title: "Validation Error",
          description: "All centre capacities must be greater than 0",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      if (assignment.shifts.length === 0) {
        toast({
          title: "Validation Error",
          description: "Each centre must have at least one shift assigned",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      for (const shift of assignment.shifts) {
        if (shift.capacity <= 0) {
          toast({
            title: "Validation Error",
            description: "All shift capacities must be greater than 0",
            variant: "destructive",
            duration: 3000
          });
          // return; // Allow 0 for specific shifts momentarily? No, strict validation is safer.
          // Wait, the error description says "greater than 0".
          return;
        }
      }
    }

    try {
      setSaving(true);

      const result = await saveExamAssignments(selectedExam, selectedDate, centreAssignments);

      if (result.error) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Exam assignments saved successfully",
      });

      loadExistingAssignments();
    } catch (error: any) {
      console.error("Error saving assignments:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save assignments",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCentreName = (centreId: string) => {
    const centre = centres.find((c) => c.id === centreId);
    return centre ? `${centre.centre_name} (${centre.city})` : "";
  };

  const getShiftName = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return "";
    return `${shift.shift_name} (${format(new Date(`2000-01-01T${shift.start_time}`), "HH:mm")} - ${format(new Date(`2000-01-01T${shift.end_time}`), "HH:mm")})`;
  };

  const getAvailableCentres = (currentCentreId?: string) => {
    const assignedCentreIds = centreAssignments
      .map((a) => a.centreId)
      .filter((id) => id && id !== currentCentreId);
    return centres.filter((c) => !assignedCentreIds.includes(c.id));
  };

  const getAvailableShifts = (centreIndex: number) => {
    const assignedShiftIds = centreAssignments[centreIndex].shifts.map(
      (s) => s.shiftId,
    );
    return shifts.filter((s) => !assignedShiftIds.includes(s.id));
  };

  // Helper function to convert date to IST (Indian Standard Time - UTC+5:30)
  const toISTDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Add 5 hours 30 minutes for IST
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return istDate;
  };

  // Helper function to normalize date to YYYY-MM-DD in IST
  const normalizeDateIST = (dateStr: string) => {
    // Handle both date strings and ISO timestamps
    if (dateStr.includes("T")) {
      const parts = dateStr.split("T")[0];
      return parts;
    }
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Otherwise parse and format in IST
    const date = new Date(dateStr);
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istDate.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Exam Centre & Shift Assignment
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Assign centres and shifts to exams for specific dates
          </p>
        </CardHeader>
      </Card>

      {/* Exam and Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Select Exam & Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr,auto]">
            <div className="space-y-2">
              <Label>Exam *</Label>
              <Popover
                open={openExamDropdown}
                onOpenChange={setOpenExamDropdown}
                modal={false}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openExamDropdown}
                    className="w-full justify-between"
                  >
                    {selectedExam
                      ? exams.find((exam) => exam.id === selectedExam)
                          ?.exam_name +
                        " (" +
                        exams.find((exam) => exam.id === selectedExam)
                          ?.exam_code +
                        ")"
                      : "Select exam..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="flex items-center border-b px-3">
                    <svg
                      className="mr-2 h-4 w-4 shrink-0 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search exam..."
                      className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {exams
                      .filter(
                        (exam) =>
                          exam.exam_name
                            .toLowerCase()
                            .includes(examSearch.toLowerCase()) ||
                          exam.exam_code
                            .toLowerCase()
                            .includes(examSearch.toLowerCase()),
                      )
                      .map((exam) => (
                        <div
                          key={exam.id}
                          className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                          onClick={() => {
                            console.log("Clicked exam", exam.id);
                            setSelectedExam(exam.id);
                            setOpenExamDropdown(false);
                            setExamSearch("");
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedExam === exam.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {exam.exam_name} ({exam.exam_code})
                        </div>
                      ))}
                    {exams.filter(
                      (exam) =>
                        exam.exam_name
                          .toLowerCase()
                          .includes(examSearch.toLowerCase()) ||
                        exam.exam_code
                          .toLowerCase()
                          .includes(examSearch.toLowerCase()),
                    ).length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No exam found.
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={exams.find((e) => e.id === selectedExam)?.start_date}
                max={exams.find((e) => e.id === selectedExam)?.end_date}
                disabled={!selectedExam}
                className="w-[180px]"
              />
              {selectedExam && (
                <p className="text-xs text-muted-foreground">
                  Exam Period:{" "}
                  {(() => {
                    const exam = exams.find((e) => e.id === selectedExam);
                    if (!exam) return "";
                    return `${format(toISTDate(exam.start_date), "MMM dd, yyyy")} - ${format(toISTDate(exam.end_date), "MMM dd, yyyy")}`;
                  })()}{" "}
                  (IST)
                </p>
              )}
            </div>
          </div>
          {selectedDate &&
            selectedExam &&
            (() => {
              const exam = exams.find((e) => e.id === selectedExam);
              if (!exam) return null;

              const selectedDateNormalized = normalizeDateIST(selectedDate);
              const startDateNormalized = normalizeDateIST(exam.start_date);
              const endDateNormalized = normalizeDateIST(exam.end_date);

              console.log("Date comparison:", {
                selected: selectedDateNormalized,
                start: startDateNormalized,
                end: endDateNormalized,
                isValid:
                  selectedDateNormalized >= startDateNormalized &&
                  selectedDateNormalized <= endDateNormalized,
              });

              const isDateValid =
                selectedDateNormalized >= startDateNormalized &&
                selectedDateNormalized <= endDateNormalized;

              if (!isDateValid) {
                return (
                  <div className="px-6 pb-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <svg
                          className="h-5 w-5 text-yellow-400 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Invalid Date Selection
                          </h3>
                          <p className="mt-1 text-sm text-yellow-700">
                            Please select a date within the exam period (
                            {format(toISTDate(exam.start_date), "MMM dd, yyyy")}{" "}
                            - {format(toISTDate(exam.end_date), "MMM dd, yyyy")}{" "}
                            IST)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
        </CardContent>
      </Card>

      {/* Centre and Shift Assignments */}
      {selectedExam &&
        selectedDate &&
        (() => {
          const exam = exams.find((e) => e.id === selectedExam);
          if (!exam) return false;

          const selectedDateNormalized = normalizeDateIST(selectedDate);
          const startDateNormalized = normalizeDateIST(exam.start_date);
          const endDateNormalized = normalizeDateIST(exam.end_date);

          return (
            selectedDateNormalized >= startDateNormalized &&
            selectedDateNormalized <= endDateNormalized
          );
        })() && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Centre & Shift Assignments
                </CardTitle>
                <Button
                  onClick={addCentreAssignment}
                  disabled={
                    loading || saving || getAvailableCentres().length === 0
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Centre
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : centreAssignments.length === 0 ? (
                <div className="text-center p-12">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No Assignments Yet
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Click "Add Centre" to start assigning centres and shifts
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {centreAssignments.map((assignment, centreIndex) => (
                    <Card key={centreIndex} className="border-2">
                      <CardContent className="pt-6 space-y-4">
                        {/* Centre Selection */}
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                            <Label>Centre *</Label>
                            <Popover
                              open={openCentreDropdowns[centreIndex]}
                              onOpenChange={(open) =>
                                setOpenCentreDropdowns({
                                  ...openCentreDropdowns,
                                  [centreIndex]: open,
                                })
                              }
                              modal={false}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={
                                    openCentreDropdowns[centreIndex]
                                  }
                                  className="w-full justify-between"
                                  disabled={saving}
                                >
                                  {assignment.centreId
                                    ? getCentreName(assignment.centreId)
                                    : "Select centre..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full p-0"
                                style={{
                                  width: "var(--radix-popover-trigger-width)",
                                }}
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                              >
                                <div className="flex items-center border-b px-3">
                                  <svg
                                    className="mr-2 h-4 w-4 shrink-0 opacity-50"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                  </svg>
                                  <input
                                    type="text"
                                    placeholder="Search centre..."
                                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                    value={centreSearch[centreIndex] || ""}
                                    onChange={(e) =>
                                      setCentreSearch({
                                        ...centreSearch,
                                        [centreIndex]: e.target.value,
                                      })
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-1">
                                  {getAvailableCentres(assignment.centreId)
                                    .filter(
                                      (centre) =>
                                        centre.centre_name
                                          .toLowerCase()
                                          .includes(
                                            (
                                              centreSearch[centreIndex] || ""
                                            ).toLowerCase(),
                                          ) ||
                                        centre.city
                                          .toLowerCase()
                                          .includes(
                                            (
                                              centreSearch[centreIndex] || ""
                                            ).toLowerCase(),
                                          ),
                                    )
                                    .map((centre) => (
                                      <div
                                        key={centre.id}
                                        className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                                        onClick={() => {
                                          updateCentreAssignment(
                                            centreIndex,
                                            "centreId",
                                            centre.id,
                                          );
                                          setOpenCentreDropdowns({
                                            ...openCentreDropdowns,
                                            [centreIndex]: false,
                                          });
                                          setCentreSearch({
                                            ...centreSearch,
                                            [centreIndex]: "",
                                          });
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            assignment.centreId === centre.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        {centre.centre_name} - {centre.city}{" "}
                                        (Max: {centre.capacity})
                                      </div>
                                    ))}
                                  {getAvailableCentres(
                                    assignment.centreId,
                                  ).filter(
                                    (centre) =>
                                      centre.centre_name
                                        .toLowerCase()
                                        .includes(
                                          (
                                            centreSearch[centreIndex] || ""
                                          ).toLowerCase(),
                                        ) ||
                                      centre.city
                                        .toLowerCase()
                                        .includes(
                                          (
                                            centreSearch[centreIndex] || ""
                                          ).toLowerCase(),
                                        ),
                                  ).length === 0 && (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                      No centre found.
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="w-32 space-y-2">
                            <Label>Capacity *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={assignment.capacity || ""}
                              onChange={(e) =>
                                updateCentreAssignment(
                                  centreIndex,
                                  "capacity",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              disabled={saving}
                            />
                          </div>

                          <div className="flex items-end">
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() =>
                                removeCentreAssignment(centreIndex)
                              }
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Shifts Section */}
                        {assignment.centreId && (
                          <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                Shifts
                              </Label>
                              {getAvailableShifts(centreIndex).length > 0 && (
                                <Popover
                                  open={openShiftDropdowns[centreIndex]}
                                  onOpenChange={(open) =>
                                    setOpenShiftDropdowns({
                                      ...openShiftDropdowns,
                                      [centreIndex]: open,
                                    })
                                  }
                                  modal={false}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      role="combobox"
                                      aria-expanded={
                                        openShiftDropdowns[centreIndex]
                                      }
                                      className="w-[250px] justify-between"
                                      disabled={saving}
                                    >
                                      Add shift...
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-full p-0"
                                    style={{
                                      width:
                                        "var(--radix-popover-trigger-width)",
                                    }}
                                    align="end"
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                  >
                                    <div className="flex items-center border-b px-3">
                                      <svg
                                        className="mr-2 h-4 w-4 shrink-0 opacity-50"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                      </svg>
                                      <input
                                        type="text"
                                        placeholder="Search shift..."
                                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                        value={shiftSearch[centreIndex] || ""}
                                        onChange={(e) =>
                                          setShiftSearch({
                                            ...shiftSearch,
                                            [centreIndex]: e.target.value,
                                          })
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-1">
                                      {getAvailableShifts(centreIndex)
                                        .filter((shift) =>
                                          shift.shift_name
                                            .toLowerCase()
                                            .includes(
                                              (
                                                shiftSearch[centreIndex] || ""
                                              ).toLowerCase(),
                                            ),
                                        )
                                        .map((shift) => (
                                          <div
                                            key={shift.id}
                                            className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                                            onClick={() => {
                                              addShiftToAssignment(
                                                centreIndex,
                                                shift.id,
                                              );
                                              setOpenShiftDropdowns({
                                                ...openShiftDropdowns,
                                                [centreIndex]: false,
                                              });
                                              setShiftSearch({
                                                ...shiftSearch,
                                                [centreIndex]: "",
                                              });
                                            }}
                                          >
                                            {shift.shift_name}
                                          </div>
                                        ))}
                                      {getAvailableShifts(centreIndex).filter(
                                        (shift) =>
                                          shift.shift_name
                                            .toLowerCase()
                                            .includes(
                                              (
                                                shiftSearch[centreIndex] || ""
                                              ).toLowerCase(),
                                            ),
                                      ).length === 0 && (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                          No shift found.
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>

                            {assignment.shifts.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No shifts assigned. Add a shift using the
                                dropdown above.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {assignment.shifts.map((shift, shiftIndex) => (
                                  <div
                                    key={shiftIndex}
                                    className="flex gap-2 items-center bg-gray-50 p-3 rounded"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {getShiftName(shift.shiftId)}
                                      </p>
                                    </div>
                                    <div className="w-32">
                                      <Input
                                        type="number"
                                        min="1"
                                        placeholder="Capacity"
                                        value={shift.capacity || ""}
                                        onChange={(e) =>
                                          updateShiftCapacity(
                                            centreIndex,
                                            shiftIndex,
                                            parseInt(e.target.value) || 0,
                                          )
                                        }
                                        disabled={saving}
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        removeShiftFromAssignment(
                                          centreIndex,
                                          shiftIndex,
                                        )
                                      }
                                      disabled={saving}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Assignments
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
