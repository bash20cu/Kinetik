import Link from "next/link"

import { createSessionAction } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { WeeklyCalendarDay, WorkoutSession } from "@/lib/types"
import { cn } from "@/lib/utils"

type TodayWorkoutHeroProps = {
  today: WeeklyCalendarDay | null
  latestSession: WorkoutSession | null
}

export function TodayWorkoutHero({ today, latestSession }: TodayWorkoutHeroProps) {
  const activeSessionId = today?.sessionId ?? latestSession?.id ?? null

  return (
    <Card className="hero-panel">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={today?.isToday ? "info" : "outline"}>{today?.weekdayLabel ?? "HOY"}</Badge>
          {today?.assignedDayName ? (
            <Badge variant={today.sessionId ? "warning" : "secondary"}>{today.assignedDayName}</Badge>
          ) : (
            <Badge variant="secondary">Recovery</Badge>
          )}
        </div>
        <CardTitle className="max-w-[11ch] text-5xl leading-none">
          {today?.assignedDayName ? `Entrena ${today.assignedDayName}` : "Dia de recuperacion"}
        </CardTitle>
        <CardDescription className="max-w-2xl text-base">
          {today?.assignedDayName
            ? "Abre tu sesion, marca cada serie, deja que el descanso corra y registra repeticiones sin salir del flujo."
            : "Usa este dia para caminar, movilizar y revisar tu progreso semanal."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hoy
            </p>
            <p className="mt-2 font-display text-4xl">{today?.dateLabel ?? "--"}</p>
          </div>
          <div className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Estado
            </p>
            <p className="mt-2 font-display text-3xl">
              {today ? today.status.replace("_", " ") : "planned"}
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ultima sesion
            </p>
            <p className="mt-2 font-display text-3xl">{latestSession?.dayName ?? "Ninguna"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {today?.sessionId ? (
            <Link
              href={`/sesion/${today.sessionId}`}
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
            >
              Continuar sesion
            </Link>
          ) : today?.assignedDayId ? (
            <form action={createSessionAction}>
              <input type="hidden" name="dayId" value={today.assignedDayId} />
              <Button type="submit" size="lg" className="rounded-full px-8">
                Iniciar entreno
              </Button>
            </form>
          ) : null}

          {activeSessionId ? (
            <Link
              href={`/sesion/${activeSessionId}`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8")}
            >
              Ver ultima actividad
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
