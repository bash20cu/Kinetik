export type CsvExerciseRow = {
  day_name: string;
  day_order: number;
  block_name: string;
  block_order: number;
  exercise_name: string;
  group_name: string;
  variant: string;
  planned_sets: number | null;
  planned_reps: string;
  notes: string;
};

const REQUIRED_COLUMNS = [
  "day_name",
  "day_order",
  "block_name",
  "block_order",
  "exercise_name",
  "group_name",
  "variant",
  "planned_sets",
  "planned_reps",
  "notes"
] as const;

const DELIMITER_CANDIDATES = [",", ";", "\t"] as const;

export const CSV_TEMPLATE = `${REQUIRED_COLUMNS.join(",")}
Dia 1,1,Pecho,1,Press plano,Pecho,Barra,4,12,Movimiento principal
Dia 1,1,Pecho,1,Press inclinado,Pecho,Mancuernas,3,10,Controlar tempo
Dia 1,1,Triceps,2,Press frances,Triceps,Polea,3,12,Sin bloquear codos
Dia 2,2,Espalda,1,Dominadas,Espalda,Abiertas,4,8,Usar asistencia si hace falta
Dia 2,2,Biceps,2,Curl mancuerna,Biceps,Alterno,3,12,Subida controlada
Dia 3,3,Pierna,1,Sentadilla,Pierna,Smith,4,10,Profundidad comoda
Dia 3,3,Core,2,Plancha,Core,Normal,3,45s,Respiracion estable
`;

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeaderCell(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function detectDelimiter(headerLine: string) {
  const ranked = DELIMITER_CANDIDATES.map((delimiter) => {
    const cells = parseCsvLine(headerLine, delimiter).map(normalizeHeaderCell);
    const matches = REQUIRED_COLUMNS.filter((column) => cells.includes(column)).length;

    return {
      delimiter,
      cells,
      matches
    };
  }).sort((left, right) => right.matches - left.matches);

  return ranked[0];
}

function parsePositiveInteger(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  if (!/^\d+(\.0+)?$/.test(normalized)) {
    return Number.NaN;
  }

  return Number.parseInt(normalized, 10);
}

function parseOptionalPositiveInteger(value: string) {
  const parsed = parsePositiveInteger(value);
  return Number.isInteger(parsed) && Number(parsed) > 0 ? parsed : null;
}

export function parseRoutineCsv(input: string) {
  const lines = input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      ok: false as const,
      errors: ["El archivo CSV debe incluir encabezados y al menos una fila."]
    };
  }

  const detected = detectDelimiter(lines[0]);
  const header = detected.cells;
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !header.includes(column));

  if (missingColumns.length > 0) {
    return {
      ok: false as const,
      errors: [
        `Faltan columnas requeridas: ${missingColumns.join(", ")}. Revisa que el CSV use encabezados correctos y separador coma, punto y coma o tabulacion.`
      ]
    };
  }

  const rows: CsvExerciseRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, rowIndex) => {
    const values = parseCsvLine(line, detected.delimiter);
    const record = Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
    const lineNumber = rowIndex + 2;

    const dayName = record.day_name?.trim();
    const blockName = record.block_name?.trim();
    const exerciseName = record.exercise_name?.trim();
    const groupName = record.group_name?.trim();
    const dayOrder = parsePositiveInteger(record.day_order ?? "");
    const blockOrder = parsePositiveInteger(record.block_order ?? "");
    const rawPlannedSets = String(record.planned_sets ?? "").trim();
    const plannedSets = parseOptionalPositiveInteger(rawPlannedSets);

    if (!dayName) errors.push(`Fila ${lineNumber}: day_name es obligatorio.`);
    if (!blockName) errors.push(`Fila ${lineNumber}: block_name es obligatorio.`);
    if (!exerciseName) errors.push(`Fila ${lineNumber}: exercise_name es obligatorio.`);
    if (!groupName) errors.push(`Fila ${lineNumber}: group_name es obligatorio.`);
    if (!Number.isInteger(dayOrder) || Number(dayOrder) <= 0) {
      errors.push(`Fila ${lineNumber}: day_order debe ser un entero positivo.`);
    }
    if (!Number.isInteger(blockOrder) || Number(blockOrder) <= 0) {
      errors.push(`Fila ${lineNumber}: block_order debe ser un entero positivo.`);
    }
    rows.push({
      day_name: dayName ?? "",
      day_order: dayOrder ?? 0,
      block_name: blockName ?? "",
      block_order: blockOrder ?? 0,
      exercise_name: exerciseName ?? "",
      group_name: groupName ?? "",
      variant: record.variant?.trim() ?? "",
      planned_sets: plannedSets,
      planned_reps: record.planned_reps?.trim() ?? "",
      notes: record.notes?.trim() ?? ""
    });
  });

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return { ok: true as const, rows };
}
