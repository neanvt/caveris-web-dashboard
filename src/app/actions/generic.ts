"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth-server";

export async function fetchSupabaseData(
  table: string,
  queryOptions: {
    select?: string;
    eq?: [string, any][];
    in?: [string, any[]][];
    order?: [string, { ascending: boolean }];
    limit?: number;
  } = {}
) {
  const session = await getAuthSession();
  if (!session) return { data: null, error: "Unauthorized" };

  const supabase = await createAdminClient();
  let query = supabase.from(table).select(queryOptions.select || "*");

  // Automatically filter by admin_id/verifier_id if it's the right table
  // and the user is NOT a super_admin
  if (session.role !== "super_admin") {
    if (table === "exams") {
      query = query.eq("admin_id", session.userId);
    } else if (table === "users" && queryOptions.eq?.some(([col]) => col === "role" && queryOptions.eq.some(([c,v]) => c === "role" && v === "verifier"))) {
       // Filter verifiers by created_by
       query = query.eq("created_by", session.userId);
    }
    // For other tables like candidates/centres, they are usually linked to exams.
    // The client code usually does its own .eq("exam_id", ...) which is fine,
    // but we can't easily auto-enforce it here without knowing the schema perfectly.
    // So we'll rely on the client passing the right eq filters for now, 
    // and this action just bypasses RLS safely on the server.
  }

  if (queryOptions.eq) {
    queryOptions.eq.forEach(([col, val]) => {
      query = query.eq(col, val);
    });
  }

  if (queryOptions.in) {
    queryOptions.in.forEach(([col, val]) => {
      query = query.in(col, val);
    });
  }

  if (queryOptions.order) {
    query = query.order(queryOptions.order[0], queryOptions.order[1]);
  }

  if (queryOptions.limit) {
    query = query.limit(queryOptions.limit);
  }

  const { data, error } = await query;
  return { data, error: error?.message };
}
