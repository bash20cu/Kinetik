import { notFound } from "next/navigation"

import { addExerciseToSessionAction, saveSessionAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { SessionWorkoutFlow } from "@/components/session-workout-flow"
import { SetupCallout } from "@/components/setup-callout"
import { requireUser } from "@/lib/auth"
import { getExerciseLibrary, getSessionDetail, getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"

type SessionPageProps = {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    )
  }

  const user = await requireUser()
  const { id } = await params
  const [session, alerts, exercises] = await Promise.all([
    getSessionDetail(user.id, id),
    getUnreadAlerts(user.id),
    getExerciseLibrary()
  ])

  if (!session) {
    notFound()
  }

  const exerciseGroups: Record<string, { name: string; groupName: string; id: string; defaultSets: number; defaultReps: string }[]> = {}

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

  const saveAction = saveSessionAction.bind(null, session.id)
  const addAction = addExerciseToSessionAction.bind(null, session.id)

  return (
    <AppShell user={user} alerts={alerts}>
      <SessionWorkoutFlow session={session} action={saveAction} addAction={addAction} exerciseGroups={exerciseGroups} />
    </AppShell>
  )
}
