import { addDays, formatDate, startOfWeek, today, toDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type {
  ExerciseLibrary,
  HomeDashboardData,
  InAppAlert,
  ManagedUser,
  RoutineTemplate,
  RoutineTemplateSummary,
  SessionDetail,
  SessionLog,
  WeeklyCalendarDay
} from "@/lib/types";
import { parseExerciseStatus, parseSessionStatus } from "@/lib/validation";

export async function createAlert(input: {
  userId: string;
  type: InAppAlert["type"];
  title: string;
  body: string;
}) {
  await prisma.inAppAlert.create({
    data: input
  });
}

export async function markAlertAsRead(userId: string, alertId: string) {
  await prisma.inAppAlert.updateMany({
    where: {
      id: alertId,
      userId
    },
    data: {
      readAt: new Date()
    }
  });
}

export async function getUnreadAlerts(userId: string) {
  const alerts = await prisma.inAppAlert.findMany({
    where: {
      userId,
      readAt: null
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 8
  });

  return alerts.map((alert) => ({
    id: alert.id,
    type: alert.type,
    title: alert.title,
    body: alert.body,
    readAt: alert.readAt ? alert.readAt.toISOString() : null,
    createdAt: alert.createdAt.toISOString()
  }));
}

export async function getExerciseLibrary(): Promise<ExerciseLibrary[]> {
  const exercises = await prisma.exerciseLibrary.findMany({
    orderBy: [{ groupName: "asc" }, { name: "asc" }]
  });

  return exercises;
}

export async function getExerciseGroups(): Promise<Record<string, string[]>> {
  const exercises = await getExerciseLibrary();
  const groups: Record<string, string[]> = {};

  for (const exercise of exercises) {
    if (!groups[exercise.groupName]) {
      groups[exercise.groupName] = [];
    }
    groups[exercise.groupName].push(exercise.name);
  }

  return groups;
}

export async function createSessionLog(
  userId: string,
  exercises: Array<{
    exerciseId?: string | null;
    customName?: string | null;
    groupName: string;
    plannedSets?: number | null;
    plannedReps?: string | null;
  }>
): Promise<string> {
  if (exercises.length === 0) {
    throw new Error("Debes agregar al menos un ejercicio.");
  }

  const session = await prisma.sessionLog.create({
    data: {
      userId,
      sessionDate: today(),
      status: "planned",
      exercises: {
        create: exercises.map((exercise, index) => ({
          exerciseId: exercise.exerciseId || null,
          customName: exercise.customName,
          groupName: exercise.groupName,
          orderIndex: index,
          plannedSets: exercise.plannedSets,
          plannedReps: exercise.plannedReps,
          status: "pending"
        }))
      }
    }
  });

  await createAlert({
    userId,
    type: "info",
    title: "Sesion creada",
    body: "Tu sesion esta lista. Dale play cuando estes en el gym."
  });

  return session.id;
}

export async function getSessionDetail(userId: string, sessionId: string): Promise<SessionDetail | null> {
  const session = await prisma.sessionLog.findFirst({
    where: {
      id: sessionId,
      userId
    },
    include: {
      exercises: {
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!session) {
    return null;
  }

  const exerciseIds = session.exercises
    .filter((ex) => ex.exerciseId)
    .map((ex) => ex.exerciseId as string);

  const libraryMap = exerciseIds.length > 0
    ? await prisma.exerciseLibrary.findMany({
        where: { id: { in: exerciseIds } }
      }).then((items) => {
        const map = new Map<string, { id: string; name: string; groupName: string; variant: string | null }>();
        for (const item of items) {
          map.set(item.id, {
            id: item.id,
            name: item.name,
            groupName: item.groupName,
            variant: item.variant
          });
        }
        return map;
      })
    : new Map();

  return {
    id: session.id,
    userId: session.userId,
    date: toDateString(session.sessionDate),
    durationSeconds: session.durationSeconds,
    status: session.status,
    generalNotes: session.generalNotes,
    createdAt: session.createdAt.toISOString(),
    exercises: session.exercises.map((ex) => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      customName: ex.customName,
      groupName: ex.groupName,
      orderIndex: ex.orderIndex,
      plannedSets: ex.plannedSets,
      plannedReps: ex.plannedReps,
      actualSets: ex.actualSets,
      reps: ex.reps,
      weight: ex.weight,
      status: ex.status,
      note: ex.note,
      libraryExercise: libraryMap.get(ex.exerciseId || "") || null
    }))
  };
}

export async function saveSession(userId: string, sessionId: string, formData: FormData) {
  const detail = await getSessionDetail(userId, sessionId);

  if (!detail) {
    throw new Error("La sesion no existe o no pertenece al usuario.");
  }

  await prisma.$transaction(async (tx) => {
    for (const exercise of detail.exercises) {
      const status = parseExerciseStatus(formData.get(`status-${exercise.id}`) ?? "pending");
      const reps = String(formData.get(`reps-${exercise.id}`) ?? "").trim();
      const weight = String(formData.get(`weight-${exercise.id}`) ?? "").trim();
      const note = String(formData.get(`note-${exercise.id}`) ?? "").trim();
      const actualSets = Number(formData.get(`sets-${exercise.id}`) ?? "0");

      await tx.sessionExercise.update({
        where: { id: exercise.id },
        data: {
          actualSets: actualSets > 0 ? actualSets : null,
          reps: reps || null,
          weight: weight || null,
          status,
          note: note || null
        }
      });
    }

    const generalNotes = String(formData.get("generalNotes") ?? "").trim();
    const status = parseSessionStatus(formData.get("sessionStatus") ?? "in_progress");

    await tx.sessionLog.update({
      where: { id: sessionId },
      data: {
        status,
        generalNotes: generalNotes || null
      }
    });
  });

  const sessionStatus = parseSessionStatus(formData.get("sessionStatus") ?? "in_progress");

  if (sessionStatus === "completed") {
    await createAlert({
      userId,
      type: "success",
      title: "Sesion completada",
      body: "Gran trabajo. Tu progreso esta guardado."
    });
  }
}

export async function getSessions(userId: string): Promise<SessionLog[]> {
  const sessions = await prisma.sessionLog.findMany({
    where: { userId },
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }]
  });

  return sessions.map((session) => ({
    id: session.id,
    userId: session.userId,
    date: toDateString(session.sessionDate),
    durationSeconds: session.durationSeconds,
    status: session.status,
    generalNotes: session.generalNotes,
    createdAt: session.createdAt.toISOString()
  }));
}

export async function getOpenSession(userId: string): Promise<SessionLog | null> {
  const session = await prisma.sessionLog.findFirst({
    where: {
      userId,
      status: { in: ["planned", "in_progress"] }
    },
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }]
  });

  if (!session) return null;

  return {
    id: session.id,
    userId: session.userId,
    date: toDateString(session.sessionDate),
    durationSeconds: session.durationSeconds,
    status: session.status,
    generalNotes: session.generalNotes,
    createdAt: session.createdAt.toISOString()
  };
}

