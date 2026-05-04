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
import { prisma } from "@/lib/prisma";
import {
  createSessionLog,
  deleteTemplate,
  importTemplateFromCsv,
  markAlertAsRead,
  saveSession,
  saveSessionAsTemplate,
  startTemplateSession,
  toggleTemplateFavorite
} from "@/lib/data";
import { requireId, requirePassword } from "@/lib/validation";

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

export async function createSessionLogAction(formData: FormData) {
  const user = await requireUser();

  const exercises: Array<{
    exerciseId?: string | null;
    customName?: string | null;
    groupName: string;
    plannedSets?: number | null;
    plannedReps?: string | null;
  }> = [];

  let index = 0;
  while (formData.has(`exercise-${index}`)) {
    const raw = formData.get(`exercise-${index}`);
    if (raw) {
      try {
        const parsed = JSON.parse(String(raw));
        exercises.push(parsed);
      } catch {
        // skip
      }
    }
    index++;
  }

  if (exercises.length === 0) {
    throw new Error("Debes agregar al menos un ejercicio.");
  }

  const sessionId = await createSessionLog(user.id, exercises);
  revalidatePath("/");
  redirect(`/sesion/${sessionId}`);
}

export async function addExerciseToSessionAction(sessionId: string, formData: FormData) {
  await requireUser();
  const exerciseData = formData.get("exerciseData");

  if (!exerciseData) {
    throw new Error("Debes seleccionar un ejercicio.");
  }

  const exercise = JSON.parse(String(exerciseData));

  await prisma.sessionExercise.create({
    data: {
      sessionId,
      exerciseId: exercise.exerciseId || null,
      customName: exercise.customName,
      groupName: exercise.groupName,
      orderIndex: exercise.orderIndex,
      plannedSets: exercise.plannedSets,
      plannedReps: exercise.plannedReps,
      status: "pending"
    }
  });

  revalidatePath(`/sesion/${sessionId}`);
}

export async function startTemplateSessionAction(formData: FormData) {
  const user = await requireUser();
  const templateId = requireId(formData.get("templateId"), "No encontramos la rutina.");
  const sessionId = await startTemplateSession(user.id, templateId);
  revalidatePath("/");
  redirect(`/sesion/${sessionId}`);
}

export async function saveSessionAction(sessionId: string, formData: FormData) {
  const user = await requireUser();
  await saveSession(user.id, sessionId, formData);
  revalidatePath(`/sesion/${sessionId}`);
  revalidatePath(`/sesion/${sessionId}/resumen`);
  revalidatePath("/historial");
  revalidatePath("/");

  const afterSave = String(formData.get("afterSave") ?? "");

  if (afterSave === "home") {
    redirect("/");
  }

  if (afterSave === "summary") {
    redirect(`/sesion/${sessionId}/resumen`);
  }

  if (afterSave === "free") {
    redirect("/sesion/nueva");
  }
}

export async function saveSessionAsTemplateAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = requireId(formData.get("sessionId"), "No encontramos la sesion.");
  const templateName = String(formData.get("templateName") ?? "");

  await saveSessionAsTemplate(user.id, sessionId, templateName);
  revalidatePath("/");
  redirect("/");
}

export async function markAlertReadAction(formData: FormData) {
  const user = await requireUser();
  const alertId = requireId(formData.get("alertId"), "No encontramos la alerta.");
  await markAlertAsRead(user.id, alertId);

  const referer = (await headers()).get("referer");
  if (referer) {
    const pathname = new URL(referer).pathname;
    revalidatePath(pathname);
  }

  revalidatePath("/");
}

export async function importTemplateAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Debes adjuntar un archivo CSV.");
  }

  const csvText = await file.text();
  const result = await importTemplateFromCsv(user.id, file.name, csvText);

  revalidatePath("/");
  revalidatePath("/rutinas");

  if (!result.ok) {
    return;
  }

  redirect("/");
}

export async function deleteTemplateAction(formData: FormData) {
  const user = await requireUser();
  const templateId = requireId(formData.get("templateId"), "No encontramos la rutina.");
  await deleteTemplate(user.id, templateId);
  revalidatePath("/");
  revalidatePath("/rutinas");
}

export async function toggleTemplateFavoriteAction(formData: FormData) {
  const user = await requireUser();
  const templateId = requireId(formData.get("templateId"), "No encontramos la rutina.");
  await toggleTemplateFavorite(user.id, templateId);
  revalidatePath("/");
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
  const userId = requireId(formData.get("userId"), "No encontramos el usuario.");
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
  const userId = requireId(formData.get("userId"), "No encontramos el usuario.");

  if (userId === currentUser.id) {
    throw new Error("No puedes borrar tu propia cuenta.");
  }

  await deleteProvisionedUser(userId);
  revalidatePath("/admin/usuarios");
}
