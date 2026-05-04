import Link from "next/link"
import { notFound } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { getSessionDetail, getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"
import { cn } from "@/lib/utils"

type SessionSummaryPageProps = {
  params: Promise<{ id: string }>
}

export default async function SessionSummaryPage({ params }: SessionSummaryPageProps) {
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

  const completedExercises = session.exercises.filter((ex) => ex.status === "completed").length
  const totalSets = session.exercises.reduce((sum, ex) => sum + (ex.actualSets ?? 0), 0)
  const skippedExercises = session.exercises.filter((ex) => ex.status === "skipped").length

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6">
        <p className="eyebrow">Resumen</p>
        <h2 className="page-heading">Sesion del {session.date}</h2>
        <p className="mt-2 text-muted-foreground">
          {session.exercises.length} ejercicio{session.exercises.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="metric-card text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ejercicios</p>
          <p className="mt-1 font-display text-2xl font-semibold">{completedExercises}/{session.exercises.length}</p>
        </div>
        <div className="metric-card text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sets</p>
          <p className="mt-1 font-display text-2xl font-semibold">{totalSets}</p>
        </div>
        <div className="metric-card text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado</p>
          <div className="mt-1">
            <Badge variant={session.status === "completed" ? "success" : session.status === "in_progress" ? "info" : "outline"}>
              {session.status}
            </Badge>
          </div>
        </div>
      </div>

      {session.generalNotes ? (
        <Card className="glass-card mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notas generales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{session.generalNotes}</p>
          </CardContent>
        </Card>
      ) : null}

      {skippedExercises > 0 && (
        <p className="text-xs text-muted-foreground mb-2">{skippedExercises} saltado{skippedExercises !== 1 ? "s" : ""}</p>
      )}

      <div className="space-y-2">
        {session.exercises.map((exercise) => {
          const isCompleted = exercise.status === "completed"
          const isSkipped = exercise.status === "skipped"
          const displayName = exercise.customName || exercise.libraryExercise?.name || "Ejercicio"
          const displayGroup = exercise.libraryExercise?.groupName || exercise.groupName

          return (
            <Card key={exercise.id} className={cn("glass-card", isSkipped && "opacity-60")}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{exercise.orderIndex + 1}.</span>
                      <p className={cn("font-semibold", isSkipped && "line-through")}>{displayName}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{displayGroup}</span>
                      {exercise.libraryExercise?.variant ? <span>{exercise.libraryExercise.variant}</span> : null}
                    </div>
                  </div>
                  <Badge
                    variant={
                      isCompleted ? "success" : isSkipped ? "outline" : exercise.status === "pending" ? "warning" : "info"
                    }
                  >
                    {isCompleted ? "hecho" : isSkipped ? "saltado" : exercise.status === "pending" ? "pendiente" : "en curso"}
                  </Badge>
                </div>

                {!isSkipped && (exercise.actualSets || exercise.reps || exercise.weight) ? (
                  <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl border border-border/50 bg-muted/30 p-2 text-center">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sets</p>
                      <p className="text-base font-semibold">{exercise.actualSets ?? 0}{exercise.plannedSets ? <span className="text-xs text-muted-foreground">/{exercise.plannedSets}</span> : null}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Reps</p>
                      <p className="text-base font-semibold">{exercise.reps ?? exercise.plannedReps ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Peso</p>
                      <p className="text-base font-semibold">{exercise.weight ?? "-"}</p>
                    </div>
                  </div>
                ) : null}

                {exercise.note ? (
                  <p className="mt-2 text-xs text-muted-foreground">{exercise.note}</p>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 space-y-2">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "default" }), "w-full rounded-full")}
        >
          Volver al inicio
        </Link>
        <Link
          href={`/sesion/${id}/guardar-como-rutina`}
          className={cn(buttonVariants({ variant: "secondary" }), "w-full rounded-full")}
        >
          Guardar como rutina
        </Link>
        <Link
          href="/historial"
          className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
        >
          Ver todo el historial
        </Link>
      </div>
    </AppShell>
  )
}
