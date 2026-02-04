"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Calendar,
  MapPin,
  Clock,
  User,
  CheckSquare,
} from "lucide-react";
import { format } from "date-fns";

interface Manager {
  id: string;
  full_name: string;
  email: string;
}

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
  city: string;
  exam_id: string;
}

interface Shift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  centre_id: string;
}

interface AssignManagerModalProps {
  open: boolean;
  onClose: () => void;
  manager: Manager;
}

export function AssignManagerModal({
  open,
  onClose,
  manager,
}: AssignManagerModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [exams, setExams] = useState<Exam[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");
  const [examDateFilter, setExamDateFilter] = useState("");
  const [selectedCentres, setSelectedCentres] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (open) {
      loadExams();
    }
  }, [open]);

  useEffect(() => {
    if (examDateFilter && allExams.length > 0) {
      filterExamsByDate();
    } else {
      setExams(allExams);
    }
  }, [examDateFilter, allExams]);

  useEffect(() => {
    if (selectedExam) {
      loadCentres();
      setSelectedShift("");
      setSelectedCentres(new Set());
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedExam && selectedCentres.size > 0) {
      loadShifts();
    }
  }, [selectedExam, selectedCentres]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("exams")
        .select("id, exam_name, exam_code, start_date, end_date")
        .eq("admin_id", user.id)
        .in("status", ["scheduled", "ongoing", "active"])
        .order("start_date", { ascending: true });

      if (error) throw error;
      setAllExams(data || []);
      setExams(data || []);
    } catch (error) {
      console.error("Error loading exams:", error);
      toast({
        title: "Error",
        description: "Failed to load exams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterExamsByDate = () => {
    if (!examDateFilter) {
      setExams(allExams);
      return;
    }

    const filtered = allExams.filter((exam: Exam) => {
      const filterDateStr = examDateFilter; // Format: YYYY-MM-DD
      const startDateStr = exam.start_date.split("T")[0]; // Get YYYY-MM-DD part
      const endDateStr = exam.end_date.split("T")[0]; // Get YYYY-MM-DD part

      return filterDateStr >= startDateStr && filterDateStr <= endDateStr;
    });

    setExams(filtered);
  };

  const loadCentres = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("centres")
        .select("id, centre_name, city, exam_id")
        .eq("exam_id", selectedExam)
        .order("centre_name");

      if (error) throw error;
      setCentres(data || []);
    } catch (error) {
      console.error("Error loading centres:", error);
    }
  };

  const loadShifts = async () => {
    try {
      const supabase = createClient();

      // Get shifts for ALL selected centres
      const centreIds = Array.from(selectedCentres);
      const { data, error } = await supabase
        .from("shifts")
        .select("id, shift_name, start_time, end_time, centre_id")
        .in("centre_id", centreIds)
        .order("start_time");

      if (error) throw error;

      // Remove duplicates based on shift_name and time
      const uniqueShifts = data?.reduce((acc: Shift[], current) => {
        const exists = acc.find(
          (shift) =>
            shift.shift_name === current.shift_name &&
            shift.start_time === current.start_time &&
            shift.end_time === current.end_time,
        );
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      setShifts(uniqueShifts || []);
    } catch (error) {
      console.error("Error loading shifts:", error);
    }
  };

  const toggleCentre = (centreId: string) => {
    const newSelected = new Set(selectedCentres);
    if (newSelected.has(centreId)) {
      newSelected.delete(centreId);
    } else {
      newSelected.add(centreId);
    }
    setSelectedCentres(newSelected);
  };

  const toggleAll = () => {
    if (selectedCentres.size === centres.length) {
      setSelectedCentres(new Set());
    } else {
      setSelectedCentres(new Set(centres.map((c) => c.id)));
    }
  };

  const onSubmit = async () => {
    if (
      !selectedExam ||
      selectedCentres.size === 0 ||
      !selectedShift ||
      !assignmentDate
    ) {
      toast({
        title: "Missing Information",
        description: "Please select exam, centres, shift, and date",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Create assignments for all selected centres
      const assignments = Array.from(selectedCentres).map((centreId) => ({
        manager_id: manager.id,
        exam_id: selectedExam,
        centre_id: centreId,
        shift_id: selectedShift,
        assignment_date: assignmentDate,
        assigned_by: user.id,
      }));

      // Check for duplicates
      for (const assignment of assignments) {
        const { data: existing } = await supabase
          .from("manager_centre_assignments")
          .select("id")
          .eq("manager_id", assignment.manager_id)
          .eq("exam_id", assignment.exam_id)
          .eq("centre_id", assignment.centre_id)
          .eq("shift_id", assignment.shift_id)
          .eq("assignment_date", assignment.assignment_date)
          .limit(1);

        if (existing && existing.length > 0) {
          const centre = centres.find((c) => c.id === assignment.centre_id);
          toast({
            title: "Duplicate Assignment",
            description: `Manager is already assigned to ${centre?.centre_name} for this exam, shift, and date`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      // Insert all assignments
      const { error } = await supabase
        .from("manager_centre_assignments")
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assigned ${selectedCentres.size} centre(s) to ${manager.full_name}`,
      });

      // Reset form
      setSelectedExam("");
      setSelectedShift("");
      setAssignmentDate("");
      setSelectedCentres(new Set());
      onClose();
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      toast({
        title: "Failed to Assign",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Assign Centres to Manager</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Manager Info */}
          <div className="rounded-lg border bg-purple-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {manager.full_name}
                </p>
                <p className="text-sm text-gray-600">{manager.email}</p>
              </div>
            </div>
          </div>

          {/* Date Filter for Exams */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              <Calendar className="inline h-4 w-4 mr-1" />
              Filter Exams by Date (Optional)
            </label>
            <Input
              type="date"
              value={examDateFilter}
              onChange={(e) => setExamDateFilter(e.target.value)}
              placeholder="Filter exams by date"
            />
            {examDateFilter && (
              <p className="text-xs text-gray-500">
                Showing exams active on {format(new Date(examDateFilter), "PP")}
              </p>
            )}
          </div>

          {/* Exam Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              <Calendar className="inline h-4 w-4 mr-1" />
              Select Exam *
            </label>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : exams.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {examDateFilter
                    ? `No active exams on ${format(new Date(examDateFilter), "PP")}`
                    : "No active exams available"}
                </p>
                {examDateFilter && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => setExamDateFilter("")}
                  >
                    Clear date filter
                  </Button>
                )}
              </div>
            ) : (
              <>
                {examDateFilter && (
                  <p className="text-xs text-gray-500 mb-2">
                    {exams.length} exam(s) found
                  </p>
                )}
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.exam_name} ({exam.exam_code}) -{" "}
                        {format(new Date(exam.start_date), "dd MMM yyyy")} to{" "}
                        {format(new Date(exam.end_date), "dd MMM yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {/* Centres Selection */}
          {selectedExam && centres.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Select Centres * ({selectedCentres.size} selected)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAll}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {selectedCentres.size === centres.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border p-4 space-y-2">
                {centres.map((centre) => (
                  <div key={centre.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={centre.id}
                      checked={selectedCentres.has(centre.id)}
                      onCheckedChange={() => toggleCentre(centre.id)}
                    />
                    <label
                      htmlFor={centre.id}
                      className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {centre.centre_name} ({centre.city})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shift Selection */}
          {selectedCentres.size > 0 && shifts.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                <Clock className="inline h-4 w-4 mr-1" />
                Select Shift *
              </label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.shift_name} (
                      {format(new Date(shift.start_time), "HH:mm")} -{" "}
                      {format(new Date(shift.end_time), "HH:mm")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Selection */}
          {selectedShift && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                <Calendar className="inline h-4 w-4 mr-1" />
                Assignment Date *
              </label>
              <Input
                type="date"
                value={assignmentDate}
                onChange={(e) => setAssignmentDate(e.target.value)}
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={
                submitting ||
                !selectedExam ||
                selectedCentres.size === 0 ||
                !selectedShift ||
                !assignmentDate
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign {selectedCentres.size > 0 && `(${selectedCentres.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
