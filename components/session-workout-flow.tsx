"use client"

import { useEffect, useMemo, useState } from "react"

import { ExerciseActionCard } from "@/components/exercise-action-card"
import { RestTimerCard } from "@/components/rest-timer-card"
import { SessionProgressBar } from "@/components/session-progress-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SessionDetail } from "@/lib/types"

type SessionWorkoutFlowProps = {
  session: SessionDetail
  action: (formData: FormData) => void | Promise<void>
}

type FlattenedExercise = {
  blockId: string
  blockName: string
  orderLabel: string
  exercise: SessionDetail["blocks"][number]["exercises"][number]
}

function sessionVariant(status: string) {
  if (status === "completed") return "success"
  if (status === "in_progress") return "warning"
  if (status === "skipped") return "error"
  return "outline"
}

export function SessionWorkoutFlow({ session, action }: SessionWorkoutFlowProps) {
  const items = useMemo<FlattenedExercise[]>(() => {
    let counter = 1
    return session.blocks.flatMap((block) =>
      block.exercises.map((exercise) => ({
        blockId: block.id,
        blockName: block.name,
        orderLabel: `Paso ${counter++}`,
        exercise
      }))
    )
  }, [session.blocks])

  const initialStatuses = useMemo(
    () => items.map((item) => item.exercise.log?.status ?? "pending"),
    [items]
  )
  const [statuses, setStatuses] = useState(initialStatuses)
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstPending = initialStatuses.findIndex((status) => status !== "completed")
    return firstPending === -1 ? 0 : firstPending
  })
  const [restDuration, setRestDuration] = useState(90)
  const [restRemaining, setRestRemaining] = useState(90)
  const [restRunning, setRestRunning] = useState(false)
  const [restVisible, setRestVisible] = useState(false)
  const [pendingUnlockIndex, setPendingUnlockIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!restRunning) return

    const interval = window.setInterval(() => {
      setRestRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval)
          setRestRunning(false)
          if (pendingUnlockIndex !== null) {
            setCurrentIndex(pendingUnlockIndex)
            setPendingUnlockIndex(null)
          }
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [restRunning, pendingUnlockIndex])

  const completedExercises = statuses.filter((status) => status === "completed").length

  function startRest(seconds = 90, nextIndex?: number) {
    setRestDuration(seconds)
    setRestRemaining(seconds)
    setRestRunning(true)
    setRestVisible(true)
    setPendingUnlockIndex(nextIndex ?? null)
  }

  function handleSeriesDone(index: number, payload: { completedExercise: boolean }) {
    setStatuses((current) => {
      const next = [...current]
      next[index] = payload.completedExercise ? "completed" : "in_progress"
      return next
    })

    const nextIndex = payload.completedExercise ? Math.min(index + 1, items.length - 1) : undefined
    startRest(90, payload.completedExercise && index < items.length - 1 ? nextIndex : undefined)
  }

  function handleCompleteExercise(index: number) {
    setStatuses((current) => {
      const next = [...current]
      next[index] = "completed"
      return next
    })

    startRest(90, index < items.length - 1 ? index + 1 : undefined)
  }

  return (
    <form action={action} className="panel-grid">
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
            <SessionProgressBar total={items.length} completed={completedExercises} />
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
                <textarea
                  id="generalNotes"
                  name="generalNotes"
                  defaultValue={session.generalNotes ?? ""}
                  placeholder="Como te sentiste, ajustes, molestias o mejoras..."
                  className="flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <RestTimerCard
          duration={restDuration}
          remaining={restRemaining}
          running={restRunning}
          visible={restVisible}
          onToggle={() => setRestRunning((current) => !current)}
          onReset={() => {
            setRestRemaining(restDuration)
            setRestRunning(false)
          }}
          onPreset={(seconds) => startRest(seconds, pendingUnlockIndex ?? undefined)}
        />
      </div>

      <Card className="glass-card">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Secuencia de ejercicios</CardTitle>
            <Badge variant="outline">
              {Math.min(currentIndex + 1, items.length)} / {items.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6">
          {items.map((item, index) => {
            const flowState =
              index < currentIndex
                ? "completed"
                : index === currentIndex
                  ? "current"
                  : "locked"

            return (
              <ExerciseActionCard
                key={item.exercise.id}
                blockName={item.blockName}
                orderLabel={item.orderLabel}
                exercise={{
                  ...item.exercise,
                  log: item.exercise.log
                    ? {
                        ...item.exercise.log,
                        status: statuses[index] as typeof item.exercise.log.status
                      }
                    : {
                        id: "",
                        sessionId: session.id,
                        exerciseId: item.exercise.id,
                        setsCompleted: null,
                        reps: null,
                        weight: null,
                        status: statuses[index] as "pending" | "in_progress" | "completed" | "skipped",
                        note: null
                      }
                }}
                flowState={flowState}
                onSeriesDone={(payload) => handleSeriesDone(index, payload)}
                onCompleteExercise={() => handleCompleteExercise(index)}
              />
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Guardar sesion
        </button>
      </div>
    </form>
  )
}
