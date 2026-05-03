import {
  AlertType,
  ExerciseLogStatus,
  PlanImportStatus,
  Prisma,
  RoutinePlanStatus,
  WorkoutSessionStatus
} from "@prisma/client";

import { parseRoutineCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import type {
  CsvExerciseRow,
  DashboardData,
  HomeDashboardData,
  InAppAlert,
  PlanImport,
  RoutinePlan,
  SessionDetail,
  WeeklyCalendarDay,
  WorkoutSession
} from "@/lib/types";

function today() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfWeek(base: Date) {
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(base, diff);
}

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mapAlert(alert: {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}): InAppAlert {
  return {
    id: alert.id,
    type: alert.type,
    title: alert.title,
    body: alert.body,
    readAt: alert.readAt ? alert.readAt.toISOString() : null,
    createdAt: alert.createdAt.toISOString()
  };
}

function mapWorkoutSession(session: {
  id: string;
  userId: string;
  planId: string;
  dayId: string;
  sessionDate: Date;
  status: WorkoutSessionStatus;
  generalNotes: string | null;
  day: { name: string };
  plan: { name: string };
}): WorkoutSession {
  return {
    id: session.id,
    userId: session.userId,
    planId: session.planId,
    dayId: session.dayId,
    date: toDateString(session.sessionDate),
    status: session.status,
    generalNotes: session.generalNotes,
    dayName: session.day.name,
    planName: session.plan.name
  };
}

function mapRoutinePlan(plan: Prisma.RoutinePlanGetPayload<{
  include: {
    days: {
      include: {
        blocks: {
          include: {
            exercises: true;
          };
        };
      };
    };
  };
}>): RoutinePlan {
  return {
    id: plan.id,
    userId: plan.userId,
    name: plan.name,
    activeFrom: toDateString(plan.activeFrom),
    status: plan.status,
    days: plan.days
      .slice()
      .sort((left, right) => left.dayOrder - right.dayOrder)
      .map((day) => ({
        id: day.id,
        name: day.name,
        order: day.dayOrder,
        blocks: day.blocks
          .slice()
          .sort((left, right) => left.blockOrder - right.blockOrder)
          .map((block) => ({
            id: block.id,
            name: block.name,
            order: block.blockOrder,
            exercises: block.exercises
              .slice()
              .sort((left, right) => left.name.localeCompare(right.name))
              .map((exercise) => ({
                id: exercise.id,
                blockId: exercise.blockId,
                name: exercise.name,
                groupName: exercise.groupName,
                variant: exercise.variant,
                plannedSets: exercise.plannedSets,
                plannedReps: exercise.plannedReps,
                notes: exercise.notes
              }))
          }))
      }))
  };
}

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
      userId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 8
  });

  return alerts.map(mapAlert);
}

export async function getActivePlan(userId: string): Promise<RoutinePlan | null> {
  const plan = await prisma.routinePlan.findFirst({
    where: {
      userId,
      status: RoutinePlanStatus.active
    },
    orderBy: {
      activeFrom: "desc"
    },
    include: {
      days: {
        include: {
          blocks: {
            include: {
              exercises: true
            }
          }
        }
      }
    }
  });

  return plan ? mapRoutinePlan(plan) : null;
}

export async function getLatestSession(userId: string): Promise<WorkoutSession | null> {
  const session = await prisma.workoutSession.findFirst({
    where: {
      userId
    },
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
    include: {
      day: {
        select: {
          name: true
        }
      },
      plan: {
        select: {
          name: true
        }
      }
    }
  });

  return session ? mapWorkoutSession(session) : null;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [user, alerts, activePlan, latestSession] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      }
    }),
    getUnreadAlerts(userId),
    getActivePlan(userId),
    getLatestSession(userId)
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString()
    },
    alerts,
    activePlan,
    latestSession
  };
}

export async function getHomeDashboardData(userId: string): Promise<HomeDashboardData> {
  const [dashboard, week] = await Promise.all([
    getDashboardData(userId),
    getWeeklyCalendar(userId)
  ]);

  return {
    ...dashboard,
    week,
    todaysAssignment: week.find((day) => day.isToday) ?? null
  };
}

export async function getSessions(userId: string) {
  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId
    },
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
    include: {
      day: {
        select: {
          name: true
        }
      },
      plan: {
        select: {
          name: true
        }
      }
    }
  });

  return sessions.map(mapWorkoutSession);
}

