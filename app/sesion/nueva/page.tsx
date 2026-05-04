import { SetupCallout } from "@/components/setup-callout"
import { requireUser } from "@/lib/auth"
import { getExerciseLibrary, getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"
import { SessionCreationFlow } from "./client"

export default async function NewSessionPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    )
  }

  const user = await requireUser()
  const [exercises, alerts] = await Promise.all([
    getExerciseLibrary(),
    getUnreadAlerts(user.id)
  ])

  const exerciseGroups: Record<string, { name: string; groupName: string; id?: string; defaultSets: number; defaultReps: string }[]> = {}

  for (const exercise of exercises) {
    if (!exerciseGroups[exercise.groupName]) {
      exerciseGroups[exercise.groupName] = []
    }
    exerciseGroups[exercise.groupName].push({
      name: exercise.name,
      groupName: exercise.groupName,
      id: exercise.id,
      defaultSets: exercise.defaultSets ?? 3,
      defaultReps: exercise.defaultReps ?? "10"
    })
  }

  return (
    <SessionCreationFlow
      user={{ id: user.id, email: user.email, createdAt: user.createdAt }}
      alerts={alerts}
      exerciseGroups={exerciseGroups}
    />
  )
}