export async function getLatestSession(userId: string): Promise<SessionLog | null> {
  const session = await prisma.sessionLog.findFirst({
    where: { userId, status: "completed" },
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }]
  });

  if (!session) return null;

  return {
    id: session.id,
    userId: session.userId,
    date: toDateString(session.sessionDate),
    durationSeconds: session.durationSeconds,
    status: session.status,
    generalNotes: session.generalNotes,
    createdAt: session.createdAt.toISOString()
  };
}

export async function getWeeklyCalendar(userId: string): Promise<WeeklyCalendarDay[]> {
  const base = today();
  const weekStart = startOfWeek(base);
  const weekEnd = addDays(weekStart, 6);

  const sessions = await prisma.sessionLog.findMany({
    where: {
      userId,
      sessionDate: { gte: weekStart, lte: weekEnd }
    },
    orderBy: [{ sessionDate: "desc" }]
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const isoDate = toDateString(date);
    const isToday = isoDate === toDateString(base);
    const matchingSession = sessions.find((s) => toDateString(s.sessionDate) === isoDate) ?? null;

    return {
      date: isoDate,
      dateLabel: formatDate(date, "es-CR", { day: "2-digit", month: "2-digit" }),
      weekdayLabel: formatDate(date, "es-CR", { weekday: "short" }).replace(".", "").toUpperCase(),
      isToday,
      sessionId: matchingSession?.id ?? null,
      sessionStatus: matchingSession?.status ?? null,
      dayName: matchingSession ? `Sesion #${matchingSession.id.slice(0, 4)}` : null
    };
  });
}

