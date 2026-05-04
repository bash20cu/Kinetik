const SESSION_STATUSES = ["planned", "in_progress", "completed", "discarded"] as const;
const EXERCISE_STATUSES = ["pending", "in_progress", "completed", "skipped"] as const;

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
  const status = String(value ?? "").trim();

  if (!SESSION_STATUSES.includes(status as typeof SESSION_STATUSES[number])) {
    throw new Error("El estado general de la sesion no es valido.");
  }

  return status as typeof SESSION_STATUSES[number];
}

export function parseExerciseStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "").trim();

  if (!EXERCISE_STATUSES.includes(status as typeof EXERCISE_STATUSES[number])) {
    throw new Error("El estado del ejercicio no es valido.");
  }

  return status as typeof EXERCISE_STATUSES[number];
}
