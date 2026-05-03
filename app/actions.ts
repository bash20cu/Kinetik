"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser, signInWithEmail, signOut } from "@/lib/auth";
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

function parsePlanPayload(payload: string) {
  const parsed = JSON.parse(payload) as {
    days?: Array<{
      name?: string;
      dayOrder?: number;
      blocks?: Array<{
        name?: string;
        blockOrder?: number;
        exercises?: Array<{
          name?: string;
          groupName?: string;
          variant?: string | null;
          plannedSets?: number | null;
          plannedReps?: string | null;
          notes?: string | null;
        }>;
      }>;
    }>;
  };

  return (parsed.days ?? []).map((day, dayIndex) => ({
    name: day.name ?? `Dia ${dayIndex + 1}`,
    dayOrder: day.dayOrder ?? dayIndex + 1,
    blocks: (day.blocks ?? []).map((block, blockIndex) => ({
      name: block.name ?? `Bloque ${blockIndex + 1}`,
      blockOrder: block.blockOrder ?? blockIndex + 1,
      exercises: (block.exercises ?? []).map((exercise) => ({
        name: exercise.name ?? "",
        groupName: exercise.groupName ?? "",
        variant: exercise.variant ?? null,
        plannedSets: exercise.plannedSets ?? null,
        plannedReps: exercise.plannedReps ?? null,
        notes: exercise.notes ?? null
      }))
    }))
  }));
}

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
  const planId = String(formData.get("planId") ?? "");
  const planName = String(formData.get("planName") ?? "");
  const payload = String(formData.get("payload") ?? "");

  if (!planId) {
    throw new Error("No encontramos la rutina que quieres modificar.");
  }

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
  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("No encontramos la rutina que quieres archivar.");
  }

  await archiveRoutinePlan(user.id, planId);
  revalidatePath("/");
  revalidatePath("/rutina");
}

export async function activateRoutinePlanAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("No encontramos la rutina que quieres activar.");
  }

  await activateRoutinePlan(user.id, planId);
  revalidatePath("/");
  revalidatePath("/rutina");
}
