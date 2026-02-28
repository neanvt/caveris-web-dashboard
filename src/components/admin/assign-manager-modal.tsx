"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  MapPin,
  Clock,
  CheckSquare,
  Trash2,
  Plus,
  Building2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getManagerAssignments,
  deleteManagerAssignment,
  getMasterCentres,
  getMasterShifts,
  getExams,
} from "@/app/actions/supabase-actions";
import { createClient } from "@/lib/supabase/client";

interface Manager {
  id: string;
  full_name: string;
  email: string;
}

interface MasterCentre {
  id: string;
  centre_name: string;
  centre_code: string;
  city: string;
  state?: string;
}

interface MasterShift {
  id: string;
  shift_name: string;
  shift_code: string;
  start_time: string | null;
  end_time: string | null;
  exam_id?: string | null;
}

interface Exam {
  id: string;
  exam_name: string;
  exam_code: string;
}

interface Assignment {
  id: string;
  exam_name: string | null;
  exam_code: string | null;
  centre_name: string;
  centre_code: string;
  city: string;
  shift_name: string;
  shift_code: string;
  start_time: string | null;
  end_time: string | null;
  assigned_at: string | null;
}

interface AssignManagerModalProps {
  open: boolean;
  onClose: () => void;
  manager: Manager;
  onSuccess?: () => void;
}

type Tab = "current" | "new";