export async function saveSessionAsTemplate(
  userId: string,
  sessionId: string,
  templateName: string
) {
  const detail = await getSessionDetail(userId, sessionId);

  if (!detail) {
    throw new Error("La sesion no existe o no te pertenece.");
  }

  const normalizedName = templateName.trim() || `Rutina desde sesion ${detail.date}`;

  await prisma.$transaction(async (tx) => {
    await tx.routineTemplate.create({
      data: {
        userId,
        name: normalizedName,
        status: "active",
        exercises: {
          create: detail.exercises.map((exercise, index) => ({
            exerciseId: exercise.exerciseId,
            customName: exercise.customName,
            groupName: exercise.groupName,
            orderIndex: index,
            plannedSets: exercise.plannedSets || exercise.actualSets,
            plannedReps: exercise.reps || exercise.plannedReps,
            notes: exercise.note
          }))
        }
      }
    });
  });

  await createAlert({
    userId,
    type: "success",
    title: "Rutina guardada",
    body: `"${normalizedName}" esta lista para reusar.`
  });
}

export async function startTemplateSession(userId: string, templateId: string): Promise<string> {
  const template = await prisma.routineTemplate.findFirst({
    where: { id: templateId, userId },
    include: { exercises: { orderBy: { orderIndex: "asc" } } }
  });

  if (!template) {
    throw new Error("No encontramos la rutina que quieres entrenar.");
  }

  if (template.exercises.length === 0) {
    throw new Error("La rutina no tiene ejercicios.");
  }

  const session = await prisma.sessionLog.create({
    data: {
      userId,
      sessionDate: today(),
      status: "planned",
      exercises: {
        create: template.exercises.map((exercise, index) => ({
          exerciseId: exercise.exerciseId,
          customName: exercise.customName,
          groupName: exercise.groupName,
          orderIndex: index,
          plannedSets: exercise.plannedSets,
          plannedReps: exercise.plannedReps,
          status: "pending"
        }))
      }
    }
  });

  return session.id;
}

export async function getTemplates(userId: string): Promise<RoutineTemplateSummary[]> {
  const templates = await prisma.routineTemplate.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { exercises: true } }
    }
  });

  return templates.map((template) => ({
    id: template.id,
    userId: template.userId,
    name: template.name,
    status: template.status,
    isFavorite: template.isFavorite,
    createdAt: template.createdAt.toISOString(),
    exerciseCount: template._count.exercises
  }));
}

export async function getTemplate(userId: string, templateId: string): Promise<RoutineTemplate | null> {
  const template = await prisma.routineTemplate.findFirst({
    where: { id: templateId, userId },
    include: {
      exercises: {
        orderBy: { orderIndex: "asc" },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              groupName: true,
              variant: true
            }
          }
        }
      }
    }
  });

  if (!template) return null;

  return {
    id: template.id,
    userId: template.userId,
    name: template.name,
    status: template.status,
    isFavorite: template.isFavorite,
    createdAt: template.createdAt.toISOString(),
    exercises: template.exercises.map((ex) => ({
      id: ex.id,
      templateId: ex.templateId,
      exerciseId: ex.exerciseId,
      customName: ex.customName,
      groupName: ex.groupName,
      orderIndex: ex.orderIndex,
      plannedSets: ex.plannedSets,
      plannedReps: ex.plannedReps,
      notes: ex.notes,
      variant: ex.variant,
      libraryExercise: ex.exercise ? {
        id: ex.exercise.id,
        name: ex.exercise.name,
        groupName: ex.exercise.groupName,
        variant: ex.exercise.variant
      } : null
    }))
  };
}

