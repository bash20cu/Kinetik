"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import {
  AuthenticationError,
  deleteProvisionedUser,
  provisionUser,
  requireUser,
  signInWithPassword,
  signOut,
  updateProvisionedUser
} from "@/lib/auth";
import {
  activateRoutinePlan,
  addExerciseToSession,
  archiveRoutinePlan,
  createFreeWorkoutSession,
  createSession,
  createManualPlan,
  importPlanFromCsv,
  markAlertAsRead,
  repeatFreeWorkoutTemplate,
  saveSession,
  startSuggestedWorkout,
  updateRoutinePlan
} from "@/lib/data";
import { parsePlanPayload, parseQuickWorkoutPayload, requireId, requirePassword } from "@/lib/validation";

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

export async function startSuggestedWorkoutAction() {
  const user = await requireUser();
  const sessionId = await startSuggestedWorkout(user.id);
  revalidatePath("/");
  revalidatePath("/historial");
  redirect(`/sesion/${sessionId}`);
}

export async function createFreeWorkoutSessionAction(formData: FormData) {
  const user = await requireUser();
  const payload = String(formData.get("payload") ?? "");

  if (!payload) {
    throw new Error("Debes agregar al menos un ejercicio para crear el entrenamiento libre.");
  }

  const quickWorkout = parseQuickWorkoutPayload(payload);
  const sessionId = await createFreeWorkoutSession(user.id, quickWorkout.name, quickWorkout.exercises);

  revalidatePath("/");
  revalidatePath("/historial");
  revalidatePath("/rutina");
  redirect(`/sesion/${sessionId}`);
}

export async function repeatFreeWorkoutTemplateAction(formData: FormData) {
  const user = await requireUser();
  const templateDayId = requireId(
    formData.get("templateDayId"),
    "No encontramos la plantilla libre que quieres repetir."
  );

  const sessionId = await repeatFreeWorkoutTemplate(user.id, templateDayId);

  revalidatePath("/");
  revalidatePath("/historial");
  revalidatePath("/rutina");
  redirect(`/sesion/${sessionId}`);
}

export async function saveSessionAction(sessionId: string, formData: FormData) {
  const user = await requireUser();
  await saveSession(user.id, sessionId, formData);
  revalidatePath(`/sesion/${sessionId}`);
  revalidatePath("/historial");
  revalidatePath("/");

  const afterSave = String(formData.get("afterSave") ?? "");

  if (afterSave === "home") {
    redirect("/");
  }

  if (afterSave === "history") {
    redirect("/historial");
  }

  if (afterSave === "free") {
    redirect("/entrenar/libre");
  }
}

export async function addExerciseToSessionAction(sessionId: string, formData: FormData) {
  const user = await requireUser();

  await saveSession(user.id, sessionId, formData);

  const plannedSetsRaw = String(formData.get("newExerciseSets") ?? "").trim();
  const plannedSets = plannedSetsRaw ? Number.parseInt(plannedSetsRaw, 10) : null;

  await addExerciseToSession(user.id, sessionId, {
    name: String(formData.get("newExerciseName") ?? ""),
    groupName: String(formData.get("newExerciseGroup") ?? ""),
    variant: String(formData.get("newExerciseVariant") ?? "") || null,
    plannedSets: Number.isFinite(plannedSets) ? plannedSets : null,
    plannedReps: String(formData.get("newExerciseReps") ?? ""),
    notes: String(formData.get("newExerciseNotes") ?? "")
  });

  revalidatePath(`/sesion/${sessionId}`);
  revalidatePath("/");
  revalidatePath("/historial");
  revalidatePath("/rutina");
  redirect(`/sesion/${sessionId}`);
}

export async function markAlertReadAction(formData: FormData) {
  const user = await requireUser();
  const alertId = requireId(formData.get("alertId"), "No encontramos la alerta que quieres marcar.");
  await markAlertAsRead(user.id, alertId);

  const referer = (await headers()).get("referer");
  if (referer) {
    const pathname = new URL(referer).pathname;
    revalidatePath(pathname);
  }

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

export async function createManagedUserAction(formData: FormData) {
  await requireUser();
  const email = String(formData.get("email") ?? "");
  const password = requirePassword(String(formData.get("password") ?? ""));

  await provisionUser(email, password);
  revalidatePath("/admin/usuarios");
}

export async function updateManagedUserAction(formData: FormData) {
  await requireUser();
  const userId = requireId(formData.get("userId"), "No encontramos el usuario que quieres editar.");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  await updateProvisionedUser(userId, {
    email,
    password
  });

  revalidatePath("/admin/usuarios");
}

export async function deleteManagedUserAction(formData: FormData) {
  const currentUser = await requireUser();
  const userId = requireId(formData.get("userId"), "No encontramos el usuario que quieres borrar.");

  if (userId === currentUser.id) {
    throw new Error("No puedes borrar tu propia cuenta mientras estas usando la app.");
  }

  await deleteProvisionedUser(userId);
  revalidatePath("/admin/usuarios");
}
