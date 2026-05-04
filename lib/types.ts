export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type ManagedUser = {
  id: string;
  email: string;
  createdAt: string;
  sessionCount: number;
  templateCount: number;
};

export type InAppAlert = {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type ExerciseLibrary = {
  id: string;
  name: string;
  groupName: string;
  defaultSets: number | null;
  defaultReps: string | null;
  defaultRest: number | null;
  notes: string | null;
  variant: string | null;
};

export type SessionLog = {
  id: string;
  userId: string;
  date: string;
  durationSeconds: number | null;
  status: "planned" | "in_progress" | "completed" | "discarded";
  generalNotes: string | null;
  createdAt: string;
};

export type SessionExercise = {
  id: string;
  sessionId: string;
  exerciseId: string | null;
  customName: string | null;
  groupName: string;
  orderIndex: number;
  plannedSets: number | null;
  plannedReps: string | null;
  actualSets: number | null;
  reps: string | null;
  weight: string | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  note: string | null;
};

export type SessionDetail = SessionLog & {
  exercises: Array<{
    id: string;
    exerciseId: string | null;
    customName: string | null;
    groupName: string;
    orderIndex: number;
    plannedSets: number | null;
    plannedReps: string | null;
    actualSets: number | null;
    reps: string | null;
    weight: string | null;
    status: "pending" | "in_progress" | "completed" | "skipped";
    note: string | null;
    libraryExercise: {
      id: string;
      name: string;
      groupName: string;
      variant: string | null;
    } | null;
  }>;
};

export type RoutineTemplate = {
  id: string;
  userId: string;
  name: string;
  status: "active" | "archived";
  isFavorite: boolean;
  createdAt: string;
  exercises: RoutineTemplateExercise[];
};

export type RoutineTemplateSummary = {
  id: string;
  userId: string;
  name: string;
  status: "active" | "archived";
  isFavorite: boolean;
  createdAt: string;
  exerciseCount: number;
};

export type RoutineTemplateExercise = {
  id: string;
  templateId: string;
  exerciseId: string | null;
  customName: string | null;
  groupName: string;
  orderIndex: number;
  plannedSets: number | null;
  plannedReps: string | null;
  notes: string | null;
  variant: string | null;
  libraryExercise: {
    id: string;
    name: string;
    groupName: string;
    variant: string | null;
  } | null;
};

export type PlanImport = {
  id: string;
  userId: string;
  fileName: string;
  status: "processing" | "success" | "failed";
  errorSummary: string | null;
  createdAt: string;
};

export type WeeklyCalendarDay = {
  date: string;
  dateLabel: string;
  weekdayLabel: string;
  isToday: boolean;
  sessionId: string | null;
  sessionStatus: SessionLog["status"] | null;
  dayName: string | null;
};

export type HomeDashboardData = {
  user: User;
  alerts: InAppAlert[];
  recentTemplates: RoutineTemplateSummary[];
  week: WeeklyCalendarDay[];
  latestSession: SessionLog | null;
  openSession: SessionLog | null;
};
