import { notFound } from "next/navigation"

import { saveSessionAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { ExerciseActionCard } from "@/components/exercise-action-card"
import { RestTimerCard } from "@/components/rest-timer-card"
import { SessionProgressBar } from "@/components/session-progress-bar"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
  const totalExercises = session.blocks.reduce((sum, block) => sum + block.exercises.length, 0)
  const completedExercises = session.blocks.reduce(
    (sum, block) =>
      sum + block.exercises.filter((exercise) => exercise.log?.status === "completed").length,
    0
  )

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

      <form action={saveAction} className="panel-grid">
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="hero-panel">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Workout flow</p>
                <CardTitle className="text-4xl">Ejecuta la sesion</CardTitle>
              </div>
              <Badge variant={sessionVariant(session.status)}>{session.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <SessionProgressBar total={totalExercises} completed={completedExercises} />
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="grid gap-2">
                <label htmlFor="sessionStatus" className="text-sm font-semibold">
                  Estado general
                </label>
                <select
                  id="sessionStatus"
                  name="sessionStatus"
                  defaultValue={session.status}
                  className="status-select"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="generalNotes" className="text-sm font-semibold">
                  Notas generales
                </label>
                <Textarea
                  id="generalNotes"
                  name="generalNotes"
                  defaultValue={session.generalNotes ?? ""}
                  placeholder="Como te sentiste, ajustes, molestias o mejoras..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <RestTimerCard />
        </div>

        {session.blocks.map((block) => (
          <Card key={block.id} className="glass-card">
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{block.name}</CardTitle>
                <Badge variant="outline">{block.exercises.length} ejercicios</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6">
              {block.exercises.map((exercise) => (
                <ExerciseActionCard key={exercise.id} exercise={exercise} />
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-6">
            Guardar sesion
          </Button>
        </div>
      </form>
    </AppShell>
  )
}
