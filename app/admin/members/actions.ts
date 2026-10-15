"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/admin";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function returnWithError(code: string, id: string): never {
  const params = new URLSearchParams({ error: code });

  if (uuidPattern.test(id)) {
    params.set("edit", id);
  }

  redirect(`/admin/members?${params.toString()}#member-form`);
}

export async function saveMember(formData: FormData) {
  const { user, database } = await requireAdmin();

  const id = field(formData, "id");
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const phone = field(formData, "phone");
  const location = field(formData, "location");
  const dueDate = field(formData, "due_date");
  const birthDate = field(formData, "birth_date");
  const status = field(formData, "status");

  const valid =
    (!id || uuidPattern.test(id)) &&
    name.length >= 1 &&
    name.length <= 100 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phone.length <= 40 &&
    location.length <= 100 &&
    validDate(dueDate) &&
    validDate(birthDate) &&
    ["active", "archived"].includes(status);

  if (!valid) {
    returnWithError("invalid", id);
  }

  const values = {
    name,
    email,
    phone,
    location,
    due_date: dueDate || null,
    birth_date: birthDate || null,
    status,
  };

  let saved = false;
  let duplicate = false;

  try {
    if (id) {
      const { data, error } = await database
        .from("members")
        .update(values)
        .eq("id", id)
        .select("id")
        .maybeSingle();

      saved = !error && Boolean(data);
      duplicate = error?.code === "23505";

      if (error) {
        console.error("Member update failed:", error.code);
      }
    } else {
      const { data, error } = await database
        .from("members")
        .insert({
          ...values,
          created_by: user.id,
        })
        .select("id")
        .single();

      saved = !error && Boolean(data);
      duplicate = error?.code === "23505";

      if (error) {
        console.error("Member creation failed:", error.code);
      }
    }
  } catch {
    console.error("Member save failed.");
  }

  if (!saved) {
    returnWithError(duplicate ? "duplicate" : "save", id);
  }

  revalidatePath("/admin/members");
  redirect("/admin/members?saved=1");
}