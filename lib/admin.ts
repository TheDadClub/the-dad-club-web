import "server-only";

import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createAuthClient } from "./supabase/server";

export function createAdminDatabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Admin database configuration is missing.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function requireAdmin() {
  // Wait for a real request before authentication or database work.
  // Private admin content must not be generated during prerendering.
  await connection();

  const auth = await createAuthClient();

  const {
    data: { user },
    error: authError,
  } = await auth.auth.getUser();

  if (authError || !user) {
    redirect("/admin/login");
  }

  const database = createAdminDatabase();

  const { data: admin, error } = await database
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to verify administrator access.");
  }

  if (!admin) {
    redirect("/admin/login?error=access");
  }

  return { user, database };
}