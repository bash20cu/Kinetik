import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WeeklyCalendarDay } from "@/lib/types"
import { cn } from "@/lib/utils"

type WeeklyCalendarCardProps = {
  week: WeeklyCalendarDay[]
}

function getDayStatusVariant(status: WeeklyCalendarDay["sessionStatus"]) {
  if (!status) return "outline"
  if (status === "completed") return "success"
  if (status === "in_progress") return "info"
  return "warning"
}

export function WeeklyCalendarCard({ week }: WeeklyCalendarCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <p className="eyebrow">Week view</p>
        <CardTitle className="text-3xl">Semana de entrenamiento</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {week.map((day) => (
          <div
            key={day.date}
            className={cn(
              "flex min-h-[220px] flex-col rounded-[1.6rem] border border-border/70 bg-background/70 p-4",
              day.isToday && "border-primary/60 bg-primary/5 shadow-sm"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {day.weekdayLabel}
                </p>
                <p className="mt-2 font-display text-4xl leading-none">{day.dateLabel}</p>
              </div>
              <Badge variant={getDayStatusVariant(day.sessionStatus)}>
                {day.sessionStatus || "libre"}
              </Badge>
            </div>

            <div className="mt-4 flex-1">
              <p className="text-sm font-semibold">
                {day.sessionId ? "Sesion registrada" : "Recuperacion"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {day.isToday
                  ? "Hoy toca entrenar o cerrar descanso activo."
                  : day.sessionStatus === "completed"
                    ? "Sesion completada en esta fecha."
                    : day.sessionId
                      ? "Sesion en progreso."
                      : "Dia libre para movilidad o descanso."}
              </p>
            </div>

            {day.sessionId ? (
              <Link
                href={`/sesion/${day.sessionId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 rounded-full")}
              >
                Abrir sesion
              </Link>
            ) : (
              <div className="mt-4 rounded-full border border-dashed border-border/70 px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                Sin entreno
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
