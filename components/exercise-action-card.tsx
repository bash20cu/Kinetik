"use client"

import { Check, Clock3, Flag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getExerciseStatusBadgeVariant } from "@/lib/status-ui"
import { cn } from "@/lib/utils"

type ExerciseActionCardProps = {
  blockName: string
  orderLabel: string
  exercise: {
    id: string
    name: string
    variant: string | null
    plannedSets: number | null
    plannedReps: string | null
    notes: string | null
  }
  status: "pending" | "in_progress" | "completed" | "skipped"
  setsCompleted: number
  setElapsedSeconds: number
  onSeriesDone: () => void
  onCompleteExercise: () => void
  className?: string
}

export function ExerciseActionCard({
  blockName,
  orderLabel,
  exercise,
  status,
  setsCompleted,
  setElapsedSeconds,
  onSeriesDone,
  onCompleteExercise,
  className
}: ExerciseActionCardProps) {
  const targetSets = exercise.plannedSets ?? 0
  const setsLeft = targetSets > 0 ? Math.max(targetSets - setsCompleted, 0) : null

  function formatTimer(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-border/70 bg-card/95 p-3.5 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur md:rounded-[2rem] md:p-5",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          <Badge variant="outline">{orderLabel}</Badge>
          <Badge variant="secondary">{blockName}</Badge>
          <Badge variant={getExerciseStatusBadgeVariant(status)}>{status.replace("_", " ")}</Badge>
        </div>
        <div>
          <h3 className="text-[1.45rem] uppercase leading-none md:text-[2rem]">{exercise.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
            {exercise.variant ? <Badge variant="secondary">{exercise.variant}</Badge> : null}
            {exercise.plannedSets ? <Badge variant="info">{exercise.plannedSets} sets</Badge> : null}
            {exercise.plannedReps ? <Badge variant="warning">{exercise.plannedReps} reps</Badge> : null}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-5 md:space-y-4 md:pt-6">
        <div className="overflow-hidden rounded-[1.15rem] border border-border/70 bg-background/70 md:rounded-[1.35rem]">
          <div className="grid grid-cols-2 divide-x divide-border/70">
            <div className="px-3 py-2.5 md:px-3.5 md:py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sets</p>
              <p className="mt-1 text-[1.55rem] font-semibold leading-none md:text-[1.85rem]">
                {setsCompleted}
                <span className="text-base text-muted-foreground">/{exercise.plannedSets ?? "-"}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {setsLeft === null ? "Libre" : `${setsLeft} restantes`}
              </p>
            </div>

            <div className="px-3 py-2.5 md:px-3.5 md:py-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Clock3 className="size-3.5" />
                Tiempo
              </div>
              <p className="mt-1 text-[1.55rem] font-semibold leading-none md:text-[1.85rem]">{formatTimer(setElapsedSeconds)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {status === "completed" ? "Cerrado" : "Corriendo"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_220px] md:gap-3">
          <Button type="button" size="lg" className="min-h-11 rounded-[1.15rem] text-base md:min-h-12 md:rounded-[1.35rem]" onClick={onSeriesDone}>
            <Check className="size-5" />
            Serie hecha
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-[1.15rem] text-base md:min-h-12 md:rounded-[1.35rem]"
            onClick={onCompleteExercise}
          >
            <Flag className="size-5" />
            Completar ejercicio
          </Button>
        </div>
      </div>
    </div>
  )
}
