"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser, signInWithEmail, signOut } from "@/lib/auth";
import {
  createSession,
  importPlanFromCsv,
  markAlertAsRead,
  saveSession
} from "@/lib/data";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  await signInWithEmail(email);
  redirect("/");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function createSessionAction(formData: FormData) {
  const user = await requireUser();
  const dayId = String(formData.get("dayId") ?? "");
  const sessionId = await createSession(user.id, dayId);
  revalidatePath("/");
  revalidatePath("/historial");
  redirect(`/sesion/${sessionId}`);
}

export async function saveSessionAction(sessionId: string, formData: FormData) {
  const user = await requireUser();
  await saveSession(user.id, sessionId, formData);
  revalidatePath(`/sesion/${sessionId}`);
  revalidatePath("/historial");
  revalidatePath("/");
}

export async function markAlertReadAction(formData: FormData) {
  const user = await requireUser();
  const alertId = String(formData.get("alertId") ?? "");
  await markAlertAsRead(user.id, alertId);
  revalidatePath("/");
}

export async function importPlanAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Debes adjuntar un archivo CSV.");
  }

  const csvText = await file.text();
  const result = await importPlanFromCsv(user.id, file.name, csvText);

  revalidatePath("/");
  revalidatePath("/rutina");
  revalidatePath("/plan/importar");

  if (!result.ok) {
    return;
  }
}
