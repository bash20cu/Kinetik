import type { BadgeProps } from "@/components/ui/badge"
import type { ExerciseLog, SessionDetail, WeeklyCalendarDay, WorkoutSession } from "@/lib/types"

type SessionStatus = WorkoutSession["status"] | SessionDetail["status"]
type ExerciseStatus = ExerciseLog["status"]
type CalendarStatus = WeeklyCalendarDay["status"]

export function getWorkoutSessionBadgeVariant(status: SessionStatus): BadgeProps["variant"] {
  if (status === "completed") return "success"
  if (status === "in_progress") return "warning"
  return "outline"
}

export function getExerciseStatusBadgeVariant(status: ExerciseStatus): BadgeProps["variant"] {
  if (status === "completed") return "success"
  if (status === "in_progress") return "warning"
  if (status === "skipped") return "error"
  return "outline"
}

export function getCalendarStatusBadgeVariant(status: CalendarStatus): BadgeProps["variant"] {
  if (status === "completed") return "success"
  if (status === "in_progress") return "warning"
  if (status === "today") return "info"
  if (status === "planned") return "outline"
  return "secondary"
}
