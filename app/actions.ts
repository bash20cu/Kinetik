"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AuthenticationError, requireUser, signInWithPassword, signOut } from "@/lib/auth";
import {
  activateRoutinePlan,
  archiveRoutinePlan,
  createSession,
  createManualPlan,
  importPlanFromCsv,
  markAlertAsRead,
  saveSession,
  updateRoutinePlan
} from "@/lib/data";
import { parsePlanPayload, requireId } from "@/lib/validation";

export type LoginFormState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signInWithPassword(email, password);
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof Error) {
      return {
        error: error.message
      };
    }

    return {
      error: "No pudimos iniciar sesion. Intenta de nuevo."
    };
  }

  redirect("/");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function createSessionAction(formData: FormData) {
  const user = await requireUser();
  const dayId = requireId(formData.get("dayId"), "No encontramos el dia que quieres entrenar.");
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
  const alertId = requireId(formData.get("alertId"), "No encontramos la alerta que quieres marcar.");
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

export async function createManualPlanAction(formData: FormData) {
  const user = await requireUser();
  const planName = String(formData.get("planName") ?? "");
  const payload = String(formData.get("payload") ?? "");

  if (!payload) {
    throw new Error("Debes agregar al menos un dia y un ejercicio.");
  }

  const days = parsePlanPayload(payload);

  await createManualPlan(user.id, planName, days);
  revalidatePath("/");
  revalidatePath("/rutina");
  revalidatePath("/plan/importar");
  redirect("/rutina");
}

export async function updateRoutinePlanAction(formData: FormData) {
  const user = await requireUser();
  const planId = requireId(formData.get("planId"), "No encontramos la rutina que quieres modificar.");
  const planName = String(formData.get("planName") ?? "");
  const payload = String(formData.get("payload") ?? "");

  if (!payload) {
    throw new Error("Debes agregar al menos un dia y un ejercicio.");
  }

  const days = parsePlanPayload(payload);

  await updateRoutinePlan(user.id, planId, planName, days);
  revalidatePath("/");
  revalidatePath("/rutina");
  revalidatePath(`/plan/${planId}/editar`);
  redirect("/rutina");
}

export async function archiveRoutinePlanAction(formData: FormData) {
  const user = await requireUser();
  const planId = requireId(formData.get("planId"), "No encontramos la rutina que quieres archivar.");

  await archiveRoutinePlan(user.id, planId);
  revalidatePath("/");
  revalidatePath("/rutina");
}

export async function activateRoutinePlanAction(formData: FormData) {
  const user = await requireUser();
  const planId = requireId(formData.get("planId"), "No encontramos la rutina que quieres activar.");

  await activateRoutinePlan(user.id, planId);
  revalidatePath("/");
  revalidatePath("/rutina");
}