export async function deleteTemplate(userId: string, templateId: string) {
  const template = await prisma.routineTemplate.findFirst({
    where: { id: templateId, userId }
  });

  if (!template) {
    throw new Error("No encontramos la rutina que quieres eliminar.");
  }

  await prisma.routineTemplate.delete({
    where: { id: templateId }
  });
}

export async function toggleTemplateFavorite(userId: string, templateId: string) {
  const template = await prisma.routineTemplate.findFirst({
    where: { id: templateId, userId }
  });

  if (!template) {
    throw new Error("No encontramos la rutina.");
  }

  await prisma.routineTemplate.update({
    where: { id: templateId },
    data: { isFavorite: !template.isFavorite }
  });
}

export async function getHomeDashboardData(userId: string): Promise<HomeDashboardData> {
  const [user, alerts, week, recentTemplates, latestSession, openSession] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    getUnreadAlerts(userId),
    getWeeklyCalendar(userId),
    getTemplates(userId).then((t) => t.slice(0, 4)),
    getLatestSession(userId),
    getOpenSession(userId)
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString()
    },
    alerts,
    week,
    recentTemplates,
    latestSession,
    openSession
  };
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          sessionLogs: true,
          templates: true
        }
      }
    }
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    sessionCount: user._count.sessionLogs,
    templateCount: user._count.templates
  }));
}

export async function importTemplateFromCsv(userId: string, fileName: string, csvText: string) {
  const importItem = await prisma.planImport.create({
    data: {
      userId,
      fileName,
      status: "processing"
    }
  });

  try {
    const { parseRoutineCsv } = await import("@/lib/csv");
    const parsed = parseRoutineCsv(csvText);

    if (!parsed.ok) {
      const summary = parsed.errors.join(" | ").slice(0, 1200);

      await prisma.planImport.update({
        where: { id: importItem.id },
        data: { status: "failed", errorSummary: summary }
      });

      await createAlert({
        userId,
        type: "error",
        title: "Importacion rechazada",
        body: "El CSV tiene errores. Revisa el detalle e intenta de nuevo."
      });

      return { ok: false as const, errors: parsed.errors };
    }

    const exerciseLibrary = await getExerciseLibrary();
    const libraryMap = new Map<string, string>();
    for (const ex of exerciseLibrary) {
      libraryMap.set(ex.name.toLowerCase(), ex.id);
    }

    const exercises = parsed.rows.map((row, index) => {
      const libraryId = libraryMap.get(row.exercise_name.toLowerCase());
      return {
        exerciseId: libraryId || null,
        customName: libraryId ? null : row.exercise_name,
        groupName: row.group_name,
        orderIndex: index,
        plannedSets: row.planned_sets,
        plannedReps: row.planned_reps || null
      };
    });

    await prisma.routineTemplate.create({
      data: {
        userId,
        name: `Importado ${toDateString(today())}`,
        status: "active",
        exercises: { create: exercises }
      }
    });

    await prisma.planImport.update({
      where: { id: importItem.id },
      data: { status: "success", errorSummary: null }
    });

    await createAlert({
      userId,
      type: "success",
      title: "Rutina importada",
      body: `${parsed.rows.length} ejercicios cargados desde CSV.`
    });

    return { ok: true as const };
  } catch (error) {
    const summary = error instanceof Error ? error.message.slice(0, 1200) : "Error inesperado.";

    await prisma.planImport.update({
      where: { id: importItem.id },
      data: { status: "failed", errorSummary: summary }
    });

    throw error;
  }
}
