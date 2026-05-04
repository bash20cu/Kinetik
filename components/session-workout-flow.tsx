"use client"

import { ArrowRight, BellRing, CheckCircle2, Dumbbell, LayoutPanelTop, NotebookPen, Trophy, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { ExerciseActionCard } from "@/components/exercise-action-card"
import { RestTimerCard } from "@/components/rest-timer-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getWorkoutSessionBadgeVariant } from "@/lib/status-ui"
import type { ExerciseLog, SessionDetail } from "@/lib/types"
import { cn } from "@/lib/utils"
import { EXERCISE_GROUPS, EXERCISE_LIBRARY, VARIANT_OPTIONS } from "@/lib/workout-presets"

type SessionPhase = "exercise" | "record" | "rest" | "complete" | "add_exercise"

type SessionWorkoutFlowProps = {
  session: SessionDetail
  action: (formData: FormData) => void | Promise<void>
  addExerciseAction: (formData: FormData) => void | Promise<void>
}

const CUSTOM_EXERCISE_VALUE = "__custom__"

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

type NewExerciseDraft = {
  name: string
  groupName: string
  variant: string
  plannedSets: string
  plannedReps: string
  notes: string
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

function getExerciseSelectValue(name: string) {
  if (!name) return ""
  return EXERCISE_LIBRARY.some((exercise) => exercise.name === name) ? name : CUSTOM_EXERCISE_VALUE
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

function triggerRestFallbackFeedback() {
  if (typeof window === "undefined") return

  playRestFinishedTone()

  if ("vibrate" in window.navigator) {
    window.navigator.vibrate([180, 80, 180])
  }
}

function getNotificationSupport() {
  if (typeof window === "undefined") return "unsupported" as const
  if (!window.isSecureContext) return "unsupported" as const
  if (!("Notification" in window)) return "unsupported" as const
  return window.Notification.permission
}

function isLikelyIos() {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent)
}

function isStandaloneWebApp() {
  if (typeof window === "undefined") return false

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
  return Boolean(
    navigatorWithStandalone.standalone ||
      window.matchMedia("(display-mode: standalone)").matches
  )
}

function formatSessionTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

type SetRecordCardProps = {
  sessionName: string
  sessionStatus: SessionDetail["status"]
  completedSets: number
  totalSets: number
  nextLabel: string | null
  blockName: string
  orderLabel: string
  exercise: FlattenedExercise["exercise"]
  state: ExerciseState
  setElapsedSeconds: number
  onRepsChange: (value: string) => void
  onWeightChange: (value: string) => void
  onNoteChange: (value: string) => void
  onConfirm: () => void
  onBack: () => void
  className?: string
}

type AddExerciseCardProps = {
  draft: NewExerciseDraft
  addExerciseAction: (formData: FormData) => void | Promise<void>
  onChange: (field: keyof NewExerciseDraft, value: string) => void
  onExerciseNameChange: (value: string) => void
  onBack: () => void
}

function AddExerciseCard({
  draft,
  addExerciseAction,
  onChange,
  onExerciseNameChange,
  onBack
}: AddExerciseCardProps) {
  const selectedValue = getExerciseSelectValue(draft.name)

  return (
    <div className="deck-card-enter flex max-h-full flex-col overflow-hidden rounded-[1.45rem] border border-border/70 bg-card/95 p-4 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur md:rounded-[2rem] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Siguiente tarjeta
          </p>
          <h3 className="text-[1.75rem] uppercase leading-none md:text-4xl">Agregar ejercicio</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Elige lo que vas a hacer ahora y lo metemos al mazo.
          </p>
        </div>
        <Button type="button" variant="outline" className="shrink-0 rounded-full" onClick={onBack}>
          Volver
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        <input type="hidden" name="newExerciseName" value={draft.name} />

        <div className="grid gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Ejercicio
          </label>
          <select
            value={selectedValue}
            onChange={(event) => onExerciseNameChange(event.target.value)}
            className="status-select h-11 rounded-2xl"
            required
          >
            <option value="">Selecciona un ejercicio</option>
            {Object.entries(EXERCISE_GROUPS).map(([groupName, groupExercises]) => (
              <optgroup key={groupName} label={groupName}>
                {groupExercises.map((exerciseName) => (
                  <option key={exerciseName} value={exerciseName}>
                    {exerciseName}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={CUSTOM_EXERCISE_VALUE}>Otro</option>
          </select>
        </div>

        {selectedValue === CUSTOM_EXERCISE_VALUE ? (
          <div className="grid gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Nombre personalizado
            </label>
            <Input
              value={draft.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Ej. Farmer walk"
              className="h-11 rounded-2xl"
              required
            />
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Grupo muscular
          </label>
          <Input
            name="newExerciseGroup"
            value={draft.groupName}
            onChange={(event) => onChange("groupName", event.target.value)}
            placeholder="Grupo muscular"
            className="h-11 rounded-2xl"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Variante / implemento
          </label>
          <select
            name="newExerciseVariant"
            value={draft.variant}
            onChange={(event) => onChange("variant", event.target.value)}
            className="status-select h-11 rounded-2xl"
          >
            <option value="">Sin especificar</option>
            {VARIANT_OPTIONS.map((variant) => (
              <option key={variant} value={variant}>
                {variant}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            name="newExerciseSets"
            type="number"
            min="1"
            placeholder="Sets"
            value={draft.plannedSets}
            onChange={(event) => onChange("plannedSets", event.target.value)}
            className="h-11 rounded-2xl"
          />
          <Input
            name="newExerciseReps"
            placeholder="Reps / tiempo"
            value={draft.plannedReps}
            onChange={(event) => onChange("plannedReps", event.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>

        <Textarea
          name="newExerciseNotes"
          value={draft.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          placeholder="Notas rapidas"
          className="min-h-[74px] rounded-2xl"
        />
      </div>

      <Button type="submit" formAction={addExerciseAction} className="mt-auto min-h-11 rounded-full">
        Agregar y seguir
      </Button>
    </div>
  )
}

function SetRecordCard({
  sessionName,
  sessionStatus,
  completedSets,
  totalSets,
  nextLabel,
  blockName,
  orderLabel,
  exercise,
  state,
  setElapsedSeconds,
  onRepsChange,
  onWeightChange,
  onNoteChange,
  onConfirm,
  onBack,
  className
}: SetRecordCardProps) {
  const progress = totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100)

  return (
    <div
      className={cn(
        "deck-card-enter flex max-h-full flex-col overflow-hidden rounded-[1.45rem] border border-border/70 bg-card/95 p-3 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur md:rounded-[2rem] md:p-5",
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
          <h3 className="text-[1.25rem] uppercase leading-none md:text-[1.9rem]">{exercise.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exercise.variant ? <Badge variant="secondary">{exercise.variant}</Badge> : null}
            {exercise.plannedSets ? <Badge variant="info">{state.setsCompleted}/{exercise.plannedSets} sets</Badge> : null}
            {exercise.plannedReps ? <Badge variant="warning">{exercise.plannedReps} reps objetivo</Badge> : null}
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1.5 border-y border-border/70 py-2">
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
          <span className="font-semibold text-muted-foreground">{completedSets}/{totalSets}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">Siguiente: {nextLabel ?? "cierre final"}</p>
      </div>

      <div className="mt-2 overflow-hidden rounded-[1rem] border border-border/70 bg-background/70">
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

      <div className="mt-2 grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1.5">
            <label htmlFor={`record-reps-${exercise.id}`} className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Reps reales
            </label>
            <Input
              id={`record-reps-${exercise.id}`}
              value={state.reps}
              onChange={(event) => onRepsChange(event.target.value)}
              placeholder={exercise.plannedReps ?? "10"}
              className="h-9 rounded-[0.85rem] text-base"
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
                className="h-9 rounded-[0.85rem] pl-9 text-base"
              />
            </div>
          </div>
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
            className="min-h-[46px] rounded-[0.85rem] text-sm"
          />
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-[0.75fr_1.25fr] gap-2">
        <Button type="button" variant="outline" className="min-h-9 rounded-[0.95rem]" onClick={onBack}>
          Volver
        </Button>
        <Button type="button" className="min-h-9 rounded-[0.95rem]" onClick={onConfirm}>
          Aceptar
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function SessionWorkoutFlow({ session, action, addExerciseAction }: SessionWorkoutFlowProps) {
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
  const [newExercise, setNewExercise] = useState<NewExerciseDraft>({
    name: "",
    groupName: "",
    variant: "",
    plannedSets: "3",
    plannedReps: "10",
    notes: ""
  })
  const [sessionStatus, setSessionStatus] = useState<SessionDetail["status"]>(() =>
    inferSessionStatus(initialStates, session.status)
  )
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported")
  const [notificationHint, setNotificationHint] = useState("")
  const [restAlertMessage, setRestAlertMessage] = useState<string | null>(null)

  const currentItem = items[activeExerciseIndex]
  const currentExerciseState = exerciseStates[activeExerciseIndex]
  const nextItems = items.slice(activeExerciseIndex + 1, activeExerciseIndex + 4)
  const completedItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => exerciseStates[index]?.status === "completed")
    .slice(-3)
  const completedExercises = exerciseStates.filter((item) => item.status === "completed").length
  const totalPlannedSets = items.reduce(
    (total, item) => total + Math.max(item.exercise.plannedSets ?? 1, 1),
    0
  )
  const completedSets = exerciseStates.reduce(
    (total, state, index) => {
      const plannedSets = Math.max(items[index]?.exercise.plannedSets ?? state.setsCompleted, 1)
      return total + Math.min(state.setsCompleted, plannedSets)
    },
    0
  )
  const allCompleted = items.length > 0 && completedExercises === items.length
  const nextPreviewLabel =
    pendingAdvanceIndex !== null ? items[pendingAdvanceIndex]?.exercise.name ?? null : null

  function updateNewExercise(field: keyof NewExerciseDraft, value: string) {
    setNewExercise((current) => ({ ...current, [field]: value }))
  }

  function updateNewExerciseName(value: string) {
    const selectedExercise = EXERCISE_LIBRARY.find((exercise) => exercise.name === value)

    if (value === CUSTOM_EXERCISE_VALUE) {
      setNewExercise((current) => ({
        ...current,
        name: EXERCISE_LIBRARY.some((item) => item.name === current.name) ? "" : current.name
      }))
      return
    }

    if (!selectedExercise) {
      updateNewExercise("name", value)
      return
    }

    setNewExercise((current) => ({
      ...current,
      name: selectedExercise.name,
      groupName: selectedExercise.groupName
    }))
  }

  useEffect(() => {
    const permission = getNotificationSupport()
    setNotificationPermission(permission)

    if (permission === "unsupported") {
      setNotificationHint(
        isLikelyIos() && !isStandaloneWebApp()
          ? "En iPhone, las notificaciones web requieren instalar la app en la pantalla de inicio. Mientras tanto usamos aviso dentro de la app."
          : "Este navegador no permite notificaciones web aqui. Usamos aviso dentro de la app."
      )
    }
  }, [])

  useEffect(() => {
    const inferred = inferSessionStatus(exerciseStates, session.status)
    setSessionStatus(inferred)

    if (allCompleted && phase !== "rest" && phase !== "record" && phase !== "add_exercise") {
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

  async function requestNotifications() {
    if (typeof window === "undefined" || !window.isSecureContext || !("Notification" in window)) {
      setNotificationPermission("unsupported")
      setNotificationHint(
        isLikelyIos() && !isStandaloneWebApp()
          ? "En iPhone debes abrir la app desde Home Screen para permitir notificaciones."
          : "Este navegador no permite notificaciones web en este contexto."
      )
      return
    }

    const permission = await window.Notification.requestPermission()
    setNotificationPermission(permission)
    setNotificationHint(
      permission === "granted"
        ? "Listo. Si el navegador lo soporta, avisaremos fuera de la app al terminar el descanso."
        : permission === "denied"
          ? "Permiso bloqueado. Mantendremos aviso visual, sonido y vibracion dentro de la app."
          : "Sin permiso todavia. Puedes seguir usando el aviso dentro de la app."
    )
  }

  const finishRest = useCallback(() => {
    setRestRunning(false)
    triggerRestFallbackFeedback()

    if (notificationPermission === "granted" && typeof window !== "undefined" && "Notification" in window) {
      const targetName =
        pendingAdvanceIndex !== null
          ? items[pendingAdvanceIndex]?.exercise.name ?? "tu siguiente set"
          : "tu cierre de sesion"

      try {
        new window.Notification("Descanso terminado", {
          body: `Es momento de volver a ${targetName}.`,
          tag: `kinetik-rest-${session.id}`,
          requireInteraction: false
        })
      } catch {
        setNotificationHint("No pudimos emitir la notificacion del sistema. Dejamos activo el aviso dentro de la app.")
      }
    }

    setRestAlertMessage(
      pendingAdvanceIndex !== null
        ? `Descanso terminado. Sigue con ${items[pendingAdvanceIndex]?.exercise.name ?? "tu siguiente set"}.`
        : "Descanso terminado. Rutina lista para cerrar."
    )

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
    items,
    notificationPermission,
    pendingAdvanceIndex,
    restCompletesWorkout,
    session.id
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

  if (!currentItem || !currentExerciseState) {
    return null
  }

  return (
    <form action={action} className="flex h-[calc(100svh-7.5rem)] flex-col gap-4 overflow-hidden md:h-[calc(100svh-10rem)]">
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
            <div className="relative min-h-[calc(100svh-12rem)] md:min-h-[72svh]">
              <div className="absolute inset-0 z-10">
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
                    completedSets={completedSets}
                    totalSets={totalPlannedSets}
                    nextLabel={pendingRestPlan?.nextIndex !== null && pendingRestPlan?.nextIndex !== undefined
                      ? items[pendingRestPlan.nextIndex]?.exercise.name ?? null
                      : null}
                    blockName={currentItem.blockName}
                    orderLabel={currentItem.orderLabel}
                    exercise={currentItem.exercise}
                    state={currentExerciseState}
                    setElapsedSeconds={setElapsedSeconds}
                    onRepsChange={(value) => updateExerciseState(activeExerciseIndex, { reps: value })}
                    onWeightChange={(value) => updateExerciseState(activeExerciseIndex, { weight: value })}
                    onNoteChange={(value) => updateExerciseState(activeExerciseIndex, { note: value })}
                    onConfirm={handleConfirmRecord}
                    onBack={handleBackFromRecord}
                    className="min-h-0"
                  />
                ) : phase === "add_exercise" ? (
                  <AddExerciseCard
                    draft={newExercise}
                    addExerciseAction={addExerciseAction}
                    onChange={updateNewExercise}
                    onExerciseNameChange={updateNewExerciseName}
                    onBack={() => setPhase("complete")}
                  />
                ) : (
                  <div className="deck-card-enter h-full min-h-0">
                    <RestTimerCard
                      duration={restDuration}
                      remaining={restRemaining}
                      running={restRunning}
                      nextLabel={nextPreviewLabel}
                      notificationPermission={notificationPermission}
                      notificationHint={notificationHint}
                      onEnableNotifications={requestNotifications}
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
            <Card className="overflow-hidden rounded-[1.45rem] border border-border/70 bg-card/95 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.7)]">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
                      <Trophy className="size-5" />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Rutina cerrada</p>
                      <h3 className="text-[1.8rem] uppercase leading-none md:text-4xl">Sesion terminada</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-[1rem] border border-border/70 bg-background/75 p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Ejercicios
                      </p>
                      <p className="mt-1 text-2xl font-semibold leading-none">{completedExercises}</p>
                    </div>
                    <div className="rounded-[1rem] border border-border/70 bg-background/75 p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Estado
                      </p>
                      <p className="mt-1 text-2xl font-semibold leading-none">100%</p>
                    </div>
                    <div className="rounded-[1rem] border border-border/70 bg-background/75 p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Sensacion
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-tight">Buen trabajo</p>
                    </div>
                  </div>

                  <div className="rounded-[1rem] border border-primary/15 bg-primary/5 p-3">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Cerraste la rutina completa.</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Guarda la sesion para conservar series, reps, peso y notas de este entreno.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-10 rounded-full px-5 sm:col-span-3"
                      onClick={() => setPhase("add_exercise")}
                    >
                      Agregar otro ejercicio
                    </Button>
                    <Button
                      type="submit"
                      name="afterSave"
                      value="home"
                      className="min-h-10 rounded-full px-5 sm:col-span-3"
                    >
                      Guardar y volver al inicio
                    </Button>
                    <Button
                      type="submit"
                      name="afterSave"
                      value="history"
                      variant="outline"
                      className="min-h-10 rounded-full px-5"
                    >
                      Ver historial
                    </Button>
                    <Button
                      type="submit"
                      name="afterSave"
                      value="free"
                      variant="secondary"
                      className="min-h-10 rounded-full px-5 sm:col-span-2"
                    >
                      Empezar otro entrenamiento
                    </Button>
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

      {restAlertMessage ? (
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 mx-auto max-w-xl rounded-[1.1rem] border border-primary/25 bg-background/95 p-3 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.8)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Aviso</p>
              <p className="text-sm font-semibold">{restAlertMessage}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRestAlertMessage(null)}>
              OK
            </Button>
          </div>
        </div>
      ) : null}

    </form>
  )
}
