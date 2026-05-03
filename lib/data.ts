import {
  AlertType,
  PlanImportStatus,
  Prisma,
  RoutinePlanStatus,
  WorkoutSessionStatus
} from "@prisma/client";

import { parseRoutineCsv } from "@/lib/csv";
import { addDays, formatDate, startOfWeek, today, toDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type {
  CsvExerciseRow,
  DashboardData,
  FreeWorkoutTemplate,
  HomeDashboardData,
  InAppAlert,
  ManagedUser,
  PlanImport,
  RoutinePlan,
  RoutinePlanSummary,
  SessionDetail,
  WorkoutSuggestion,
  WeeklyCalendarDay,
  WorkoutSession
} from "@/lib/types";
import {
  parseExerciseStatus,
  parseOptionalNonNegativeInteger,
  parseSessionStatus
} from "@/lib/validation";

type ManualRoutineExerciseInput = {
  name: string;
  groupName: string;
  variant?: string | null;
  plannedSets?: number | null;
  plannedReps?: string | null;
  notes?: string | null;
};

type ManualRoutineBlockInput = {
  name: string;
  blockOrder: number;
  exercises: ManualRoutineExerciseInput[];
};

type ManualRoutineDayInput = {
  name: string;
  dayOrder: number;
  blocks: ManualRoutineBlockInput[];
};

type FreeWorkoutInput = {
  name: string;
  groupName: string;
  variant?: string | null;
  plannedSets?: number | null;
  plannedReps?: string | null;
  notes?: string | null;
};

const FREE_WORKOUT_PLAN_PREFIX = "__FREE_WORKOUT__::";
const FREE_WORKOUT_PLAN_LABEL = "Entrenamiento libre";

function buildFreeWorkoutPlanName(name: string) {
  return `${FREE_WORKOUT_PLAN_PREFIX}${name.trim()}`;
}

function isFreeWorkoutPlanName(name: string) {
  return name.startsWith(FREE_WORKOUT_PLAN_PREFIX);
}

function getFreeWorkoutDisplayName(name: string) {
  return isFreeWorkoutPlanName(name) ? name.slice(FREE_WORKOUT_PLAN_PREFIX.length).trim() : name;
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
  const isFreeWorkout = isFreeWorkoutPlanName(session.plan.name);

  return {
    id: session.id,
    userId: session.userId,
    planId: session.planId,
    dayId: session.dayId,
    date: toDateString(session.sessionDate),
    status: session.status,
    generalNotes: session.generalNotes,
    dayName: session.day.name,
    planName: isFreeWorkout ? FREE_WORKOUT_PLAN_LABEL : session.plan.name
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

function mapRoutinePlanSummary(plan: Prisma.RoutinePlanGetPayload<{
  include: {
    days: {
      include: {
        blocks: {
          include: {
            _count: {
              select: {
                exercises: true;
              };
            };
          };
        };
      };
    };
    _count: {
      select: {
        sessions: true;
      };
    };
  };
}>): RoutinePlanSummary {
  const exerciseCount = plan.days.reduce(
    (dayTotal, day) =>
      dayTotal +
      day.blocks.reduce((blockTotal, block) => blockTotal + block._count.exercises, 0),
    0
  );

  return {
    id: plan.id,
    userId: plan.userId,
    name: plan.name,
    activeFrom: toDateString(plan.activeFrom),
    status: plan.status,
    dayCount: plan.days.length,
    exerciseCount,
    sessionCount: plan._count.sessions
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
      userId,
      readAt: null
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

export async function getPlanById(userId: string, planId: string): Promise<RoutinePlan | null> {
  const plan = await prisma.routinePlan.findFirst({
    where: {
      id: planId,
      userId
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

export async function getRoutinePlans(userId: string): Promise<RoutinePlanSummary[]> {
  const plans = await prisma.routinePlan.findMany({
    where: {
      userId
    },
    orderBy: [{ activeFrom: "desc" }, { createdAt: "desc" }],
    include: {
      days: {
        include: {
          blocks: {
            include: {
              _count: {
                select: {
                  exercises: true
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          sessions: true
        }
      }
    }
  });

  return plans
    .map(mapRoutinePlanSummary)
    .filter((plan) => !isFreeWorkoutPlanName(plan.name))
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === RoutinePlanStatus.active ? -1 : 1;
      }

      return right.activeFrom.localeCompare(left.activeFrom);
    });
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

export async function getOpenSession(userId: string): Promise<WorkoutSession | null> {
  const session = await prisma.workoutSession.findFirst({
    where: {
      userId,
      status: {
        in: [WorkoutSessionStatus.planned, WorkoutSessionStatus.in_progress]
      }
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
  const [dashboard, week, openSession, suggestedWorkout, freeWorkoutTemplates] = await Promise.all([
    getDashboardData(userId),
    getWeeklyCalendar(userId),
    getOpenSession(userId),
    getSuggestedWorkout(userId),
    getFreeWorkoutTemplates(userId)
  ]);

  return {
    ...dashboard,
    week,
    todaysAssignment: week.find((day) => day.isToday) ?? null,
    openSession,
    suggestedWorkout,
    freeWorkoutTemplates
  };
}

export async function getSuggestedWorkout(userId: string): Promise<WorkoutSuggestion | null> {
  const activePlan = await getActivePlan(userId);

  if (!activePlan || activePlan.days.length === 0) {
    return null;
  }

  const latestPlanSession = await prisma.workoutSession.findFirst({
    where: {
      userId,
      planId: activePlan.id
    },
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }]
  });

  const orderedDays = activePlan.days.slice().sort((left, right) => left.order - right.order);
  let suggestedDay = orderedDays[0];

  if (latestPlanSession) {
    const currentIndex = orderedDays.findIndex((day) => day.id === latestPlanSession.dayId);

    if (currentIndex >= 0) {
      suggestedDay = orderedDays[(currentIndex + 1) % orderedDays.length];
    }
  }

  return {
    dayId: suggestedDay.id,
    dayName: suggestedDay.name,
    planName: activePlan.name
  };
}

export async function getFreeWorkoutTemplates(userId: string): Promise<FreeWorkoutTemplate[]> {
  const plans = await prisma.routinePlan.findMany({
    where: {
      userId,
      name: {
        startsWith: FREE_WORKOUT_PLAN_PREFIX
      }
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      days: {
        include: {
          blocks: {
            include: {
              _count: {
                select: {
                  exercises: true
                }
              }
            }
          }
        }
      }
    }
  });

  const templates = new Map<string, FreeWorkoutTemplate>();

  for (const plan of plans) {
    const displayName = getFreeWorkoutDisplayName(plan.name);

    if (templates.has(displayName)) {
      continue;
    }

    const firstDay = plan.days.slice().sort((left, right) => left.dayOrder - right.dayOrder)[0];

    if (!firstDay) {
      continue;
    }

    const exerciseCount = firstDay.blocks.reduce(
      (count, block) => count + block._count.exercises,
      0
    );

    templates.set(displayName, {
      planId: plan.id,
      dayId: firstDay.id,
      name: displayName,
      exerciseCount,
      createdAt: plan.createdAt.toISOString()
    });
  }

  return Array.from(templates.values()).slice(0, 4);
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

  const routineDays = activePlan?.days ?? [];
  const cycleDays = routineDays.length > 0 ? [...routineDays, ...routineDays] : [];

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const isoDate = toDateString(date);
    const isToday = isoDate === toDateString(base);
    const isSunday = date.getUTCDay() === 0;
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
      dateLabel: formatDate(date, "es-CR", { day: "2-digit", month: "2-digit" }),
      weekdayLabel: formatDate(date, "es-CR", { weekday: "short" }).replace(".", "").toUpperCase(),
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
    planName: isFreeWorkoutPlanName(session.plan.name)
      ? FREE_WORKOUT_PLAN_LABEL
      : session.plan.name,
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

  const sessionDate = today();

  const { session, created } = await prisma.$transaction(async (tx) => {
    const existing = await tx.workoutSession.findUnique({
      where: {
        userId_dayId_sessionDate: {
          userId,
          dayId,
          sessionDate
        }
      }
    });

    if (existing) {
      return {
        session: existing,
        created: false
      };
    }

    const session = await tx.workoutSession.create({
      data: {
        userId,
        planId: day.planId,
        dayId,
        sessionDate,
        status: WorkoutSessionStatus.planned
      }
    });

    return {
      session,
      created: true
    };
  });

  if (created) {
    await createAlert({
      userId,
      type: "info",
      title: "Sesion creada",
      body: `Tu sesion para ${day.name} ya esta lista para registrar progreso.`
    });
  }

  return session.id;
}

export async function startSuggestedWorkout(userId: string) {
  const openSession = await getOpenSession(userId);

  if (openSession) {
    return openSession.id;
  }

  const suggestion = await getSuggestedWorkout(userId);

  if (!suggestion) {
    throw new Error("No encontramos una rutina activa para sugerirte un entrenamiento.");
  }

  return createSession(userId, suggestion.dayId);
}

export async function createFreeWorkoutSession(
  userId: string,
  workoutName: string,
  exercises: FreeWorkoutInput[]
) {
  const normalizedName = workoutName.trim() || `Entrenamiento libre ${toDateString(today())}`;
  const normalizedExercises = exercises
    .filter((exercise) => exercise.name.trim())
    .map((exercise) => ({
      name: exercise.name.trim(),
      groupName: exercise.groupName?.trim() || "Libre",
      variant: exercise.variant?.trim() || null,
      plannedSets:
        typeof exercise.plannedSets === "number" && exercise.plannedSets > 0
          ? exercise.plannedSets
          : null,
      plannedReps: exercise.plannedReps?.trim() || null,
      notes: exercise.notes?.trim() || null
    }));

  if (normalizedExercises.length === 0) {
    throw new Error("Debes agregar al menos un ejercicio para arrancar el entrenamiento libre.");
  }

  const sessionId = await prisma.$transaction(async (tx) => {
    const plan = await tx.routinePlan.create({
      data: {
        userId,
        name: buildFreeWorkoutPlanName(normalizedName),
        activeFrom: today(),
        status: RoutinePlanStatus.archived,
        days: {
          create: {
            name: normalizedName,
            dayOrder: 1,
            blocks: {
              create: {
                name: "Bloque libre",
                blockOrder: 1,
                exercises: {
                  create: normalizedExercises
                }
              }
            }
          }
        }
      },
      include: {
        days: true
      }
    });

    const dayId = plan.days[0]?.id;

    if (!dayId) {
      throw new Error("No pudimos preparar el entrenamiento libre.");
    }

    const session = await tx.workoutSession.create({
      data: {
        userId,
        planId: plan.id,
        dayId,
        sessionDate: today(),
        status: WorkoutSessionStatus.planned
      }
    });

    return session.id;
  });

  await createAlert({
    userId,
    type: "info",
    title: "Entrenamiento libre listo",
    body: `Guardamos "${normalizedName}" para repetirlo y ya puedes empezar la sesion.`
  });

  return sessionId;
}

export async function repeatFreeWorkoutTemplate(userId: string, templateDayId: string) {
  const templateDay = await prisma.routineDay.findFirst({
    where: {
      id: templateDayId,
      plan: {
        userId,
        name: {
          startsWith: FREE_WORKOUT_PLAN_PREFIX
        }
      }
    },
    include: {
      plan: true,
      blocks: {
        include: {
          exercises: true
        }
      }
    }
  });

  if (!templateDay) {
    throw new Error("No encontramos la plantilla libre que quieres repetir.");
  }

  const exercises = templateDay.blocks
    .slice()
    .sort((left, right) => left.blockOrder - right.blockOrder)
    .flatMap((block) =>
      block.exercises.map((exercise) => ({
        name: exercise.name,
        groupName: exercise.groupName,
        variant: exercise.variant,
        plannedSets: exercise.plannedSets,
        plannedReps: exercise.plannedReps,
        notes: exercise.notes
      }))
    );

  return createFreeWorkoutSession(userId, getFreeWorkoutDisplayName(templateDay.plan.name), exercises);
}

export async function saveSession(userId: string, sessionId: string, formData: FormData) {
  const detail = await getSessionDetail(userId, sessionId);

  if (!detail) {
    throw new Error("La sesion no existe o no pertenece al usuario.");
  }

  await prisma.$transaction(async (tx) => {
    for (const block of detail.blocks) {
      for (const exercise of block.exercises) {
        const status = parseExerciseStatus(formData.get(`status-${exercise.id}`) ?? "pending");
        const reps = String(formData.get(`reps-${exercise.id}`) ?? "").trim();
        const weight = String(formData.get(`weight-${exercise.id}`) ?? "").trim();
        const note = String(formData.get(`note-${exercise.id}`) ?? "").trim();
        const parsedSets = parseOptionalNonNegativeInteger(
          formData.get(`sets-${exercise.id}`),
          `Las series completadas de ${exercise.name}`
        );

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
    const status = parseSessionStatus(formData.get("sessionStatus") ?? "in_progress");

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

  const sessionStatus = parseSessionStatus(formData.get("sessionStatus") ?? "in_progress");

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

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "asc"
    },
    include: {
      _count: {
        select: {
          sessions: true,
          routinePlans: true
        }
      }
    }
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    sessionCount: user._count.sessions,
    planCount: user._count.routinePlans
  }));
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

async function createStructuredPlan(
  userId: string,
  planName: string,
  groupedDays: Array<{
    name: string;
    dayOrder: number;
    blocks: Array<{
      name: string;
      blockOrder: number;
      exercises: ManualRoutineExerciseInput[];
    }>;
  }>
) {
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
        name: planName,
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
  });
}

async function archivePlanById(userId: string, planId: string) {
  const plan = await prisma.routinePlan.findFirst({
    where: {
      id: planId,
      userId
    }
  });

  if (!plan) {
    throw new Error("No encontramos la rutina que quieres archivar.");
  }

  if (plan.status === RoutinePlanStatus.archived) {
    return plan;
  }

  return prisma.routinePlan.update({
    where: {
      id: plan.id
    },
    data: {
      status: RoutinePlanStatus.archived
    }
  });
}

export async function createManualPlan(
  userId: string,
  planName: string,
  days: ManualRoutineDayInput[]
) {
  const normalizedName = planName.trim() || `Plan ${toDateString(today())}`;

  const groupedDays = days
    .filter((day) => day.name.trim())
    .map((day, dayIndex) => ({
      name: day.name.trim(),
      dayOrder: day.dayOrder || dayIndex + 1,
      blocks: day.blocks
        .filter((block) => block.name.trim())
        .map((block, blockIndex) => ({
          name: block.name.trim(),
          blockOrder: block.blockOrder || blockIndex + 1,
          exercises: block.exercises
            .filter((exercise) => exercise.name.trim())
            .map((exercise) => ({
              name: exercise.name.trim(),
              groupName: exercise.groupName.trim() || block.name.trim(),
              variant: exercise.variant?.trim() || null,
              plannedSets:
                typeof exercise.plannedSets === "number" && exercise.plannedSets > 0
                  ? exercise.plannedSets
                  : null,
              plannedReps: exercise.plannedReps?.trim() || null,
              notes: exercise.notes?.trim() || null
            }))
        }))
        .filter((block) => block.exercises.length > 0)
    }))
    .filter((day) => day.blocks.length > 0);

  if (groupedDays.length === 0) {
    throw new Error("Debes crear al menos un dia con un bloque y un ejercicio.");
  }

  await createStructuredPlan(userId, normalizedName, groupedDays);

  await createAlert({
    userId,
    type: "success",
    title: "Rutina creada",
    body: `El plan "${normalizedName}" ya esta activo y listo para entrenar.`
  });
}

export async function updateRoutinePlan(
  userId: string,
  sourcePlanId: string,
  planName: string,
  days: ManualRoutineDayInput[]
) {
  const sourcePlan = await prisma.routinePlan.findFirst({
    where: {
      id: sourcePlanId,
      userId
    }
  });

  if (!sourcePlan) {
    throw new Error("No encontramos la rutina que quieres modificar.");
  }

  await createManualPlan(userId, planName, days);

  await createAlert({
    userId,
    type: "info",
    title: "Rutina versionada",
    body: `Guardamos una nueva version basada en "${sourcePlan.name}". La anterior queda archivada para preservar tu historial.`
  });
}

export async function archiveRoutinePlan(userId: string, planId: string) {
  const plan = await archivePlanById(userId, planId);

  await createAlert({
    userId,
    type: "warning",
    title: "Rutina archivada",
    body: `La rutina "${plan.name}" se movio a archivadas.`
  });
}

export async function activateRoutinePlan(userId: string, planId: string) {
  const plan = await prisma.routinePlan.findFirst({
    where: {
      id: planId,
      userId
    }
  });

  if (!plan) {
    throw new Error("No encontramos la rutina que quieres activar.");
  }

  if (plan.status === RoutinePlanStatus.active) {
    return;
  }

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

    await tx.routinePlan.update({
      where: {
        id: plan.id
      },
      data: {
        status: RoutinePlanStatus.active,
        activeFrom: today()
      }
    });
  });

  await createAlert({
    userId,
    type: "success",
    title: "Rutina reactivada",
    body: `La rutina "${plan.name}" vuelve a estar activa.`
  });
}

export async function importPlanFromCsv(userId: string, fileName: string, csvText: string) {
  const importItem = await prisma.planImport.create({
    data: {
      userId,
      fileName,
      status: PlanImportStatus.processing
    }
  });

  try {
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

    await createStructuredPlan(userId, `Plan ${toDateString(today())}`, groupedDays);

    await prisma.planImport.update({
      where: {
        id: importItem.id
      },
      data: {
        status: PlanImportStatus.success,
        errorSummary: null
      }
    });

    await createAlert({
      userId,
      type: "success",
      title: "Rutina actualizada",
      body: `Se activo un nuevo plan con ${parsed.rows.length} ejercicios importados.`
    });

    return { ok: true as const };
  } catch (error) {
    const summary =
      error instanceof Error
        ? error.message.slice(0, 1200)
        : "La importacion fallo por un error inesperado.";

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
      title: "Importacion fallida",
      body: "No pudimos completar la importacion. Revisa el detalle e intenta de nuevo."
    });

    throw error;
  }
}
