import Link from "next/link"
import { notFound } from "next/navigation"

import { saveSessionAsTemplateAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { SetupCallout } from "@/components/setup-callout"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requireUser } from "@/lib/auth"
import { getSessionDetail, getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"
import { cn } from "@/lib/utils"

type SaveAsTemplatePageProps = {
  params: Promise<{ id: string }>
}

export default async function SaveAsTemplatePage({ params }: SaveAsTemplatePageProps) {
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

  const exercises = session.exercises.map((exercise) => ({
    name: exercise.customName || exercise.libraryExercise?.name || "Ejercicio",
    group: exercise.libraryExercise?.groupName || exercise.groupName,
    plannedSets: exercise.plannedSets || exercise.actualSets,
    reps: exercise.reps || exercise.plannedReps,
    weight: exercise.weight
  }))

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6">
        <p className="eyebrow">Construccion progresiva</p>
        <h2 className="page-heading">Guardar como rutina</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Usa lo que hiciste hoy como base para una rutina reutilizable.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Nueva rutina desde sesion</CardTitle>
          <CardDescription className="text-base">
            Ponle nombre y quedara guardada para entrenar de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSessionAsTemplateAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="templateName" className="text-xs font-medium text-muted-foreground">
                  Nombre de la rutina
                </label>
                <Input
                  id="templateName"
                  name="templateName"
                  placeholder={`Rutina ${session.date}`}
                  defaultValue={`Sesion ${session.date}`}
                  className="h-11 rounded-2xl"
                />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Guardar rutina
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card mt-4">
        <CardHeader>
          <p className="eyebrow">Ejercicios que se guardaran</p>
          <CardTitle>{session.exercises.length} ejercicio{session.exercises.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/70 bg-background/70 p-3"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{exercise.name}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{exercise.group}</span>
                    {exercise.plannedSets ? <span>{exercise.plannedSets} sets</span> : null}
                    {exercise.reps ? <span>{exercise.reps} reps</span> : null}
                    {exercise.weight ? <span>{exercise.weight}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-2">
        <Link
          href="/historial"
          className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
        >
          ← Volver al historial
        </Link>
      </div>
    </AppShell>
  )
}
