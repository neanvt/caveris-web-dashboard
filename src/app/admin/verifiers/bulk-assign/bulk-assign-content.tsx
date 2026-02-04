"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckSquare,
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
}

interface Shift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
}

interface Verifier {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
}

export function BulkAssignmentContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Selection states
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedCentre, setSelectedCentre] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [selectedVerifiers, setSelectedVerifiers] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadCentres();
    } else {
      setCentres([]);
      setSelectedCentre("");
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedCentre) {
      loadShifts();
    } else {
      setShifts([]);
      setSelectedShift("");
    }
  }, [selectedCentre]);

  useEffect(() => {
    if (selectedExam && selectedCentre && selectedShift && selectedDate) {
      loadUnassignedVerifiers();
    } else {
      setVerifiers([]);
    }
  }, [selectedExam, selectedCentre, selectedShift, selectedDate]);

  const loadExams = async () => {
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
        .order("start_date", { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error("Error loading exams:", error);
    }
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

  const loadUnassignedVerifiers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get all verifiers created by this admin
      const { data: allVerifiers, error: verifiersError } = await supabase
        .from("users")
        .select("id, full_name, email, phone, city")
        .eq("role", "verifier")
        .eq("created_by", user.id)
        .eq("is_active", true)
        .order("full_name");

      if (verifiersError) throw verifiersError;

      // Get already assigned verifiers for this exam, centre, shift, and date
      const { data: assignments, error: assignmentsError } = await supabase
        .from("verifier_assignments")
        .select("verifier_id")
        .eq("exam_id", selectedExam)
        .eq("centre_id", selectedCentre)
        .eq("shift_id", selectedShift)
        .eq("assignment_date", selectedDate);

      if (assignmentsError) throw assignmentsError;

      const assignedIds = new Set(assignments?.map((a) => a.verifier_id) || []);
      const unassigned =
        allVerifiers?.filter((v) => !assignedIds.has(v.id)) || [];

      setVerifiers(unassigned);
      setSelectedVerifiers(new Set());
    } catch (error) {
      console.error("Error loading verifiers:", error);
      toast({
        title: "Error Loading Verifiers",
        description: "Could not fetch unassigned verifiers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerifier = (verifierId: string) => {
    const newSelected = new Set(selectedVerifiers);
    if (newSelected.has(verifierId)) {
      newSelected.delete(verifierId);
    } else {
      newSelected.add(verifierId);
    }
    setSelectedVerifiers(newSelected);
  };

  const toggleAll = () => {
    if (selectedVerifiers.size === verifiers.length) {
      setSelectedVerifiers(new Set());
    } else {
      setSelectedVerifiers(new Set(verifiers.map((v) => v.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedVerifiers.size === 0) {
      toast({
        title: "No Verifiers Selected",
        description: "Please select at least one verifier to assign",
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const assignments = Array.from(selectedVerifiers).map((verifierId) => ({
        verifier_id: verifierId,
        exam_id: selectedExam,
        centre_id: selectedCentre,
        shift_id: selectedShift,
        assignment_date: selectedDate,
        assigned_by: user.id,
      }));

      const { error } = await supabase
        .from("verifier_assignments")
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Assignment Successful",
        description: `${selectedVerifiers.size} verifier(s) assigned successfully`,
      });

      // Reload unassigned verifiers
      loadUnassignedVerifiers();
    } catch (error: any) {
      console.error("Error assigning verifiers:", error);
      toast({
        title: "Assignment Failed",
        description: error.message || "Could not assign verifiers",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-green-600" />
            Bulk Verifier Assignment
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Assign multiple verifiers to an exam, centre, shift, and date
          </p>
        </CardHeader>
      </Card>

      {/* Selection Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exam Selection - Full Width */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              <Calendar className="inline h-4 w-4 mr-1" />
              Exam *
            </label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.exam_name} ({exam.exam_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Centre, Shift, and Date - Three Columns */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Centre Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                <MapPin className="inline h-4 w-4 mr-1" />
                Centre *
              </label>
              <Select
                value={selectedCentre}
                onValueChange={setSelectedCentre}
                disabled={!selectedExam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a centre" />
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
                Shift *
              </label>
              <Select
                value={selectedShift}
                onValueChange={setSelectedShift}
                disabled={!selectedCentre}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a shift" />
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
                Date *
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!selectedShift}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifiers List */}
      {selectedExam && selectedCentre && selectedShift && selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Unassigned Verifiers ({verifiers.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAll}
                  disabled={verifiers.length === 0}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {selectedVerifiers.size === verifiers.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Button
                  onClick={handleBulkAssign}
                  disabled={selectedVerifiers.size === 0 || assigning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Assign{" "}
                      {selectedVerifiers.size > 0 &&
                        `(${selectedVerifiers.size})`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : verifiers.length === 0 ? (
              <div className="text-center p-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No Unassigned Verifiers
                </h3>
                <p className="mt-2 text-gray-600">
                  All verifiers have been assigned to this combination
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedVerifiers.size === verifiers.length &&
                          verifiers.length > 0
                        }
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiers.map((verifier) => (
                    <TableRow key={verifier.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedVerifiers.has(verifier.id)}
                          onCheckedChange={() => toggleVerifier(verifier.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {verifier.full_name}
                      </TableCell>
                      <TableCell>{verifier.email}</TableCell>
                      <TableCell>{verifier.phone}</TableCell>
                      <TableCell>{verifier.city || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
