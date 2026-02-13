"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth-server";
import { hashPassword, generateDefaultPassword } from "@/lib/password-utils";

const calculateExamStatus = (start: string | Date, end: string | Date): string => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startStr = new Date(start).toISOString().split('T')[0];
  const endStr = new Date(end).toISOString().split('T')[0];

  if (todayStr > endStr) return "completed";
  if (todayStr >= startStr && todayStr <= endStr) return "ongoing";
  return "scheduled";
};

export async function getDashboardStats() {
  // ... (dashboard stats implementation details, referencing calculateExamStatus implicitly if needed, but not changing here)
  const session = await getAuthSession();
  if (!session) return null;

  const supabase = await createAdminClient();

  // Load exams for this admin
  const { data: exams, error: examsError } = await supabase
    .from("exams")
    .select("id, status, exam_name, exam_code")
    .eq("admin_id", session.userId);

  if (examsError) {
    console.error("Error fetching exams for stats:", examsError);
    return null;
  }

  const examIds = exams?.map((e) => e.id) || [];
  const activeExamsCount = exams?.filter((e) => e.status === "ongoing").length || 0;

  let candidateCount = 0;
  let verifiedCount = 0;
  let verifierCount = 0;

  if (examIds.length > 0) {
    // Parallel fetch for other stats
    const [candidates, todayVerifications, verifiers] = await Promise.all([
      supabase
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .in("exam_id", examIds),
      supabase
        .from("verifications")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().split("T")[0]),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "verifier")
        .eq("created_by", session.userId),
    ]);

    candidateCount = candidates.count || 0;
    verifiedCount = todayVerifications.count || 0;
    verifierCount = verifiers.count || 0;
  }

  return {
    totalExams: exams?.length || 0,
    activeExams: activeExamsCount,
    totalCandidates: candidateCount,
    verifiedToday: verifiedCount,
    pendingVerifications: Math.max(0, candidateCount - verifiedCount),
    activeVerifiers: verifierCount,
    exams: exams || [],
  };
}

export async function getExams() {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("admin_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching exams:", error);
    return [];
  }

  // Auto-update statuses if dates indicate a change

  const formattedData = data?.map((exam) => {
    // Only auto-update if not cancelled and dates are present
    if (exam.status !== 'cancelled' && exam.start_date && exam.end_date) {
        const correctStatus = calculateExamStatus(exam.start_date, exam.end_date);
        if (correctStatus !== exam.status && exam.status !== 'draft') {
            // Update DB in background
            void supabase.from('exams').update({ status: correctStatus }).eq('id', exam.id);
            return { ...exam, status: correctStatus };
        }
    }

    return {
      ...exam,
      start_date: exam.start_date ? exam.start_date.split('T')[0] : null,
      end_date: exam.end_date ? exam.end_date.split('T')[0] : null,
      exam_date: exam.exam_date ? exam.exam_date.split('T')[0] : null,
    };
  });

  return formattedData || [];
}

export async function getExam(examId: string) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single();

  if (error) return { error: error.message };

  // Auto-correct status on single fetch too
  if (data && data.status !== 'cancelled' && data.start_date && data.end_date) {
      const correctStatus = calculateExamStatus(data.start_date, data.end_date);
      if (correctStatus !== data.status && data.status !== 'draft') {
           await supabase.from('exams').update({ status: correctStatus }).eq('id', examId);
           data.status = correctStatus;
      }
  }

  return { data };
}

import { revalidatePath } from "next/cache";

export async function createExam(values: any) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  // Auto-calc status
  const status = calculateExamStatus(values.start_date, values.end_date);

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("exams")
    .insert({
      ...values,
      status: status,
      admin_id: session.userId,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  
  revalidatePath("/admin/exams");
  revalidatePath("/admin");
  return { success: true, data };
}

export async function updateExam(examId: string, updates: any) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  // Auto-calculate status from dates if provided
  if (updates.start_date && updates.end_date && updates.status !== 'cancelled') {
      updates.status = calculateExamStatus(updates.start_date, updates.end_date);
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("exams")
    .update(updates)
    .eq("id", examId);

  if (error) return { error: error.message };
  
  revalidatePath("/admin/exams");
  revalidatePath("/admin"); // Optional: Update dashboard stats too
  return { success: true };
}

export async function getCentres() {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("master_centres")
    .select("*")
    .eq("admin_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching centres:", error);
    return [];
  }

  return data || [];
}

