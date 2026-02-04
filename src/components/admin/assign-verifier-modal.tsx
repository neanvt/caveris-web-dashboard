"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

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

interface Exam {
  id: string;
  exam_name: string;
  exam_code: string;
  start_date: string;
  end_date: string;
  status: string;
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
  start_time: string;
  end_time: string;
}

interface AssignVerifierModalProps {
  open: boolean;
  onClose: () => void;
  verifier: Verifier | null;
  onSuccess: () => void;
}

export function AssignVerifierModal({
  open,
  onClose,
  verifier,
  onSuccess,
}: AssignVerifierModalProps) {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedCentre, setSelectedCentre] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [examDateFilter, setExamDateFilter] = useState<string>("");
  const [assignmentDate, setAssignmentDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadExams();
      setSelectedExam("");
      setSelectedCentre("");
      setSelectedShift("");
      setAssignmentDate("");
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
      setSelectedCentre("");
      setSelectedShift("");
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedCentre) {
      loadShifts();
      setSelectedShift("");
    }
  }, [selectedCentre]);

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
        .select("*")
        .eq("admin_id", user.id)
        .in("status", ["draft", "scheduled", "ongoing"])
        .order("start_date", { ascending: true });

      if (error) throw error;
      setAllExams(data || []);
      setExams(data || []);
    } catch (error) {
      console.error("Error loading exams:", error);
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
        .select("*")
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
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("centre_id", selectedCentre)
        .order("start_time");

      if (error) throw error;
      setShifts(data || []);
    } catch (error) {
      console.error("Error loading shifts:", error);
    }
  };

  const onSubmit = async () => {
    if (
      !verifier ||
      !selectedExam ||
      !selectedCentre ||
      !selectedShift ||
      !assignmentDate
    ) {
      toast({
        title: "All Fields Required",
        description: "Please select exam, centre, shift, and date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if assignment already exists
      const { data: existing } = await supabase
        .from("verifier_assignments")
        .select("*")
        .eq("verifier_id", verifier.id)
        .eq("exam_id", selectedExam)
        .eq("centre_id", selectedCentre)
        .eq("shift_id", selectedShift)
        .eq("assignment_date", assignmentDate)
        .limit(1);

      if (existing && existing.length > 0) {
        toast({
          title: "Already Assigned",
          description: "This verifier is already assigned to this combination",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create assignment
      const { error } = await supabase.from("verifier_assignments").insert({
        verifier_id: verifier.id,
        exam_id: selectedExam,
        centre_id: selectedCentre,
        shift_id: selectedShift,
        assignment_date: assignmentDate,
        assigned_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Assignment Successful",
        description: `${verifier.full_name} has been assigned successfully`,
      });

      setSelectedExam("");
      setSelectedCentre("");
      setSelectedShift("");
      setAssignmentDate("");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error assigning verifier:", error);
      toast({
        title: "Assignment Failed",
        description: error.message || "Could not assign verifier to exam",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!verifier) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Assign Verifier to Exam</DialogTitle>
          <DialogDescription>
            Assign {verifier.full_name} to an exam for verification duties
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Verifier Info */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Verifier</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {verifier.full_name}
            </p>
            <p className="text-sm text-gray-600">{verifier.email}</p>
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
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
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

          {/* Centre Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              <MapPin className="inline h-4 w-4 mr-1" />
              Select Centre *
            </label>
            <Select
              value={selectedCentre}
              onValueChange={setSelectedCentre}
              disabled={!selectedExam}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a centre" />
              </SelectTrigger>
              <SelectContent>
                {centres.map((centre) => (
                  <SelectItem key={centre.id} value={centre.id}>
                    {centre.centre_name} ({centre.city})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              <Clock className="inline h-4 w-4 mr-1" />
              Select Shift *
            </label>
            <Select
              value={selectedShift}
              onValueChange={setSelectedShift}
              disabled={!selectedCentre}
            >
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

          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              <Calendar className="inline h-4 w-4 mr-1" />
              Assignment Date *
            </label>
            <Input
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
              disabled={!selectedShift}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !selectedExam || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Verifier"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
