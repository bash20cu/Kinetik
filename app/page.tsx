import Link from "next/link"

import { repeatFreeWorkoutTemplateAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { GymStartHero } from "@/components/gym-start-hero"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WeeklyCalendarCard } from "@/components/weekly-calendar-card"
import { cn } from "@/lib/utils"
import { requireUser } from "@/lib/auth"
import { getHomeDashboardData } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    )
  }

  const user = await requireUser()
  const dashboard = await getHomeDashboardData(user.id)
  const activePlan = dashboard.activePlan
  const exercisesCount =
    activePlan?.days.reduce((count, day) => {
      return count + day.blocks.reduce((sum, block) => sum + block.exercises.length, 0)
    }, 0) ?? 0

  return (
    <AppShell user={user} alerts={dashboard.alerts}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Gym first</p>
          <h2 className="page-heading">Entrenar ahora</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Llega al gimnasio, abre la app y empieza. El historial y el plan quedan para apoyar, no para bloquear.
          </p>
        </div>
      </div>

      <div className="panel-grid">
        <GymStartHero
          openSession={dashboard.openSession}
          latestSession={dashboard.latestSession}
          suggestedWorkout={dashboard.suggestedWorkout}
        />

        <div className="panel-grid lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="glass-card">
            <CardHeader>
              <p className="eyebrow">Lo que ya hiciste</p>
              <CardTitle>{dashboard.latestSession?.dayName ?? "Aun no has entrenado"}</CardTitle>
              <CardDescription className="text-base">
                {dashboard.latestSession
                  ? `Ultima actividad registrada el ${dashboard.latestSession.date}.`
                  : "Cuando cierres tu primera sesion, aparecera aqui primero para que el progreso mande sobre la planeacion."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <Badge variant={dashboard.latestSession ? "info" : "outline"}>
                    {dashboard.latestSession?.status ?? "sin sesiones"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {dashboard.latestSession
                    ? `${dashboard.latestSession.planName} · ${dashboard.latestSession.dayName}`
                    : "Empieza un entreno sugerido o libre y la app comenzara a construir tu historial real."}
                </p>
              </div>

              {dashboard.latestSession ? (
                <Link
                  href={`/sesion/${dashboard.latestSession.id}`}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
                >
                  Abrir ultima sesion
                </Link>
              ) : (
                <Link
                  href="/entrenar/libre"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
                >
                  Crear entrenamiento libre
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <p className="eyebrow">Reutilizables</p>
              <CardTitle>Entrenamientos libres guardados</CardTitle>
              <CardDescription className="text-base">
                Tus bases rapidas para repetir sin volver a construirlas desde cero.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.freeWorkoutTemplates.length > 0 ? (
                dashboard.freeWorkoutTemplates.map((template) => (
                  <form
                    key={template.planId}
                    action={repeatFreeWorkoutTemplateAction}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4"
                  >
                    <input type="hidden" name="templateDayId" value={template.dayId} />
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.exerciseCount} ejercicios reutilizables
                        </p>
                      </div>
                      <Button type="submit" variant="secondary" className="rounded-full">
                        Repetir
                      </Button>
                    </div>
                  </form>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  Aun no guardas bases libres. Crea una desde `Entrenamiento libre` y quedara lista para repetirla.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <p className="eyebrow">Plan activo</p>
            <CardTitle>{activePlan ? activePlan.name : "Sin rutina cargada"}</CardTitle>
            <CardDescription className="text-base">
              {activePlan
                ? `Activo desde ${activePlan.activeFrom}. Sigue disponible como sugerencia y consulta, no como bloqueo de entrada.`
                : "Si quieres entrenar con estructura fija, crea o importa una rutina. Si no, puedes usar entrenamientos libres."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Dias
                </p>
                <p className="mt-2 font-display text-4xl">{activePlan?.days.length ?? 0}</p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Ejercicios
                </p>
                <p className="mt-2 font-display text-4xl">{exercisesCount}</p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Alertas
                </p>
                <p className="mt-2 font-display text-4xl">{dashboard.alerts.length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/rutina"
                className={cn(buttonVariants({ variant: "secondary" }), "rounded-full")}
              >
                Ver rutina
              </Link>
              <Link
                href="/plan/importar"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
              >
                Importar CSV
              </Link>
              <Link
                href="/plan/nuevo"
                className={cn(buttonVariants(), "rounded-full")}
              >
                Crear rutina
              </Link>
            </div>
          </CardContent>
        </Card>

        <WeeklyCalendarCard week={dashboard.week} />
      </div>
    </AppShell>
  )
}