export async function createCentre(centreData: Record<string, unknown>) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase.from("master_centres").insert({
    ...centreData,
    admin_id: session.userId,
    is_active: true,
  });

  if (error) {
    console.error("Error creating centre:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function updateCentre(centreId: string, centreData: Record<string, unknown>) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("master_centres")
    .update(centreData)
    .eq("id", centreId)
    .eq("admin_id", session.userId);

  if (error) {
    console.error("Error updating centre:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteCentre(centreId: string) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("master_centres")
    .delete()
    .eq("id", centreId)
    .eq("admin_id", session.userId);

  if (error) {
    console.error("Error deleting centre:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getShifts() {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("master_shifts")
    .select("*")
    .eq("admin_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching shifts:", error);
    return [];
  }

  return data || [];
}

export async function deleteShift(shiftId: string) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("master_shifts")
    .delete()
    .eq("id", shiftId)
    .eq("admin_id", session.userId);

  if (error) {
    console.error("Error deleting shift:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getCandidates(examIds: string[], limit?: number) {
  const session = await getAuthSession();
  if (!session || examIds.length === 0) return [];

  const supabase = await createAdminClient();
  let query = supabase
    .from("candidates")
    .select("*")
    .in("exam_id", examIds)
    .order("created_at", { ascending: false });

  // Apply limit if provided for performance optimization
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }

  // Format exam_date field to remove time component (YYYY-MM-DD only)
  const formattedData = data?.map((candidate) => ({
    ...candidate,
    exam_date: candidate.exam_date ? candidate.exam_date.split('T')[0] : null,
  }));

  return formattedData || [];
}

export async function getManagers() {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createAdminClient();
  
  // First, get all managers (Admins should see all)
  const { data: managers, error: managersError } = await supabase
    .from("users")
    .select("*")
    .eq("role", "manager")
    .order("full_name");

  if (managersError) {
    console.error("Error fetching managers:", managersError);
    return [];
  }

  if (!managers || managers.length === 0) {
    console.log("⚠️ No managers found in users table");
    return [];
  }

  console.log(`✓ Found ${managers.length} managers`);

  // Get all assignments for these managers
  const managerIds = managers.map(m => m.id);
  console.log("📍 Fetching assignments for manager IDs:", managerIds);

  const { data: assignments, error: assignmentsError } = await supabase
    .from("manager_centre_assignments")
    .select(`
      id,
      manager_id,
      assigned_at,
      exam_id,
      centre_id,
      shift_id,
      exams!mca_to_exams_fk(id, exam_name, exam_code),
      master_centres!mca_to_centres_fk(id, centre_name, centre_code),
      master_shifts!mca_to_shifts_fk(id, shift_name, shift_code)
    `)
    .in("manager_id", managerIds);

  if (assignmentsError) {
    console.error("❌ Error fetching assignments:", assignmentsError);
  } else {
    console.log(`✓ Found ${assignments?.length || 0} total assignments`);
    if (assignments && assignments.length > 0) {
      console.log("📋 Sample assignment:", assignments[0]);
    }
  }

  // Merge assignments into managers
  const managersWithAssignments = managers.map(manager => {
    const managerAssignments = assignments?.filter(a => a.manager_id === manager.id) || [];
    console.log(`Manager ${manager.full_name} (${manager.id}): ${managerAssignments.length} assignments`);
    
    return {
      ...manager,
      assignments: managerAssignments.map(a => ({
        id: a.id,
        exam_name: (a.exams as any)?.exam_name || 'N/A',
        exam_code: (a.exams as any)?.exam_code || '',
        centre_name: (a.master_centres as any)?.centre_name || a.centre_id || 'N/A',
        centre_code: (a.master_centres as any)?.centre_code || '',
        shift_name: (a.master_shifts as any)?.shift_name || 'N/A',
        shift_code: (a.master_shifts as any)?.shift_code || '',
        assignment_date: a.assigned_at
      }))
    };
  });

  return managersWithAssignments;
}

export async function getVerifiers() {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createAdminClient();
  
  // First, get all verifiers
  const { data: verifiers, error: verifiersError } = await supabase
    .from("users")
    .select("*")
    .eq("role", "verifier")
    .eq("created_by", session.userId)
    .order("full_name");

  if (verifiersError) {
    console.error("Error fetching verifiers:", verifiersError);
    return [];
  }

  if (!verifiers || verifiers.length === 0) return [];

  // Get all assignments for these verifiers
  const verifierIds = verifiers.map(v => v.id);
  const { data: assignments, error: assignmentsError } = await supabase
    .from("verifier_assignments")
    .select(`
      id,
      verifier_id,
      assignment_date,
      exams!inner(id, exam_name, exam_code),
      master_centres!inner(id, centre_name, centre_code),
      master_shifts!inner(id, shift_name, shift_code)
    `)
    .in("verifier_id", verifierIds);

  if (assignmentsError) {
    console.error("Error fetching assignments:", assignmentsError);
  }

  // Merge assignments into verifiers
  const verifiersWithAssignments = verifiers.map(verifier => {
    const verifierAssignments = assignments?.filter(a => a.verifier_id === verifier.id) || [];
    return {
      ...verifier,
      assignments: verifierAssignments.map(a => ({
        id: a.id,
        exam_name: (a.exams as any)?.exam_name || '',
        exam_code: (a.exams as any)?.exam_code || '',
        centre_name: (a.master_centres as any)?.centre_name || '',
        centre_code: (a.master_centres as any)?.centre_code || '',
        shift_name: (a.master_shifts as any)?.shift_name || '',
        shift_code: (a.master_shifts as any)?.shift_code || '',
        assignment_date: a.assignment_date
      }))
    };
  });

  return verifiersWithAssignments;
}

export async function getMonitoringStats() {
  const session = await getAuthSession();
  if (!session) return null;

  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Get exam IDs for this admin
  const { data: exams } = await supabase
    .from("exams")
    .select("id")
    .eq("admin_id", session.userId);

  const examIds = exams?.map((e) => e.id) || [];
  if (examIds.length === 0) return null;

  const [verifiers, pending, completed, failed] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "verifier")
      .eq("created_by", session.userId)
      .eq("is_active", true),
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .in("exam_id", examIds)
      .eq("verification_status", "pending"),
    supabase
      .from("verifications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today)
      .eq("verification_result", "success"),
    supabase
      .from("verifications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today)
      .eq("verification_result", "failed"),
  ]);

  return {
    activeVerifiers: verifiers.count || 0,
    pendingVerifications: pending.count || 0,
    completedToday: completed.count || 0,
    failedToday: failed.count || 0,
  };
}

export async function createShift(shiftData: {
  shift_name: string;
  shift_code: string;
  gate_open_time: string;
  gate_close_time: string;
  start_time: string;
  end_time: string;
}) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase.from("master_shifts").insert({
    ...shiftData,
    admin_id: session.userId,
    is_active: true,
  });

  if (error) {
    console.error("Error creating shift:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function updateShift(shiftId: string, shiftData: Partial<{
  shift_name: string;
  shift_code: string;
  gate_open_time: string;
  gate_close_time: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}>) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("master_shifts")
    .update(shiftData)
    .eq("id", shiftId)
    .eq("admin_id", session.userId);

  if (error) {
    console.error("Error updating shift:", error);
    return { error: error.message };
  }

  return { success: true };
}

// Import a single candidate row from CSV
export async function importCandidateRow(rowData: {
  roll_number: string;
  full_name: string;
  father_name?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  exam_date: string;
  exam_name: string;
  exam_start_date: string;
  exam_end_date: string;
  exam_code: string;
  shift_code: string;
  shift_name: string;
  gate_open_time: string;
  gate_close_time: string;
  start_time: string;
  end_time: string;
  centre_name: string;
  centre_code: string;
  centre_city: string;
  centre_address: string;
  centre_contact_person: string;
  centre_phone: string;
  centre_email?: string;
}) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  try {
    // 1. Find or create exam
    let { data: exam } = await supabase
      .from("exams")
      .select("id")
      .eq("exam_code", rowData.exam_code)
      .eq("admin_id", session.userId)
      .single();

    if (!exam) {
      const { data: newExam, error: examError } = await supabase
        .from("exams")
        .insert({
          exam_name: rowData.exam_name,
          exam_code: rowData.exam_code,
          start_date: rowData.exam_start_date,
          end_date: rowData.exam_end_date,
          exam_date: rowData.exam_date,
          admin_id: session.userId,
          status: "upcoming",
        })
        .select("id")
        .single();

      if (examError) throw new Error(`Exam creation failed: ${examError.message}`);
      exam = newExam;
    }

    // 2. Find or create centre
    let { data: centre } = await supabase
      .from("master_centres")
      .select("id")
      .eq("centre_code", rowData.centre_code)
      .eq("admin_id", session.userId)
      .single();

    if (!centre) {
      const { data: newCentre, error: centreError } = await supabase
        .from("master_centres")
        .insert({
          centre_name: rowData.centre_name,
          centre_code: rowData.centre_code,
          city: rowData.centre_city,
          address: rowData.centre_address,
          contact_person: rowData.centre_contact_person,
          phone: rowData.centre_phone,
          email: rowData.centre_email || null,
          admin_id: session.userId,
        })
        .select("id")
        .single();

      if (centreError) throw new Error(`Centre creation failed: ${centreError.message}`);
      centre = newCentre;
    }

    // 3. Find or create shift
    let { data: shift } = await supabase
      .from("shifts")
      .select("id")
      .eq("shift_code", rowData.shift_code)
      .eq("exam_id", exam.id)
      .single();

    if (!shift) {
      const { data: newShift, error: shiftError } = await supabase
        .from("shifts")
        .insert({
          shift_code: rowData.shift_code,
          shift_name: rowData.shift_name,
          gate_open_time: rowData.gate_open_time,
          gate_close_time: rowData.gate_close_time,
          start_time: rowData.start_time,
          end_time: rowData.end_time,
          exam_id: exam.id,
          admin_id: session.userId,
        })
        .select("id")
        .single();

      if (shiftError) throw new Error(`Shift creation failed: ${shiftError.message}`);
      shift = newShift;
    }

    // 4. Create candidate
    const { error: candidateError } = await supabase
      .from("candidates")
      .insert({
        roll_number: rowData.roll_number,
        full_name: rowData.full_name,
        father_name: rowData.father_name || null,
        email: rowData.email || null,
        phone: rowData.phone || null,
        photo_url: rowData.photo_url || null,
        exam_id: exam.id,
        centre_id: centre.id,
        shift_id: shift.id,
        admin_id: session.userId,
      });

    if (candidateError) {
      if (candidateError.code === "23505") {
        throw new Error(`Duplicate roll number: ${rowData.roll_number}`);
      }
      throw new Error(`Candidate creation failed: ${candidateError.message}`);
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Unknown error" };
  }
}

export async function bulkImportCandidates(rows: {
  roll_number: string;
  full_name: string;
  father_name?: string;
  date_of_birth?: string;
  gender?: string;
  aadhaar_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  exam_date: string;
  exam_name: string;
  exam_start_date: string;
  exam_end_date: string;
  exam_code: string;
  shift_code: string;
  shift_name: string;
  gate_open_time: string;
  gate_close_time: string;
  start_time: string;
  end_time: string;
  centre_name: string;
  centre_code: string;
  centre_city: string;
  centre_state: string;
  centre_pincode?: string;
  centre_address: string;
  centre_contact_person: string;
  centre_phone: string;
  centre_email?: string;
}[]) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  
  if (rows.length === 0) return { success: true, count: 0, duplicates: 0 };

  try {
    // 1. Handle Exams
    const uniqueExams = Array.from(new Map(rows.map(r => [r.exam_code, r])).values());
    const examCodes = uniqueExams.map(e => e.exam_code);
    
    // Fetch existing
    const { data: existingExams } = await supabase
      .from("exams")
      .select("id, exam_code")
      .in("exam_code", examCodes);
      
    const existingExamMap = new Map(existingExams?.map(e => [e.exam_code, e.id]));
    
    // Insert missing
    const missingExams = uniqueExams.filter(e => !existingExamMap.has(e.exam_code));
    const newExamMap = new Map<string, string>();
    
    if (missingExams.length > 0) {
      const { data: createdExams, error: createExamError } = await supabase
        .from("exams")
        .insert(missingExams.map(e => ({
          exam_name: e.exam_name,
          exam_code: e.exam_code,
          start_date: e.exam_start_date,
          end_date: e.exam_end_date,
          exam_date: e.exam_date,
          admin_id: session.userId,
          status: calculateExamStatus(e.exam_start_date, e.exam_end_date)
        })))
        .select("id, exam_code");
        
      if (createExamError) throw new Error(`Bulk exam creation failed: ${createExamError.message}`);
      createdExams?.forEach(e => newExamMap.set(e.exam_code, e.id));
    }
    
    const finalExamMap = new Map([...existingExamMap, ...newExamMap]);

    // 2. Handle Centres (using master_centres)
    const uniqueCentres = Array.from(new Map(rows.map(r => [r.centre_code, r])).values());
    const centreCodes = uniqueCentres.map(c => c.centre_code);
    
    const { data: existingCentres } = await supabase
      .from("master_centres")
      .select("id, centre_code")
      .in("centre_code", centreCodes);

    const existingCentreMap = new Map(existingCentres?.map(c => [c.centre_code, c.id]));
    
    const missingCentres = uniqueCentres.filter(c => !existingCentreMap.has(c.centre_code));
    const newCentreMap = new Map<string, string>();

    if (missingCentres.length > 0) {
      const { data: createdCentres, error: createCentreError } = await supabase
        .from("master_centres")
        .insert(missingCentres.map(c => ({
          centre_name: c.centre_name,
          centre_code: c.centre_code,
          city: c.centre_city,
          state: c.centre_state,
          pincode: c.centre_pincode || null,
          address: c.centre_address,
          contact_person: c.centre_contact_person,
          contact_phone: c.centre_phone,
          contact_email: c.centre_email || null,
          admin_id: session.userId,
          is_active: true
        })))
        .select("id, centre_code");

      if (createCentreError) throw new Error(`Bulk centre creation failed: ${createCentreError.message}`);
      createdCentres?.forEach(c => newCentreMap.set(c.centre_code, c.id));
    }

    const finalCentreMap = new Map([...existingCentreMap, ...newCentreMap]);

    // 3. Handle Shifts (using master_shifts)
    const neededShifts = new Map<string, any>();
    rows.forEach(r => {
      const examId = finalExamMap.get(r.exam_code);
      if (examId) {
        const key = `${examId}_${r.shift_code}`;
        if (!neededShifts.has(key)) {
          neededShifts.set(key, { ...r, exam_id: examId });
        }
      }
    });

    const relevantExamIds = Array.from(new Set(Array.from(finalExamMap.values())));
    
    const { data: existingShifts } = await supabase
      .from("master_shifts")
      .select("id, shift_code, exam_id")
      .in("exam_id", relevantExamIds);
      
    const existingShiftMap = new Map<string, string>();
    existingShifts?.forEach(s => existingShiftMap.set(`${s.exam_id}_${s.shift_code}`, s.id));

    const missingShifts = Array.from(neededShifts.values()).filter(s => {
       const key = `${s.exam_id}_${s.shift_code}`;
       return !existingShiftMap.has(key);
    });

    if (missingShifts.length > 0) {
      const { data: createdShifts, error: createShiftError } = await supabase
        .from("master_shifts")
        .insert(missingShifts.map(s => ({
          shift_code: s.shift_code,
          shift_name: s.shift_name,
          gate_open_time: s.gate_open_time,
          gate_close_time: s.gate_close_time,
          start_time: s.start_time,
          end_time: s.end_time,
          exam_id: s.exam_id,
          admin_id: session.userId
        })))
        .select("id, shift_code, exam_id");

      if (createShiftError) throw new Error(`Bulk shift creation failed: ${createShiftError.message}`);
      createdShifts?.forEach(s => existingShiftMap.set(`${s.exam_id}_${s.shift_code}`, s.id));
    }

    // 4. Populate exam_centre_assignments (for ALL rows, including those with existing roll numbers)
    const examCentreAssignments = new Map<string, { exam_id: string; centre_id: string; date: string }>();
    rows.forEach(r => {
      const examId = finalExamMap.get(r.exam_code);
      const centreId = finalCentreMap.get(r.centre_code);
      if (examId && centreId) {
        const key = `${examId}_${centreId}_${r.exam_date}`;
        if (!examCentreAssignments.has(key)) {
          examCentreAssignments.set(key, { exam_id: examId, centre_id: centreId, date: r.exam_date });
        }
      }
    });

    const ecaList = Array.from(examCentreAssignments.values());
    const ecaMap = new Map<string, string>(); // key -> id
    let newEcaCount = 0;
    let existingEcaCount = 0;
    const ecaErrors: string[] = [];

    if (ecaList.length > 0) {
      // Upsert exam_centre_assignments
      for (const eca of ecaList) {
        const { data: existing, error: selectError } = await supabase
          .from("exam_centre_assignments")
          .select("id")
          .eq("exam_id", eca.exam_id)
          .eq("centre_id", eca.centre_id)
          .eq("assignment_date", eca.date)
          .maybeSingle();

        if (selectError) {
          ecaErrors.push(`SELECT: ${selectError.message}`);
        }

        if (existing) {
          ecaMap.set(`${eca.exam_id}_${eca.centre_id}_${eca.date}`, existing.id);
          existingEcaCount++;
        } else {
          const { data: created, error: ecaError } = await supabase
            .from("exam_centre_assignments")
            .insert({
              exam_id: eca.exam_id,
              centre_id: eca.centre_id,
              assignment_date: eca.date,
              assigned_by: session.userId,
              capacity: 0  // Default capacity, can be updated later
            })
            .select("id")
            .single();

          if (ecaError) {
            ecaErrors.push(`INSERT for exam=${eca.exam_id}, centre=${eca.centre_id}, date=${eca.date}: ${ecaError.message}`);
          } else if (created) {
            ecaMap.set(`${eca.exam_id}_${eca.centre_id}_${eca.date}`, created.id);
            newEcaCount++;
          } else {
            ecaErrors.push(`INSERT returned no data for exam=${eca.exam_id}, centre=${eca.centre_id}`);
          }
        }
      }
    }

    // 5. Populate centre_shift_assignments (for ALL rows, including those with existing roll numbers)
    const centreShiftAssignments = new Map<string, { eca_id: string; shift_id: string }>();
    
    // Debug: Log the maps to understand what's available
    console.log(`DEBUG: finalExamMap size: ${finalExamMap.size}`);
    console.log(`DEBUG: finalCentreMap size: ${finalCentreMap.size}`);
    console.log(`DEBUG: existingShiftMap size: ${existingShiftMap.size}`);
    console.log(`DEBUG: ecaMap size: ${ecaMap.size}`);
    
    // Debug: Log the keys in each map
    console.log(`DEBUG: existingShiftMap keys: ${Array.from(existingShiftMap.keys()).join(', ')}`);
    console.log(`DEBUG: ecaMap keys: ${Array.from(ecaMap.keys()).join(', ')}`);
    
    let debugMissing = { noExam: 0, noCentre: 0, noShift: 0, noEca: 0 };
    
    rows.forEach(r => {
      const examId = finalExamMap.get(r.exam_code);
      const centreId = finalCentreMap.get(r.centre_code);
      const shiftKey = `${examId}_${r.shift_code}`;
      const shiftId = existingShiftMap.get(shiftKey);
      const ecaKey = `${examId}_${centreId}_${r.exam_date}`;
      const ecaId = ecaMap.get(ecaKey);

      // Debug: Log lookup attempts for first row
      if (rows.indexOf(r) === 0) {
        console.log(`DEBUG: First row lookup:`);
        console.log(`  exam_code: ${r.exam_code} -> examId: ${examId}`);
        console.log(`  centre_code: ${r.centre_code} -> centreId: ${centreId}`);
        console.log(`  shift_code: ${r.shift_code}, shiftKey: ${shiftKey} -> shiftId: ${shiftId}`);
        console.log(`  exam_date: ${r.exam_date}, ecaKey: ${ecaKey} -> ecaId: ${ecaId}`);
      }

      if (!examId) debugMissing.noExam++;
      if (!centreId) debugMissing.noCentre++;
      if (!shiftId) debugMissing.noShift++;
      if (!ecaId) debugMissing.noEca++;

      if (ecaId && shiftId) {
        const key = `${ecaId}_${shiftId}`;
        if (!centreShiftAssignments.has(key)) {
          centreShiftAssignments.set(key, { eca_id: ecaId, shift_id: shiftId });
        }
      }
    });

    console.log(`DEBUG: Missing lookups: noExam=${debugMissing.noExam}, noCentre=${debugMissing.noCentre}, noShift=${debugMissing.noShift}, noEca=${debugMissing.noEca}`);
    console.log(`DEBUG: centreShiftAssignments to create: ${centreShiftAssignments.size}`);

    const csaList = Array.from(centreShiftAssignments.values());
    let newCsaCount = 0;
    let existingCsaCount = 0;
    const csaErrors: string[] = [];

    if (csaList.length > 0) {
      for (const csa of csaList) {
        const { data: existing, error: selectError } = await supabase
          .from("centre_shift_assignments")
          .select("id")
          .eq("exam_centre_assignment_id", csa.eca_id)
          .eq("shift_id", csa.shift_id)
          .maybeSingle();

        if (selectError) {
          csaErrors.push(`SELECT: ${selectError.message}`);
        }

        if (existing) {
          existingCsaCount++;
        } else {
          const { error: csaError } = await supabase
            .from("centre_shift_assignments")
            .insert({
              exam_centre_assignment_id: csa.eca_id,
              shift_id: csa.shift_id,
              assigned_by: session.userId,
              capacity: 0  // Default capacity
            });

          if (csaError) {
            csaErrors.push(`INSERT for eca=${csa.eca_id}, shift=${csa.shift_id}: ${csaError.message}`);
          } else {
            newCsaCount++;
          }
        }
      }
    } else {
      console.log(`DEBUG: No centre_shift_assignments to create. Check if shifts exist in master_shifts.`);
    }

    console.log(`Assignments: exam_centre (new: ${newEcaCount}, existing: ${existingEcaCount}), centre_shift (new: ${newCsaCount}, existing: ${existingCsaCount})`);

    // 6. Upsert Candidates (Insert new, Update existing based on roll_number)
    const rollNumbers = rows.map(r => r.roll_number);
    const { data: existingCandidates } = await supabase
      .from("candidates")
      .select("id, roll_number")
      .in("roll_number", rollNumbers);

    const existingCandidatesMap = new Map(existingCandidates?.map(c => [c.roll_number, c.id]) || []);
    
    const candidatesToInsert: any[] = [];
    const candidatesToUpdate: any[] = [];

    rows.forEach(r => {
      const examId = finalExamMap.get(r.exam_code);
      const centreId = finalCentreMap.get(r.centre_code);
      const shiftId = existingShiftMap.get(`${examId}_${r.shift_code}`);

      if (!examId || !centreId || !shiftId) return;

      const candidateData = {
        roll_number: r.roll_number,
        full_name: r.full_name,
        father_name: r.father_name || null,
        date_of_birth: r.date_of_birth || null,
        gender: r.gender ? r.gender.toLowerCase() : null,
        aadhaar_number: r.aadhaar_number || null,
        address: r.address || null,
        email: r.email || null,
        phone: r.phone || null,
        photo_url: r.photo_url || null,
        exam_id: examId,
        centre_id: centreId,
        shift_id: shiftId,
        admin_id: session.userId,
      };

      const existingId = existingCandidatesMap.get(r.roll_number);
      
      if (existingId) {
        // Update existing candidate
        candidatesToUpdate.push({
          id: existingId,
          ...candidateData
        });
      } else {
        // Insert new candidate
        candidatesToInsert.push({
          ...candidateData,
          verification_status: 'pending',
          verification_attempts: 0
        });
      }
    });

    let insertedCount = 0;
    let updatedCount = 0;

    // Insert new candidates
    if (candidatesToInsert.length > 0) {
      const { error: candidateError } = await supabase
        .from("candidates")
        .insert(candidatesToInsert);
        
       if (candidateError) {
         if (candidateError.code === "23505") throw new Error(`Duplicate roll number found in batch.`);
         throw new Error(`Bulk candidate insert failed: ${candidateError.message}`);
       }
       insertedCount = candidatesToInsert.length;
    }

    // Update existing candidates
    if (candidatesToUpdate.length > 0) {
      for (const candidate of candidatesToUpdate) {
        const { id, ...updateData } = candidate;
        const { error: updateError } = await supabase
          .from("candidates")
          .update(updateData)
          .eq("id", id);
          
        if (updateError) {
          console.error(`Failed to update candidate ${candidate.roll_number}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    return { 
      success: true, 
      count: insertedCount,
      inserted: insertedCount,
      updated: updatedCount,
      duplicates: 0, // No longer skipping duplicates
      examCentreAssignments: { new: newEcaCount, existing: existingEcaCount },
      centreShiftAssignments: { new: newCsaCount, existing: existingCsaCount },
      debug: {
        examMapSize: finalExamMap.size,
        centreMapSize: finalCentreMap.size,
        shiftMapSize: existingShiftMap.size,
        ecaMapSize: ecaMap.size,
        ecaListSize: ecaList.length,
        csaListSize: csaList.length,
        missing: debugMissing,
        shiftMapKeys: Array.from(existingShiftMap.keys()).slice(0, 5),
        ecaMapKeys: Array.from(ecaMap.keys()).slice(0, 5),
        ecaErrors: ecaErrors.slice(0, 5),
        csaErrors: csaErrors.slice(0, 5),
        firstRow: rows.length > 0 ? {
          exam_code: rows[0].exam_code,
          centre_code: rows[0].centre_code,
          shift_code: rows[0].shift_code,
          exam_date: rows[0].exam_date
        } : null
      }
    };

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return { error: error.message || "Unknown bulk import error" };
  }
}


export async function bulkImportVerifiers(rows: {
  full_name: string;
  father_name?: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  assignment_exam_id?: string;
  assignment_centre_id?: string;
  assignment_shift_id?: string;
  assignment_date?: string;
}[]) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const successful = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .or(`email.eq.${row.email},phone.eq.${row.phone}`)
        .maybeSingle();

      let userId = existingUser?.id;


      if (!userId) {
        // Generate a new UUID for the user
        const newUserId = crypto.randomUUID();
        
        // Generate default password from phone number (last 4 digits + "Caveris")
        const defaultPassword = generateDefaultPassword(row.phone);
        
        // Hash the password
        const { hash, salt } = await hashPassword(defaultPassword);
        
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: newUserId,
            full_name: row.full_name,
            father_name: row.father_name || null,
            email: row.email,
            phone: row.phone,
            date_of_birth: row.date_of_birth || null,
            address: row.address || null,
            city: row.city || null,
            role: "verifier",
            is_active: true,
            created_by: session.userId,
            password_hash: hash,
            password_salt: salt,
          })
          .select("id")
          .single();

        if (createError) throw new Error(`Create user failed: ${createError.message}`);
        userId = newUser.id;
        
        // Log the default password for the admin (in production, send via email/SMS)
        console.log(`Created verifier ${row.email} with default password: ${defaultPassword}`);
        console.log(`Salt: ${salt.substring(0, 10)}... (truncated for security)`);
      }

      if (row.assignment_exam_id && row.assignment_centre_id && row.assignment_shift_id && userId) {
         const { data: existingAssignment } = await supabase
            .from("verifier_assignments")
            .select("id")
            .eq("verifier_id", userId)
            .eq("exam_id", row.assignment_exam_id)
            .eq("centre_id", row.assignment_centre_id)
            .eq("shift_id", row.assignment_shift_id)
            .eq("assignment_date", row.assignment_date || new Date().toISOString().split('T')[0])
            .maybeSingle();

         if (!existingAssignment) {
             const { error: assignError } = await supabase
                 .from("verifier_assignments")
                 .insert({
                     verifier_id: userId,
                     exam_id: row.assignment_exam_id,
                     centre_id: row.assignment_centre_id,
                     shift_id: row.assignment_shift_id,
                     assignment_date: row.assignment_date || new Date().toISOString().split('T')[0],
                     assigned_by: session.userId
                 });
             
             if (assignError) {
                 console.error(`Assignment failed for ${row.email}: ${assignError.message}`);
             }
         }
      }
      successful.push(userId);
    } catch (err: any) {
      errors.push({ row: i + 1, error: err.message });
    }
  }

  return { success: true, count: successful.length, errors };
}

// --- Exam Assignment Actions ---

export async function getExamAssignments(examId: string, date: string) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  try {
    // Load exam-centre assignments
    const { data: examCentres, error: examCentresError } = await supabase
      .from("exam_centre_assignments")
      .select("id, centre_id, capacity")
      .eq("exam_id", examId)
      .eq("assignment_date", date);

    if (examCentresError) throw examCentresError;

    if (!examCentres || examCentres.length === 0) {
      return { assignments: [] };
    }

    // Load shift assignments for each centre
    const assignments = [];

    for (const examCentre of examCentres) {
      const { data: centreShifts, error: centreShiftsError } = await supabase
        .from("centre_shift_assignments")
        .select("shift_id, capacity")
        .eq("exam_centre_assignment_id", examCentre.id);

      if (centreShiftsError) throw centreShiftsError;

      assignments.push({
        centreId: examCentre.centre_id,
        capacity: examCentre.capacity,
        shifts: (centreShifts || []).map((cs) => ({
          shiftId: cs.shift_id,
          capacity: cs.capacity,
        })),
      });
    }

    return { assignments };
  } catch (error: any) {
    console.error("Error loading assignments:", error);
    return { error: error.message };
  }
}

export async function saveExamAssignments(
  examId: string,
  date: string,
  assignments: {
    centreId: string;
    capacity: number;
    shifts: { shiftId: string; capacity: number }[];
  }[]
) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  try {
    // Delete existing assignments logic
    const { data: existingAssignments } = await supabase
      .from("exam_centre_assignments")
      .select("id")
      .eq("exam_id", examId)
      .eq("assignment_date", date);

    if (existingAssignments && existingAssignments.length > 0) {
      const assignmentIds = existingAssignments.map((a) => a.id);

      // Delete shift assignments first
      await supabase
        .from("centre_shift_assignments")
        .delete()
        .in("exam_centre_assignment_id", assignmentIds);

      // Delete exam-centre assignments
      await supabase
        .from("exam_centre_assignments")
        .delete()
        .eq("exam_id", examId)
        .eq("assignment_date", date);
    }

    // Insert new assignments
    for (const assignment of assignments) {
      // Insert exam-centre assignment
      const { data: examCentreData, error: examCentreError } = await supabase
        .from("exam_centre_assignments")
        .insert({
          exam_id: examId,
          centre_id: assignment.centreId,
          assignment_date: date,
          capacity: assignment.capacity,
          assigned_by: session.userId,
        })
        .select()
        .single();

      if (examCentreError) throw examCentreError;

      // Insert shift assignments
      if (assignment.shifts.length > 0) {
        const shiftInserts = assignment.shifts.map((shift) => ({
          exam_centre_assignment_id: examCentreData.id,
          shift_id: shift.shiftId,
          capacity: shift.capacity,
          assigned_by: session.userId,
        }));

        const { error: shiftError } = await supabase
          .from("centre_shift_assignments")
          .insert(shiftInserts);

        if (shiftError) throw shiftError;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error saving assignments:", error);
    return { error: error.message };
  }
}

export async function createManagerAssignmentAction(
  managerId: string,
  examId: string,
  centreId: string,
  shiftId: string,
  assignmentDate: string
) {
  const session = await getAuthSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from("manager_centre_assignments")
    .upsert(
      {
        manager_id: managerId,
        exam_id: examId,
        centre_id: centreId,
        shift_id: shiftId,
        assigned_at: assignmentDate,
        assigned_by: session.userId,
      },
      {
        onConflict: "manager_id, centre_id, exam_id, shift_id",
        ignoreDuplicates: true, // If it exists, skip (don't fail)
      }
    );

  if (error) {
    console.error("Error creating manager assignment:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
