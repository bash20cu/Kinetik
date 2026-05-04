export function getWorkoutSessionBadgeVariant(status: string) {
  if (status === "completed") return "success"
  if (status === "in_progress") return "info"
  if (status === "discarded") return "outline"
  return "warning"
}

export function getExerciseStatusBadgeVariant(status: string) {
  if (status === "completed") return "success"
  if (status === "in_progress") return "info"
  if (status === "skipped") return "outline"
  return "warning"
}
