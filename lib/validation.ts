import { ExerciseLogStatus, WorkoutSessionStatus } from "@prisma/client";

type PlanPayload = {
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

const SESSION_STATUSES = new Set<WorkoutSessionStatus>(Object.values(WorkoutSessionStatus));
const EXERCISE_STATUSES = new Set<ExerciseLogStatus>(Object.values(ExerciseLogStatus));

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function requireEmail(value: string) {
  const normalized = normalizeEmail(value);

  if (!normalized) {
    throw new Error("El email es obligatorio.");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalized)) {
    throw new Error("Ingresa un email valido.");
  }

  return normalized;
}

export function requirePassword(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("La contrasena es obligatoria.");
  }

  return normalized;
}

export function requireId(value: FormDataEntryValue | null, message: string) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error(message);
  }

  return normalized;
}

export function parseOptionalNonNegativeInteger(value: FormDataEntryValue | null, fieldLabel: string) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${fieldLabel} debe ser un entero mayor o igual a cero.`);
  }

  return Number.parseInt(raw, 10);
}

export function parseSessionStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "").trim() as WorkoutSessionStatus;

  if (!SESSION_STATUSES.has(status)) {
    throw new Error("El estado general de la sesion no es valido.");
  }

  return status;
}

export function parseExerciseStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "").trim() as ExerciseLogStatus;

  if (!EXERCISE_STATUSES.has(status)) {
    throw new Error("El estado del ejercicio no es valido.");
  }

  return status;
}

export function parsePlanPayload(payload: string) {
  let parsed: PlanPayload;

  try {
    parsed = JSON.parse(payload) as PlanPayload;
  } catch {
    throw new Error("No pudimos interpretar la rutina enviada.");
  }

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