export async function getWeeklyCalendar(userId: string): Promise<WeeklyCalendarDay[]> {
  const activePlan = await getActivePlan(userId);
  const base = today();
  const weekStart = startOfWeek(base);
  const weekEnd = addDays(weekStart, 6);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      sessionDate: {
        gte: weekStart,
        lte: weekEnd
      }
    },
    include: {
      day: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  const weekdayFormatter = new Intl.DateTimeFormat("es-CR", { weekday: "short" });
  const dateFormatter = new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "2-digit" });

  const routineDays = activePlan?.days ?? [];
  const cycleDays = routineDays.length > 0 ? [...routineDays, ...routineDays] : [];

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const isoDate = toDateString(date);
    const isToday = isoDate === toDateString(base);
    const isSunday = date.getDay() === 0;
    const assigned = !isSunday && cycleDays.length > 0 ? cycleDays[index % cycleDays.length] : null;
    const matchingSession = sessions.find((session) => toDateString(session.sessionDate) === isoDate) ?? null;

    let status: WeeklyCalendarDay["status"] = "recovery";

    if (matchingSession) {
      if (matchingSession.status === WorkoutSessionStatus.completed) {
        status = "completed";
      } else if (matchingSession.status === WorkoutSessionStatus.in_progress) {
        status = "in_progress";
      } else {
        status = isToday ? "today" : "planned";
      }
    } else if (assigned) {
      status = isToday ? "today" : "planned";
    }

    return {
      date: isoDate,
      dateLabel: dateFormatter.format(date),
      weekdayLabel: weekdayFormatter.format(date).replace(".", "").toUpperCase(),
      isToday,
      assignedDayId: assigned?.id ?? matchingSession?.day.id ?? null,
      assignedDayName: assigned?.name ?? matchingSession?.day.name ?? null,
      status,
      sessionId: matchingSession?.id ?? null
    };
  });
}

export async function getSessionDetail(userId: string, sessionId: string): Promise<SessionDetail | null> {
  const session = await prisma.workoutSession.findFirst({
    where: {
      id: sessionId,
      userId
    },
    include: {
      day: {
        include: {
          blocks: {
            include: {
              exercises: {
                include: {
                  exerciseLogs: {
                    where: {
                      sessionId
                    }
                  }
                }
              }
            }
          }
        }
      },
      plan: {
        select: {
          name: true
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    userId: session.userId,
    planId: session.planId,
    dayId: session.dayId,
    date: toDateString(session.sessionDate),
    status: session.status,
    generalNotes: session.generalNotes,
    dayName: session.day.name,
    planName: session.plan.name,
    blocks: session.day.blocks
      .slice()
      .sort((left, right) => left.blockOrder - right.blockOrder)
      .map((block) => ({
        id: block.id,
        name: block.name,
        order: block.blockOrder,
        exercises: block.exercises
          .slice()
          .sort((left, right) => left.name.localeCompare(right.name))
          .map((exercise) => {
            const log = exercise.exerciseLogs[0] ?? null;

            return {
              id: exercise.id,
              blockId: exercise.blockId,
              name: exercise.name,
              groupName: exercise.groupName,
              variant: exercise.variant,
              plannedSets: exercise.plannedSets,
              plannedReps: exercise.plannedReps,
              notes: exercise.notes,
              log: log
                ? {
                    id: log.id,
                    sessionId: log.sessionId,
                    exerciseId: log.exerciseId,
                    setsCompleted: log.setsCompleted,
                    reps: log.reps,
                    weight: log.weight,
                    status: log.status,
                    note: log.note
                  }
                : null
            };
          })
      }))
  };
}

export async function createSession(userId: string, dayId: string) {
  const day = await prisma.routineDay.findFirst({
    where: {
      id: dayId,
      plan: {
        userId
      }
    },
    include: {
      plan: true
    }
  });

  if (!day) {
    throw new Error("No encontramos el dia de rutina solicitado.");
  }

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      planId: day.planId,
      dayId,
      sessionDate: today(),
      status: WorkoutSessionStatus.planned
    }
  });

  await createAlert({
    userId,
    type: "info",
    title: "Sesion creada",
    body: `Tu sesion para ${day.name} ya esta lista para registrar progreso.`
  });

  return session.id;
}

export async function saveSession(userId: string, sessionId: string, formData: FormData) {
  const detail = await getSessionDetail(userId, sessionId);

  if (!detail) {
    throw new Error("La sesion no existe o no pertenece al usuario.");
  }

  await prisma.$transaction(async (tx) => {
    for (const block of detail.blocks) {
      for (const exercise of block.exercises) {
        const status = String(formData.get(`status-${exercise.id}`) ?? "pending") as ExerciseLogStatus;
        const setsCompletedValue = String(formData.get(`sets-${exercise.id}`) ?? "").trim();
        const reps = String(formData.get(`reps-${exercise.id}`) ?? "").trim();
        const weight = String(formData.get(`weight-${exercise.id}`) ?? "").trim();
        const note = String(formData.get(`note-${exercise.id}`) ?? "").trim();
        const parsedSets = setsCompletedValue ? Number(setsCompletedValue) : null;

        await tx.exerciseLog.upsert({
          where: {
            sessionId_exerciseId: {
              sessionId,
              exerciseId: exercise.id
            }
          },
          update: {
            setsCompleted: Number.isFinite(parsedSets) ? parsedSets : null,
            reps: reps || null,
            weight: weight || null,
            status,
            note: note || null
          },
          create: {
            sessionId,
            exerciseId: exercise.id,
            setsCompleted: Number.isFinite(parsedSets) ? parsedSets : null,
            reps: reps || null,
            weight: weight || null,
            status,
            note: note || null
          }
        });
      }
    }

    const generalNotes = String(formData.get("generalNotes") ?? "").trim();
    const status = String(formData.get("sessionStatus") ?? "in_progress") as WorkoutSessionStatus;

    await tx.workoutSession.update({
      where: {
        id: sessionId
      },
      data: {
        status,
        generalNotes: generalNotes || null
      }
    });
  });

  const sessionStatus = String(formData.get("sessionStatus") ?? "in_progress");

  if (sessionStatus === WorkoutSessionStatus.completed) {
    await createAlert({
      userId,
      type: "success",
      title: "Sesion completada",
      body: `Guardamos tu progreso para ${detail.dayName}.`
    });
  }
}

export async function getPlanImports(userId: string) {
  const items = await prisma.planImport.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  });

  return items.map(
    (item): PlanImport => ({
      id: item.id,
      userId: item.userId,
      fileName: item.fileName,
      status: item.status,
      errorSummary: item.errorSummary,
      createdAt: item.createdAt.toISOString()
    })
  );
}

