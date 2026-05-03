"use client"

import Link from "next/link"
import { ArrowRight, BellRing, CheckCircle2, Dumbbell, LayoutPanelTop, NotebookPen, Repeat2, Trophy, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { ExerciseActionCard } from "@/components/exercise-action-card"
import { RestTimerCard } from "@/components/rest-timer-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { WorkoutMiniDock } from "@/components/workout-mini-dock"
import { getWorkoutSessionBadgeVariant } from "@/lib/status-ui"
import type { ExerciseLog, SessionDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

type SessionPhase = "exercise" | "record" | "rest" | "complete"

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

type ExerciseState = {
  setsCompleted: number
  reps: string
  weight: string
  status: ExerciseLog["status"]
  note: string
}

type PendingRestPlan = {
  nextIndex: number | null
  completesWorkout: boolean
  message: string
  seconds?: number
}

const SET_MESSAGES = [
  "Bien. Respira y vuelve por la siguiente.",
  "Eso cuenta. Mantiene el ritmo y prepara el siguiente empuje.",
  "Buen set. El descanso arranca y seguimos en control."
]

const EXERCISE_MESSAGES = [
  "Ejercicio cerrado. Sube la siguiente tarjeta.",
  "Bloque completado. Vamos con lo que sigue.",
  "Muy bien. Cerraste este ejercicio con autoridad."
]

const REST_DONE_MESSAGES = [
  "Descanso terminado. Te toca volver a empujar.",
  "Reloj en cero. Sigue con el siguiente movimiento.",
  "Listo. El mazo avanza contigo."
]

function pickMessage(collection: string[], seed: number) {
  return collection[seed % collection.length]
}

function getInitialState(item: FlattenedExercise): ExerciseState {
  return {
    setsCompleted: item.exercise.log?.setsCompleted ?? 0,
    reps: item.exercise.log?.reps ?? item.exercise.plannedReps ?? "",
    weight: item.exercise.log?.weight ?? "",
    status: item.exercise.log?.status ?? "pending",
    note: item.exercise.log?.note ?? ""
  }
}

function getNextExerciseIndex(index: number, total: number) {
  return index + 1 < total ? index + 1 : null
}

function inferSessionStatus(
  exerciseStates: ExerciseState[],
  sessionStatus: SessionDetail["status"]
): SessionDetail["status"] {
  if (exerciseStates.length > 0 && exerciseStates.every((item) => item.status === "completed")) {
    return "completed"
  }

  const hasProgress = exerciseStates.some(
    (item) =>
      item.status !== "pending" ||
      item.setsCompleted > 0 ||
      item.reps.trim().length > 0 ||
      item.weight.trim().length > 0 ||
      item.note.trim().length > 0
  )

  if (hasProgress || sessionStatus === "in_progress") {
    return "in_progress"
  }

  return "planned"
}

function playRestFinishedTone() {
  if (typeof window === "undefined") return

  const audioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!audioContextClass) return

  const context = new audioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = "triangle"
  oscillator.frequency.value = 880
  gain.gain.value = 0.03

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.start()
  oscillator.stop(context.currentTime + 0.18)

  oscillator.onended = () => {
    void context.close()
  }
}

function formatSessionTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

type SetRecordCardProps = {
  sessionName: string
  sessionStatus: SessionDetail["status"]
  completedExercises: number
  totalExercises: number
  nextLabel: string | null
  blockName: string
  orderLabel: string
  exercise: FlattenedExercise["exercise"]
  state: ExerciseState
  setElapsedSeconds: number
  onRepsChange: (value: string) => void
  onWeightChange: (value: string) => void
  onStatusChange: (value: ExerciseLog["status"]) => void
  onNoteChange: (value: string) => void
  onConfirm: () => void
  onBack: () => void
  className?: string
}

function SetRecordCard({
  sessionName,
  sessionStatus,
  completedExercises,
  totalExercises,
  nextLabel,
  blockName,
  orderLabel,
  exercise,
  state,
  setElapsedSeconds,
  onRepsChange,
  onWeightChange,
  onStatusChange,
  onNoteChange,
  onConfirm,
  onBack,
  className
}: SetRecordCardProps) {
  const progress = totalExercises === 0 ? 0 : Math.round((completedExercises / totalExercises) * 100)

  return (
    <div
      className={cn(
        "deck-card-enter flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-border/70 bg-card/95 p-3.5 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur md:rounded-[2rem] md:p-5",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{orderLabel}</Badge>
          <Badge variant="secondary">{blockName}</Badge>
          <Badge variant="info">Registro</Badge>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Set cerrado</p>
          <h3 className="text-[1.35rem] uppercase leading-none md:text-[1.9rem]">{exercise.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exercise.variant ? <Badge variant="secondary">{exercise.variant}</Badge> : null}
            {exercise.plannedSets ? <Badge variant="info">{state.setsCompleted}/{exercise.plannedSets} sets</Badge> : null}
            {exercise.plannedReps ? <Badge variant="warning">{exercise.plannedReps} reps objetivo</Badge> : null}
          </div>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 border-y border-border/70 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Entreno</p>
            <p className="truncate text-sm font-semibold">{sessionName}</p>
          </div>
          <Badge variant={getWorkoutSessionBadgeVariant(sessionStatus)}>{sessionStatus}</Badge>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-semibold text-muted-foreground">{completedExercises}/{totalExercises}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">Siguiente: {nextLabel ?? "cierre final"}</p>
      </div>

      <div className="mt-2.5 overflow-hidden rounded-[1.1rem] border border-border/70 bg-background/70">
        <div className="grid grid-cols-2 divide-x divide-border/70">
          <div className="px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sets</p>
            <p className="mt-1 text-xl font-semibold leading-none">
              {state.setsCompleted}
              <span className="text-sm text-muted-foreground">/{exercise.plannedSets ?? "-"}</span>
            </p>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tiempo</p>
            <p className="mt-1 text-xl font-semibold leading-none">{formatSessionTimer(setElapsedSeconds)}</p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="grid gap-1.5">
            <label htmlFor={`record-reps-${exercise.id}`} className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Reps reales
            </label>
            <Input
              id={`record-reps-${exercise.id}`}
              value={state.reps}
              onChange={(event) => onRepsChange(event.target.value)}
              placeholder={exercise.plannedReps ?? "10"}
              className="h-10 rounded-[0.9rem] text-base"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor={`record-weight-${exercise.id}`} className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Peso
            </label>
            <div className="relative">
              <Dumbbell className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`record-weight-${exercise.id}`}
                value={state.weight}
                onChange={(event) => onWeightChange(event.target.value)}
                placeholder="20 kg"
                className="h-10 rounded-[0.9rem] pl-9 text-base"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={`record-status-${exercise.id}`} className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Repeat2 className="size-3.5 text-primary" />
            Estado
          </label>
          <select
            id={`record-status-${exercise.id}`}
            value={state.status}
            onChange={(event) => onStatusChange(event.target.value as ExerciseLog["status"])}
            className="status-select h-10 rounded-[0.9rem]"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={`record-note-${exercise.id}`} className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Nota rapida
          </label>
          <Textarea
            id={`record-note-${exercise.id}`}
            value={state.note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Tecnica, fatiga, rango o ajuste..."
            className="min-h-[52px] rounded-[0.9rem] text-sm"
          />
        </div>
      </div>

      <div className="mt-auto grid grid-cols-[0.75fr_1.25fr] gap-2.5 pt-3">
        <Button type="button" variant="outline" className="min-h-10 rounded-[1rem]" onClick={onBack}>
          Volver
        </Button>
        <Button type="button" className="min-h-10 rounded-[1rem]" onClick={onConfirm}>
          Aceptar
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
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

  const initialStates = useMemo(() => items.map(getInitialState), [items])
  const firstPendingIndex = initialStates.findIndex((item) => item.status !== "completed")
  const initialActiveIndex =
    firstPendingIndex === -1 ? Math.max(items.length - 1, 0) : firstPendingIndex
  const initiallyComplete = items.length > 0 && firstPendingIndex === -1

  const [exerciseStates, setExerciseStates] = useState(initialStates)
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(initialActiveIndex)
  const [phase, setPhase] = useState<SessionPhase>(
    initiallyComplete ? "complete" : "exercise"
  )
  const [pendingAdvanceIndex, setPendingAdvanceIndex] = useState<number | null>(null)
  const [pendingRestPlan, setPendingRestPlan] = useState<PendingRestPlan | null>(null)
  const [restCompletesWorkout, setRestCompletesWorkout] = useState(false)
  const [restDuration, setRestDuration] = useState(90)
  const [restRemaining, setRestRemaining] = useState(90)
  const [restRunning, setRestRunning] = useState(false)
  const [setElapsedSeconds, setSetElapsedSeconds] = useState(0)
  const [generalNotes, setGeneralNotes] = useState(session.generalNotes ?? "")
  const [panelOpen, setPanelOpen] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionDetail["status"]>(() =>
    inferSessionStatus(initialStates, session.status)
  )
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported")
  const [hasRequestedNotifications, setHasRequestedNotifications] = useState(false)

  const currentItem = items[activeExerciseIndex]
  const currentExerciseState = exerciseStates[activeExerciseIndex]
  const nextItems = items.slice(activeExerciseIndex + 1, activeExerciseIndex + 4)
  const completedItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => exerciseStates[index]?.status === "completed")
    .slice(-3)
  const completedExercises = exerciseStates.filter((item) => item.status === "completed").length
  const allCompleted = items.length > 0 && completedExercises === items.length
  const nextPreviewLabel =
    pendingAdvanceIndex !== null ? items[pendingAdvanceIndex]?.exercise.name ?? null : null

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    setNotificationPermission(window.Notification.permission)
  }, [])

  useEffect(() => {
    const inferred = inferSessionStatus(exerciseStates, session.status)
    setSessionStatus(inferred)

    if (allCompleted && phase !== "rest" && phase !== "record") {
      setPhase("complete")
    }
  }, [allCompleted, exerciseStates, phase, session.status])

  useEffect(() => {
    if (phase !== "exercise") return

    setSetElapsedSeconds(0)

    const interval = window.setInterval(() => {
      setSetElapsedSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [activeExerciseIndex, phase])

  useEffect(() => {
    if (phase !== "rest" || hasRequestedNotifications || notificationPermission !== "default") return

    setHasRequestedNotifications(true)
    void window.Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission)
    })
  }, [hasRequestedNotifications, notificationPermission, phase])

  const finishRest = useCallback(() => {
    setRestRunning(false)
    playRestFinishedTone()

    if (notificationPermission === "granted" && typeof window !== "undefined" && "Notification" in window) {
      const targetName =
        pendingAdvanceIndex !== null
          ? items[pendingAdvanceIndex]?.exercise.name ?? "tu siguiente set"
          : "tu cierre de sesion"

      new window.Notification("Descanso terminado", {
        body: `Es momento de volver a ${targetName}.`
      })
    }

    if (restCompletesWorkout) {
      setSessionStatus("completed")
      setPhase("complete")
      return
    }

    if (pendingAdvanceIndex !== null) {
      setActiveExerciseIndex(pendingAdvanceIndex)
    }

    setPhase("exercise")
  }, [
    activeExerciseIndex,
    completedExercises,
    items,
    notificationPermission,
    pendingAdvanceIndex,
    restCompletesWorkout
  ])

  useEffect(() => {
    if (phase !== "rest" || !restRunning) return

    const interval = window.setInterval(() => {
      setRestRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval)
          finishRest()
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [finishRest, phase, restRunning])

  function updateExerciseState(index: number, patch: Partial<ExerciseState>) {
    setExerciseStates((current) => {
      const next = [...current]
      next[index] = {
        ...next[index],
        ...patch
      }
      return next
    })
  }

  function beginRest(
    options: PendingRestPlan
  ) {
    setPendingRestPlan(null)
    setPendingAdvanceIndex(options.nextIndex)
    setRestCompletesWorkout(options.completesWorkout)
    setRestDuration(options.seconds ?? 90)
    setRestRemaining(options.seconds ?? 90)
    setRestRunning(true)
    setSessionStatus("in_progress")
    setPhase("rest")
  }

  function handleSeriesDone() {
    if (!currentItem || !currentExerciseState) return

    const nextSets = currentExerciseState.setsCompleted + 1
    const targetSets = currentItem.exercise.plannedSets ?? 0
    const completedExercise = targetSets > 0 && nextSets >= targetSets

    updateExerciseState(activeExerciseIndex, {
      setsCompleted: nextSets,
      status: completedExercise ? "completed" : "in_progress"
    })

    const nextIndex = completedExercise
      ? getNextExerciseIndex(activeExerciseIndex, items.length)
      : activeExerciseIndex

    setPendingRestPlan({
      nextIndex,
      completesWorkout: completedExercise && nextIndex === null,
      message: pickMessage(
        completedExercise ? EXERCISE_MESSAGES : SET_MESSAGES,
        activeExerciseIndex + nextSets
      )
    })
    setPhase("record")
  }

  function handleConfirmRecord() {
    if (!pendingRestPlan) return
    beginRest(pendingRestPlan)
  }

  function handleBackFromRecord() {
    if (!currentExerciseState) return

    const previousSets = Math.max(currentExerciseState.setsCompleted - 1, 0)
    updateExerciseState(activeExerciseIndex, {
      setsCompleted: previousSets,
      status: previousSets > 0 ? "in_progress" : "pending"
    })
    setPendingRestPlan(null)
    setPhase("exercise")
  }

  function handleCompleteExercise() {
    if (!currentItem || !currentExerciseState) return

    updateExerciseState(activeExerciseIndex, {
      setsCompleted: Math.max(
        currentExerciseState.setsCompleted,
        currentItem.exercise.plannedSets ?? currentExerciseState.setsCompleted
      ),
      status: "completed"
    })

    const nextIndex = getNextExerciseIndex(activeExerciseIndex, items.length)

    beginRest({
      nextIndex,
      completesWorkout: nextIndex === null,
      message: pickMessage(EXERCISE_MESSAGES, activeExerciseIndex + completedExercises + 1)
    })
  }

  function renderPreviewLayer(offset: number, label: string) {
    return (
      <div
        key={label}
        className="absolute inset-x-3 rounded-[2rem] border border-border/60 bg-card/75 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.7)] backdrop-blur"
        style={{
          top: `${offset * 18 + 24}px`,
          bottom: `${offset * 10 + 18}px`,
          transform: `scale(${1 - offset * 0.035})`,
          opacity: 1 - offset * 0.16
        }}
      >
        <div className="flex h-full items-end justify-between px-5 py-4 text-sm">
          <span className="font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            En cola
          </span>
          <span className="text-right font-semibold text-muted-foreground">{label}</span>
        </div>
      </div>
    )
  }

  if (!currentItem || !currentExerciseState) {
    return null
  }

  return (
    <form action={action} className="flex min-h-[calc(100svh-7.5rem)] flex-col gap-4 pb-28 md:min-h-[calc(100svh-10rem)] md:pb-32">
      <input type="hidden" name="sessionStatus" value={sessionStatus} />
      <textarea name="generalNotes" value={generalNotes} readOnly className="hidden" />

      {items.map((item, index) => (
        <div key={item.exercise.id} className="hidden">
          <input type="hidden" name={`sets-${item.exercise.id}`} value={exerciseStates[index]?.setsCompleted ?? 0} />
          <input type="hidden" name={`status-${item.exercise.id}`} value={exerciseStates[index]?.status ?? "pending"} />
          <input type="hidden" name={`reps-${item.exercise.id}`} value={exerciseStates[index]?.reps ?? ""} />
          <input type="hidden" name={`weight-${item.exercise.id}`} value={exerciseStates[index]?.weight ?? ""} />
          <textarea name={`note-${item.exercise.id}`} value={exerciseStates[index]?.note ?? ""} readOnly />
        </div>
      ))}

      <div className="flex flex-col gap-4">
        {phase !== "complete" ? (
            <div className="relative min-h-[calc(100svh-9rem)] rounded-[1.85rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.18))] px-2.5 pb-3 pt-2.5 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.5)] md:min-h-[72svh] md:rounded-[2.25rem] md:px-3 md:pb-4 md:pt-3">
              {nextItems
                .slice(0, 2)
                .reverse()
                .map((item, index) => renderPreviewLayer(index + 1, item.exercise.name))}

              <div className="absolute inset-x-0 bottom-0 top-4 z-10 px-1 pb-1 md:top-5">
                {phase === "exercise" ? (
                  <ExerciseActionCard
                    blockName={currentItem.blockName}
                    orderLabel={currentItem.orderLabel}
                    exercise={currentItem.exercise}
                    status={currentExerciseState.status}
                    setsCompleted={currentExerciseState.setsCompleted}
                    setElapsedSeconds={setElapsedSeconds}
                    onSeriesDone={handleSeriesDone}
                    onCompleteExercise={handleCompleteExercise}
                    className="h-full min-h-0"
                  />
                ) : phase === "record" ? (
                  <SetRecordCard
                    sessionName={session.dayName}
                    sessionStatus={sessionStatus}
                    completedExercises={completedExercises}
                    totalExercises={items.length}
                    nextLabel={pendingRestPlan?.nextIndex !== null && pendingRestPlan?.nextIndex !== undefined
                      ? items[pendingRestPlan.nextIndex]?.exercise.name ?? null
                      : null}
                    blockName={currentItem.blockName}
                    orderLabel={currentItem.orderLabel}
                    exercise={currentItem.exercise}
                    state={currentExerciseState}
                    setElapsedSeconds={setElapsedSeconds}
                    onStatusChange={(value) => updateExerciseState(activeExerciseIndex, { status: value })}
                    onRepsChange={(value) => updateExerciseState(activeExerciseIndex, { reps: value })}
                    onWeightChange={(value) => updateExerciseState(activeExerciseIndex, { weight: value })}
                    onNoteChange={(value) => updateExerciseState(activeExerciseIndex, { note: value })}
                    onConfirm={handleConfirmRecord}
                    onBack={handleBackFromRecord}
                    className="h-full min-h-0"
                  />
                ) : (
                  <div className="deck-card-enter h-full min-h-0">
                    <RestTimerCard
                      duration={restDuration}
                      remaining={restRemaining}
                      running={restRunning}
                      nextLabel={nextPreviewLabel}
                      notificationPermission={notificationPermission}
                      onToggle={() => setRestRunning((current) => !current)}
                      onReset={() => {
                        setRestRemaining(restDuration)
                        setRestRunning(false)
                      }}
                      onPreset={(seconds) => {
                        setRestDuration(seconds)
                        setRestRemaining(seconds)
                        setRestRunning(true)
                      }}
                      onSkip={finishRest}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="hero-panel">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
                      <Trophy className="size-7" />
                    </div>
                    <div>
                      <p className="eyebrow">Rutina cerrada</p>
                      <h3 className="text-4xl uppercase leading-none">Sesion terminada</h3>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Ejercicios
                      </p>
                      <p className="mt-2 text-4xl font-semibold">{completedExercises}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Estado
                      </p>
                      <p className="mt-2 text-4xl font-semibold">100%</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Sensacion
                      </p>
                      <p className="mt-2 text-2xl font-semibold">Buen trabajo</p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                      <div>
                        <p className="font-semibold">Cerraste la rutina completa.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Guarda la sesion para conservar series, reps, peso y notas de este entreno.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" size="lg" className="rounded-full px-8">
                      Guardar sesion completa
                    </Button>
                    <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 px-6 text-sm font-semibold">
                      Volver al inicio
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {panelOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/35 px-3 pb-24 pt-20 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => setPanelOpen(false)} aria-hidden="true" />
          <Card className="relative z-10 max-h-[72svh] w-full max-w-xl overflow-hidden rounded-[2rem] border-border/80 bg-background/95 shadow-[0_32px_90px_-42px_rgba(15,23,42,0.75)]">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Panel</p>
                  <CardTitle>Sesion en contexto</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {Math.min(activeExerciseIndex + 1, items.length)} / {items.length}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setPanelOpen(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[calc(72svh-96px)] space-y-5 overflow-y-auto pt-5">
              <div className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BellRing className="size-4 text-primary" />
                  Notificaciones
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {notificationPermission === "granted"
                    ? "El navegador avisara cuando termine el descanso."
                    : notificationPermission === "denied"
                      ? "Las notificaciones del navegador estan bloqueadas; mantendremos aviso visual y tono dentro de la app."
                      : "En el primer descanso intentaremos pedir permiso para notificarte si el navegador lo soporta."}
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Completados
                </p>
                <div className="mt-3 space-y-2">
                  {completedItems.length > 0 ? (
                    completedItems.map(({ item }) => (
                      <div
                        key={item.exercise.id}
                        className="rounded-2xl border border-border/60 bg-card/70 px-3 py-3 text-sm"
                      >
                        <p className="font-semibold">{item.exercise.name}</p>
                        <p className="text-muted-foreground">{item.blockName}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tus ejercicios cerrados apareceran aqui para que sientas el avance del mazo.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  En cola
                </p>
                <div className="mt-3 space-y-2">
                  {nextItems.length > 0 ? (
                    nextItems.map((item, index) => (
                      <div
                        key={item.exercise.id}
                        className="rounded-2xl border border-border/60 bg-card/70 px-3 py-3 text-sm"
                      >
                        <p className="font-semibold">
                          {index + 1}. {item.exercise.name}
                        </p>
                        <p className="text-muted-foreground">{item.blockName}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Estas entrando al tramo final de la rutina.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
                <label htmlFor="general-notes" className="flex items-center gap-2 text-sm font-semibold">
                  <NotebookPen className="size-4 text-primary" />
                  Notas generales
                </label>
                <Textarea
                  id="general-notes"
                  value={generalNotes}
                  onChange={(event) => setGeneralNotes(event.target.value)}
                  placeholder="Como te sentiste, ajustes, molestias o mejoras..."
                  className="mt-3 min-h-[140px] rounded-2xl"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <WorkoutMiniDock
        phase={phase}
        restRunning={restRunning}
        onToggleRest={() => setRestRunning((current) => !current)}
        onSkipRest={finishRest}
        onTogglePanel={() => setPanelOpen((current) => !current)}
      />
    </form>
  )
}
