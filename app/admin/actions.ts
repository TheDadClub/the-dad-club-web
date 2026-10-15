"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "../../lib/supabase/server";
import { createAdminDatabase } from "../../lib/admin";

export async function signIn(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  const email =
    typeof emailValue === "string"
      ? emailValue.trim().toLowerCase()
      : "";

  const password =
    typeof passwordValue === "string" ? passwordValue : "";

  if (
    !email ||
    email.length > 254 ||
    !password ||
    password.length > 1024
  ) {
    redirect("/admin/login?error=credentials");
  }

  const auth = await createAuthClient();

  const { data, error } = await auth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/admin/login?error=credentials");
  }

  const database = createAdminDatabase();

  const { data: admin, error: adminError } = await database
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (adminError || !admin) {
    await auth.auth.signOut({ scope: "local" });
    redirect("/admin/login?error=access");
  }

  redirect("/admin");
}

export async function signOut() {
  const auth = await createAuthClient();
  const { error } = await auth.auth.signOut({ scope: "local" });

  if (error) {
    throw new Error("Unable to sign out. Please try again.");
  }

  redirect("/admin/login");
}