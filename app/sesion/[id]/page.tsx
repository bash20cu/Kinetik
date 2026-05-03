import { notFound } from "next/navigation"

import { saveSessionAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { SessionWorkoutFlow } from "@/components/session-workout-flow"
import { SetupCallout } from "@/components/setup-callout"
import { requireUser } from "@/lib/auth"
import { getSessionDetail, getUnreadAlerts } from "@/lib/data"
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
  const [session, alerts] = await Promise.all([
    getSessionDetail(user.id, id),
    getUnreadAlerts(user.id)
  ])

  if (!session) {
    notFound()
  }

  const saveAction = saveSessionAction.bind(null, session.id)

  return (
    <AppShell user={user} alerts={alerts}>
      <SessionWorkoutFlow session={session} action={saveAction} />
    </AppShell>
  )
}
