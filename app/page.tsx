import Link from "next/link"

import { AppShell } from "@/components/app-shell"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TodayWorkoutHero } from "@/components/today-workout-hero"
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
          <p className="eyebrow">Dashboard</p>
          <h2 className="page-heading">Hoy</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Centro operativo semanal para decidir que entrenas hoy y retomar tu flujo al instante.
          </p>
        </div>
      </div>

      <div className="panel-grid">
        <TodayWorkoutHero
          today={dashboard.todaysAssignment}
          latestSession={dashboard.latestSession}
        />

        <WeeklyCalendarCard week={dashboard.week} />

        <div className="panel-grid lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-card">
          <CardHeader>
            <p className="eyebrow">Plan activo</p>
            <CardTitle>{activePlan ? activePlan.name : "Sin rutina cargada"}</CardTitle>
            <CardDescription className="text-base">
              {activePlan
                ? `Activo desde ${activePlan.activeFrom}. Mantiene tu ciclo semanal disponible en el calendario.`
                : "Descarga la plantilla CSV, completala y subela para activar el plan."}
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

        <Card className="glass-card">
          <CardHeader>
            <p className="eyebrow">Reciente</p>
            <CardTitle>{dashboard.latestSession?.dayName ?? "Sin sesiones"}</CardTitle>
            <CardDescription className="text-base">
              {dashboard.latestSession
                ? `Ultima actividad registrada el ${dashboard.latestSession.date}.`
                : "Aun no has guardado sesiones. Usa el calendario o el bloque de hoy para arrancar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Badge variant={dashboard.latestSession ? "info" : "outline"}>
                  {dashboard.latestSession?.status ?? "planned"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {dashboard.latestSession
                  ? `${dashboard.latestSession.planName} · ${dashboard.latestSession.dayName}`
                  : "Tu siguiente entreno aparecera aqui cuando abras una sesion."}
              </p>
            </div>

            {dashboard.latestSession ? (
              <Link
                href={`/sesion/${dashboard.latestSession.id}`}
                className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
              >
                Retomar ultima sesion
              </Link>
            ) : null}
          </CardContent>
        </Card>
        </div>
      </div>
    </AppShell>
  )
}
