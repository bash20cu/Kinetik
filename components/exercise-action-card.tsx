"use client"

import { Check, Dumbbell, Flame, Repeat2 } from "lucide-react"
import { useMemo, useState } from "react"

import { RepsField } from "@/components/reps-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ExerciseActionCardProps = {
  exercise: {
    id: string
    name: string
    variant: string | null
    plannedSets: number | null
    plannedReps: string | null
    notes: string | null
    log: {
      setsCompleted: number | null
      reps: string | null
      weight: string | null
      status: "pending" | "in_progress" | "completed" | "skipped"
      note: string | null
    } | null
  }
}

function triggerRest(seconds = 90) {
  window.dispatchEvent(new CustomEvent("kinetik:start-rest", { detail: { seconds } }))
}

export function ExerciseActionCard({ exercise }: ExerciseActionCardProps) {
  const [status, setStatus] = useState(exercise.log?.status ?? "pending")
  const [setsCompleted, setSetsCompleted] = useState(exercise.log?.setsCompleted ?? 0)
  const targetSets = exercise.plannedSets ?? 0

  const completionTone = useMemo(() => {
    if (status === "completed") return "success"
    if (status === "in_progress") return "warning"
    if (status === "skipped") return "error"
    return "outline"
  }, [status])

  function handleSeriesDone() {
    const nextSets = setsCompleted + 1
    setSetsCompleted(nextSets)
    setStatus(targetSets > 0 && nextSets >= targetSets ? "completed" : "in_progress")
    triggerRest()
  }

  return (
    <div className="rounded-[1.7rem] border border-border/70 bg-background/60 p-4">
      <input type="hidden" name={`sets-${exercise.id}`} value={setsCompleted} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl uppercase">{exercise.name}</h3>
            <Badge variant={completionTone}>{status}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {exercise.variant ? <Badge variant="secondary">{exercise.variant}</Badge> : null}
            {exercise.plannedSets ? <Badge variant="info">{exercise.plannedSets} sets</Badge> : null}
            {exercise.plannedReps ? <Badge variant="warning">{exercise.plannedReps} reps</Badge> : null}
          </div>
          {exercise.notes ? (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{exercise.notes}</p>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:w-[300px]">
          <Button type="button" className="rounded-2xl" onClick={handleSeriesDone}>
            <Check className="size-4" />
            Serie hecha
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => {
              setStatus("completed")
              triggerRest()
            }}
          >
            <Flame className="size-4" />
            Completar
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_220px]">
        <div className="space-y-3">
          <div className="rounded-[1.35rem] border border-border/70 bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sets
            </p>
            <p className="mt-2 font-display text-5xl leading-none">{setsCompleted}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Objetivo: {exercise.plannedSets ?? "Libre"}
            </p>
          </div>

          <div className="grid gap-2">
            <label htmlFor={`status-${exercise.id}`} className="text-sm font-semibold">
              Estado
            </label>
            <select
              id={`status-${exercise.id}`}
              name={`status-${exercise.id}`}
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="status-select"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold" htmlFor={`reps-${exercise.id}`}>
              Contador de repeticiones
            </label>
            <RepsField
              exerciseId={exercise.id}
              defaultValue={exercise.log?.reps ?? ""}
              plannedValue={exercise.plannedReps}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor={`note-${exercise.id}`} className="text-sm font-semibold">
              Nota rapida
            </label>
            <Textarea
              id={`note-${exercise.id}`}
              name={`note-${exercise.id}`}
              defaultValue={exercise.log?.note ?? ""}
              placeholder="Tecnica, sensaciones, ajuste de carga..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor={`weight-${exercise.id}`} className="text-sm font-semibold">
              Peso
            </label>
            <div className="relative">
              <Dumbbell className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`weight-${exercise.id}`}
                name={`weight-${exercise.id}`}
                defaultValue={exercise.log?.weight ?? ""}
                placeholder="20 kg / 2 discos"
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Repeat2 className="size-4 text-primary" />
              Accion rapida
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Marca una serie y el descanso arranca automaticamente con 90 segundos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
