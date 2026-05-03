import { notFound } from "next/navigation"

import { saveSessionAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { SessionWorkoutFlow } from "@/components/session-workout-flow"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { requireUser } from "@/lib/auth"
import { getSessionDetail, getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"

type SessionPageProps = {
  params: Promise<{ id: string }>
}

function sessionVariant(status: string) {
  if (status === "completed") return "success"
  if (status === "in_progress") return "warning"
  if (status === "skipped") return "error"
  return "outline"
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
      <div className="mb-6">
        <p className="eyebrow">Sesion</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="page-heading">{session.dayName}</h2>
            <p className="mt-2 text-muted-foreground">
              {session.date} · {session.planName}
            </p>
          </div>
          <Badge variant={sessionVariant(session.status)}>{session.status}</Badge>
        </div>
      </div>

      <SessionWorkoutFlow session={session} action={saveAction} />
    </AppShell>
  )
}