export function AssignManagerModal({
  open,
  onClose,
  manager,
  onSuccess,
}: AssignManagerModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("current");

  // Data lists
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [masterCentres, setMasterCentres] = useState<MasterCentre[]>([]);
  const [masterShifts, setMasterShifts] = useState<MasterShift[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  // Loading states
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New assignment form state
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedCentres, setSelectedCentres] = useState<Set<string>>(new Set());
  const [selectedShift, setSelectedShift] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");
  const [centreSearch, setCentreSearch] = useState("");

  const loadAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const result = await getManagerAssignments(manager.id);
      setAssignments(result.data || []);
    } catch (e) {
      console.error("Error loading assignments:", e);
      toast.error("Failed to load current assignments");
    } finally {
      setLoadingAssignments(false);
    }
  }, [manager.id]);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadAssignments();
      loadMetadata();
      setActiveTab("current");
    }
  }, [open, loadAssignments]);

  // Reset new assignment form when switching tabs
  useEffect(() => {
    if (activeTab === "new") {
      setSelectedExam("");
      setSelectedCentres(new Set());
      setSelectedShift("");
      setAssignmentDate("");
      setCentreSearch("");
    }
  }, [activeTab]);

  const loadMetadata = async () => {
    setLoadingMeta(true);
    try {
      const [centresData, shiftsData, examsData] = await Promise.all([
        getMasterCentres(),
        getMasterShifts(),
        getExams(),
      ]);
      setMasterCentres(centresData || []);
      setMasterShifts(shiftsData || []);
      setExams(examsData || []);
    } catch (e) {
      console.error("Error loading metadata:", e);
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    setDeletingId(assignmentId);
    try {
      const result = await deleteManagerAssignment(assignmentId);
      if (result.success) {
        toast.success("Assignment removed successfully");
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to remove assignment");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setDeletingId(null);
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

  const toggleAllCentres = () => {
    const filtered = filteredCentres;
    const allSelected = filtered.every((c) => selectedCentres.has(c.id));
    const newSelected = new Set(selectedCentres);
    if (allSelected) {
      filtered.forEach((c) => newSelected.delete(c.id));
    } else {
      filtered.forEach((c) => newSelected.add(c.id));
    }
    setSelectedCentres(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedCentres.size === 0 || !selectedShift || !assignmentDate) {
      toast.error("Please select at least one centre, a shift, and a date");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const centreIds = Array.from(selectedCentres);
      let successCount = 0;
      let skipCount = 0;

      for (const centreId of centreIds) {
        // Check for existing duplicate
        const { data: existing } = await supabase
          .from("manager_centre_assignments")
          .select("id")
          .eq("manager_id", manager.id)
          .eq("centre_id", centreId)
          .eq("shift_id", selectedShift)
          .eq("assigned_at", assignmentDate)
          .maybeSingle();

        if (existing) {
          skipCount++;
          continue;
        }

        const record: {
          manager_id: string;
          centre_id: string;
          shift_id: string;
          assigned_at: string;
          assigned_by: string;
          exam_id?: string;
        } = {
          manager_id: manager.id,
          centre_id: centreId,
          shift_id: selectedShift,
          assigned_at: assignmentDate,
          assigned_by: user.id,
        };

        if (selectedExam && selectedExam !== "none") {
          record.exam_id = selectedExam;
        }

        const { error } = await supabase
          .from("manager_centre_assignments")
          .insert(record);

        if (error) {
          console.error("Error creating assignment:", error);
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        const msg =
          skipCount > 0
            ? `Assigned ${successCount} centre(s). ${skipCount} duplicate(s) skipped.`
            : `Assigned ${successCount} centre(s) to ${manager.full_name}`;
        toast.success(msg);
        await loadAssignments();
        onSuccess?.();
        setActiveTab("current");
      } else if (skipCount > 0) {
        toast.info(`All ${skipCount} selected assignment(s) already exist`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCentres = masterCentres.filter(
    (c) =>
      !centreSearch ||
      c.centre_name.toLowerCase().includes(centreSearch.toLowerCase()) ||
      c.city.toLowerCase().includes(centreSearch.toLowerCase()) ||
      c.centre_code.toLowerCase().includes(centreSearch.toLowerCase()),
  );

  const allFilteredSelected =
    filteredCentres.length > 0 &&
    filteredCentres.every((c) => selectedCentres.has(c.id));

  const formatTime = (t: string | null) => {
    if (!t) return "";
    return t.slice(0, 5); // HH:MM
  };

  const canSubmit =
    selectedCentres.size > 0 && selectedShift && assignmentDate && !submitting;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold text-lg shrink-0">
              {manager.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold">{manager.full_name}</p>
              <p className="text-xs text-gray-500 font-normal">{manager.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tab Bar */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setActiveTab("current")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === "current"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Current Assignments
            {assignments.length > 0 && (
              <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                {assignments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === "new"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Plus className="h-4 w-4" />
            New Assignment
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── CURRENT ASSIGNMENTS TAB ── */}
          {activeTab === "current" && (
            <div className="py-4 space-y-3">
              {loadingAssignments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-500">Loading assignments...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-600">No assignments yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Use the &ldquo;New Assignment&rdquo; tab to assign centres and shifts
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-purple-300 text-purple-600 hover:bg-purple-50"
                    onClick={() => setActiveTab("new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Assignment
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-gray-500">
                      {assignments.length} assignment(s) found
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadAssignments}
                      className="h-7 px-2 text-xs text-gray-500"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-lg border border-gray-100 bg-gray-50 p-3 hover:border-purple-200 hover:bg-purple-50/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Exam Badge */}
                            {assignment.exam_name ? (
                              <Badge
                                variant="secondary"
                                className="mb-1.5 text-xs bg-purple-100 text-purple-700 border-0"
                              >
                                {assignment.exam_name}
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="mb-1.5 text-xs bg-gray-100 text-gray-500 border-0"
                              >
                                No Exam Linked
                              </Badge>
                            )}
                            {/* Centre */}
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                              <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                              <span className="truncate">{assignment.centre_name}</span>
                              {assignment.centre_code && (
                                <span className="text-xs text-gray-400 shrink-0">
                                  ({assignment.centre_code})
                                </span>
                              )}
                            </div>
                            {assignment.city && (
                              <p className="text-xs text-gray-500 ml-5">{assignment.city}</p>
                            )}
                            {/* Shift */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                              <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              <span>{assignment.shift_name}</span>
                              {assignment.start_time && assignment.end_time && (
                                <span className="text-gray-400">
                                  • {formatTime(assignment.start_time)} – {formatTime(assignment.end_time)}
                                </span>
                              )}
                            </div>
                            {/* Date */}
                            {assignment.assigned_at && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {new Date(assignment.assigned_at).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(assignment.id)}
                            disabled={deletingId === assignment.id}
                            className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            {deletingId === assignment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── NEW ASSIGNMENT TAB ── */}
          {activeTab === "new" && (
            <div className="py-4 space-y-5">
              {loadingMeta && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
                  <span className="text-sm text-gray-500">Loading data...</span>
                </div>
              )}

              {/* Exam Selection (Optional) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Link to Exam
                  <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exam (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No exam link</SelectItem>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.exam_name}
                        {exam.exam_code && (
                          <span className="ml-2 text-gray-400 text-xs">({exam.exam_code})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Centre Multi-Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Select Centres *
                    {selectedCentres.size > 0 && (
                      <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                        {selectedCentres.size} selected
                      </span>
                    )}
                  </label>
                  {filteredCentres.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllCentres}
                      className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700"
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      {allFilteredSelected ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                {/* Search Centres */}
                <Input
                  placeholder="Search by name, city, or code..."
                  value={centreSearch}
                  onChange={(e) => setCentreSearch(e.target.value)}
                  className="h-8 text-sm"
                />

                {/* Centre List */}
                <div className="max-h-44 overflow-y-auto rounded-lg border p-2 space-y-1">
                  {masterCentres.length === 0 && !loadingMeta ? (
                    <div className="flex items-center justify-center py-4 text-sm text-gray-400">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      No centres available
                    </div>
                  ) : filteredCentres.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">
                      No centres match your search
                    </p>
                  ) : (
                    filteredCentres.map((centre) => (
                      <div
                        key={centre.id}
                        onClick={() => toggleCentre(centre.id)}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                          selectedCentres.has(centre.id)
                            ? "bg-purple-50 border border-purple-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Checkbox
                          id={`centre-${centre.id}`}
                          checked={selectedCentres.has(centre.id)}
                          onCheckedChange={() => toggleCentre(centre.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {centre.centre_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {centre.city}
                            {centre.centre_code && ` • ${centre.centre_code}`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shift Selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Select Shift *
                </label>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterShifts.length === 0 ? (
                      <div className="py-3 text-center text-sm text-gray-400">
                        No shifts available
                      </div>
                    ) : (
                      masterShifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          <span className="font-medium">{shift.shift_name}</span>
                          {shift.start_time && shift.end_time && (
                            <span className="ml-2 text-gray-400 text-xs">
                              ({formatTime(shift.start_time)} – {formatTime(shift.end_time)})
                            </span>
                          )}
                          {shift.shift_code && (
                            <span className="ml-2 text-gray-300 text-xs">
                              [{shift.shift_code}]
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Assignment Date *
                </label>
                <Input
                  type="date"
                  value={assignmentDate}
                  onChange={(e) => setAssignmentDate(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Summary before submit */}
              {selectedCentres.size > 0 && selectedShift && assignmentDate && (
                <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                    Assignment Summary
                  </p>
                  <div className="text-sm text-gray-700 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-purple-400" />
                      <span>
                        {selectedCentres.size} centre{selectedCentres.size > 1 ? "s" : ""} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span>
                        {masterShifts.find((s) => s.id === selectedShift)?.shift_name || ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-green-400" />
                      <span>
                        {new Date(assignmentDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t shrink-0">
          <Button variant="outline" onClick={onClose} disabled={submitting || !!deletingId}>
            Close
          </Button>
          {activeTab === "new" && (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign {selectedCentres.size > 0 && `(${selectedCentres.size})`}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