function groupCsvRows(rows: CsvExerciseRow[]) {
  const days = new Map<
    string,
    {
      name: string;
      order: number;
      blocks: Map<
        string,
        {
          name: string;
          order: number;
          exercises: CsvExerciseRow[];
        }
      >;
    }
  >();

  for (const row of rows) {
    const dayKey = `${row.day_order}:${row.day_name}`;

    if (!days.has(dayKey)) {
      days.set(dayKey, {
        name: row.day_name,
        order: row.day_order,
        blocks: new Map()
      });
    }

    const day = days.get(dayKey)!;
    const blockKey = `${row.block_order}:${row.block_name}`;

    if (!day.blocks.has(blockKey)) {
      day.blocks.set(blockKey, {
        name: row.block_name,
        order: row.block_order,
        exercises: []
      });
    }

    day.blocks.get(blockKey)!.exercises.push(row);
  }

  return Array.from(days.values())
    .sort((left, right) => left.order - right.order)
    .map((day) => ({
      name: day.name,
      dayOrder: day.order,
      blocks: Array.from(day.blocks.values())
        .sort((left, right) => left.order - right.order)
        .map((block) => ({
          name: block.name,
          blockOrder: block.order,
          exercises: block.exercises
            .slice()
            .sort((left, right) => left.exercise_name.localeCompare(right.exercise_name))
            .map((exercise) => ({
              name: exercise.exercise_name,
              groupName: exercise.group_name,
              variant: exercise.variant || null,
              plannedSets: exercise.planned_sets,
              plannedReps: exercise.planned_reps || null,
              notes: exercise.notes || null
            }))
        }))
    }));
}

export async function importPlanFromCsv(userId: string, fileName: string, csvText: string) {
  const importItem = await prisma.planImport.create({
    data: {
      userId,
      fileName,
      status: PlanImportStatus.processing
    }
  });

  const parsed = parseRoutineCsv(csvText);

  if (!parsed.ok) {
    const summary = parsed.errors.join(" | ").slice(0, 1200);

    await prisma.planImport.update({
      where: {
        id: importItem.id
      },
      data: {
        status: PlanImportStatus.failed,
        errorSummary: summary
      }
    });

    await createAlert({
      userId,
      type: "error",
      title: "Importacion rechazada",
      body: "El CSV tiene errores. Revisa el detalle de la carga e intenta de nuevo."
    });

    return { ok: false as const, errors: parsed.errors };
  }

  const groupedDays = groupCsvRows(parsed.rows);

  await prisma.$transaction(async (tx) => {
    await tx.routinePlan.updateMany({
      where: {
        userId,
        status: RoutinePlanStatus.active
      },
      data: {
        status: RoutinePlanStatus.archived
      }
    });

    await tx.routinePlan.create({
      data: {
        userId,
        name: `Plan ${toDateString(today())}`,
        activeFrom: today(),
        status: RoutinePlanStatus.active,
        days: {
          create: groupedDays.map((day) => ({
            name: day.name,
            dayOrder: day.dayOrder,
            blocks: {
              create: day.blocks.map((block) => ({
                name: block.name,
                blockOrder: block.blockOrder,
                exercises: {
                  create: block.exercises
                }
              }))
            }
          }))
        }
      }
    });

    await tx.planImport.update({
      where: {
        id: importItem.id
      },
      data: {
        status: PlanImportStatus.success,
        errorSummary: null
      }
    });
  });

  await createAlert({
    userId,
    type: "success",
    title: "Rutina actualizada",
    body: `Se activo un nuevo plan con ${parsed.rows.length} ejercicios importados.`
  });

  return { ok: true as const };
}
