"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/password-utils";

export async function createAdmin(data: {
  email: string;
  full_name: string;
  phone?: string;
  password: string;
}) {
  try {
    const supabase = await createClient();

    // Check if current user is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!currentUser || currentUser.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Generate UUID for the admin user
    const newUserId = crypto.randomUUID();

    // Hash the password with salt
    const { hash, salt } = await hashPassword(data.password);

    // Create user profile in users table with hashed password
    const { error: profileError } = await supabase.from("users").insert({
      id: newUserId,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone || null,
      role: "admin",
      created_by: user.id,
      is_active: true,
      password_hash: hash,
      password_salt: salt,
      force_password_change: true, // Force password change on first login
    });

    if (profileError) {
      console.error("Profile error:", profileError);
      return { success: false, error: profileError.message };
    }

    revalidatePath("/super-admin/admins");
    return { success: true, data: { id: newUserId, email: data.email } };
  } catch (error) {
    console.error("Create admin error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function toggleAdminStatus(
  adminId: string,
  currentStatus: boolean,
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .update({ is_active: !currentStatus })
      .eq("id", adminId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/super-admin/admins");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
