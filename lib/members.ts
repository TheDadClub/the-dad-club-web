import "server-only";

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createAuthClient } from "./supabase/server";
import { createAdminDatabase } from "./admin";

export async function requireMember() {
  await connection();

  const auth = await createAuthClient();

  const {
    data: { user },
    error: authError,
  } = await auth.auth.getUser();

  if (authError || !user || !user.email_confirmed_at) {
    redirect("/members/login");
  }

  const database = createAdminDatabase();

  const { data: member, error } = await database
    .from("members")
    .select("id, name, email, status")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to verify membership. Please try again.");
  }

  if (!member) {
    redirect("/members/login");
  }

  return { user, member, database };
}