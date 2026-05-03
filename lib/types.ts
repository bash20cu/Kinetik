export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type InAppAlert = {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type Exercise = {
  id: string;
  blockId: string;
  name: string;
  groupName: string;
  variant: string | null;
  plannedSets: number | null;
  plannedReps: string | null;
  notes: string | null;
};

export type RoutineBlock = {
  id: string;
  name: string;
  order: number;
  exercises: Exercise[];
};

export type RoutineDay = {
  id: string;
  name: string;
  order: number;
  blocks: RoutineBlock[];
};

export type RoutinePlan = {
  id: string;
  userId: string;
  name: string;
  activeFrom: string;
  status: "active" | "archived";
  days: RoutineDay[];
};

export type WorkoutSession = {
  id: string;
  userId: string;
  planId: string;
  dayId: string;
  date: string;
  status: "planned" | "in_progress" | "completed";
  generalNotes: string | null;
  dayName: string;
  planName: string;
};

export type ExerciseLog = {
  id: string;
  sessionId: string;
  exerciseId: string;
  setsCompleted: number | null;
  reps: string | null;
  weight: string | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  note: string | null;
};

export type SessionExercise = Exercise & {
  log: ExerciseLog | null;
};

export type SessionDetail = WorkoutSession & {
  blocks: Array<{
    id: string;
    name: string;
    order: number;
    exercises: SessionExercise[];
  }>;
};

export type PlanImport = {
  id: string;
  userId: string;
  fileName: string;
  status: "processing" | "success" | "failed";
  errorSummary: string | null;
  createdAt: string;
};

export type DashboardData = {
  user: User;
  alerts: InAppAlert[];
  activePlan: RoutinePlan | null;
  latestSession: WorkoutSession | null;
};

export type WeeklyCalendarDay = {
  date: string;
  dateLabel: string;
  weekdayLabel: string;
  isToday: boolean;
  assignedDayId: string | null;
  assignedDayName: string | null;
  status: "today" | "planned" | "in_progress" | "completed" | "recovery";
  sessionId: string | null;
};

export type HomeDashboardData = DashboardData & {
  week: WeeklyCalendarDay[];
  todaysAssignment: WeeklyCalendarDay | null;
};

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
