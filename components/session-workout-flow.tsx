"use client"

import { ArrowLeft, ArrowRight, BellRing, CheckCircle2, Dumbbell, NotebookPen, Plus, Trophy, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { ExerciseActionCard } from "@/components/exercise-action-card"
import { RestTimerCard } from "@/components/rest-timer-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SessionDetail, SessionExercise } from "@/lib/types"
import { cn } from "@/lib/utils"

type SessionPhase = "exercise" | "record" | "rest" | "complete" | "add_exercise" | "exerciseSetup"

type SessionWorkoutFlowProps = {
  session: SessionDetail
  action: (formData: FormData) => void | Promise<void>
  addAction: (formData: FormData) => void | Promise<void>
  exerciseGroups: Record<string, { name: string; groupName: string; id: string; defaultSets: number; defaultReps: string }[]>
}

type ExerciseSetup = {
  plannedSets: number
  plannedReps: string
  weight: string
}

type ExerciseItem = {
  orderLabel: string
  exercise: SessionDetail["exercises"][number]
}

type ExerciseState = {
  setsCompleted: number
  reps: string
  weight: string
  status: SessionExercise["status"]
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

function pickMessage(collection: string[], seed: number) {
  return collection[seed % collection.length]
}

function getDisplayName(exercise: SessionDetail["exercises"][number]): string {
  return exercise.customName || exercise.libraryExercise?.name || "Ejercicio"
}

function getDisplayGroup(exercise: SessionDetail["exercises"][number]): string {
  return exercise.libraryExercise?.groupName || exercise.groupName
}

function getInitialState(exercise: SessionDetail["exercises"][number]): ExerciseState {
  return {
    setsCompleted: exercise.actualSets ?? 0,
    reps: exercise.reps ?? exercise.plannedReps ?? "",
    weight: exercise.weight ?? "",
    status: exercise.status,
    note: exercise.note ?? ""
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
  exercise: SessionDetail["exercises"][number]
  state: ExerciseState
  setElapsedSeconds: number
  onRepsChange: (value: string) => void
  onWeightChange: (value: string) => void
  onNoteChange: (value: string) => void
  onConfirm: () => void
  onBack: () => void
  className?: string
}

function SetRecordCard({
  sessionName,
  sessionStatus,
  completedSets,
  totalSets,
  nextLabel,
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
  const displayName = getDisplayName(exercise)
  const displayGroup = getDisplayGroup(exercise)

  return (
    <div
      className={cn(
        "deck-card-enter flex max-h-full flex-col overflow-hidden rounded-[1.45rem] border border-border/70 bg-card/95 p-3 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur md:rounded-[2rem] md:p-5",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{exercise.orderIndex + 1}</Badge>
          <Badge variant="secondary">{displayGroup}</Badge>
          <Badge variant="info">Registro</Badge>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Set cerrado</p>
          <h3 className="text-[1.25rem] uppercase leading-none md:text-[1.9rem]">{displayName}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exercise.libraryExercise?.variant ? <Badge variant="secondary">{exercise.libraryExercise.variant}</Badge> : null}
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
          <Badge variant={sessionStatus === "completed" ? "success" : sessionStatus === "in_progress" ? "info" : "outline"}>
            {sessionStatus}
          </Badge>
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

export function SessionWorkoutFlow({ session, action, addAction, exerciseGroups }: SessionWorkoutFlowProps) {
  const router = useRouter()
  const items = useMemo<ExerciseItem[]>(() => {
    return session.exercises.map((exercise) => ({
      orderLabel: `Paso ${exercise.orderIndex + 1}`,
      exercise
    }))
  }, [session.exercises])

  const initialStates = useMemo(() => items.map((item) => getInitialState(item.exercise)), [items])
  const firstPendingIndex = initialStates.findIndex((item) => item.status !== "completed")
  const initialActiveIndex =
    firstPendingIndex === -1 ? Math.max(items.length - 1, 0) : firstPendingIndex
  const initiallyComplete = items.length > 0 && firstPendingIndex === -1

  const [exerciseStates, setExerciseStates] = useState(initialStates)
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(initialActiveIndex)
  const [phase, setPhase] = useState<SessionPhase>(initiallyComplete ? "complete" : "exerciseSetup")
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
  const [notificationHint, setNotificationHint] = useState("")
  const [restAlertMessage, setRestAlertMessage] = useState<string | null>(null)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const exerciseTimerStartRef = useRef<number | null>(null)
  const restTimerEndAtRef = useRef<number | null>(null)
  const restRemainingRef = useRef(90)
  restRemainingRef.current = restRemaining
  const [exerciseSetup, setExerciseSetup] = useState<ExerciseSetup>(() => ({
    plannedSets: items[initialActiveIndex]?.exercise.plannedSets ?? 3,
    plannedReps: items[initialActiveIndex]?.exercise.plannedReps ?? "10",
    weight: ""
  }))

  const currentItem = items[activeExerciseIndex]
  const currentExerciseState = exerciseStates[activeExerciseIndex]
  const nextItems = items.slice(activeExerciseIndex + 1, activeExerciseIndex + 4)
  const completedItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => exerciseStates[index]?.status === "completed")
    .slice(-3)
  const completedExercises = exerciseStates.filter((item) => item.status === "completed").length
  const totalPlannedSets = items.reduce(
    (total, item, index) => {
      const sets = index === activeExerciseIndex ? exerciseSetup.plannedSets : (item.exercise.plannedSets ?? 1)
      return total + Math.max(sets, 1)
    },
    0
  )
  const completedSets = exerciseStates.reduce(
    (total, state, index) => {
      const plannedSets = index === activeExerciseIndex ? exerciseSetup.plannedSets : (items[index]?.exercise.plannedSets ?? state.setsCompleted)
      return total + Math.min(state.setsCompleted, Math.max(plannedSets, 1))
    },
    0
  )
  const allCompleted = items.length > 0 && completedExercises === items.length

  useEffect(() => {
    const permission = getNotificationSupport()
    setNotificationPermission(permission)

    if (permission === "unsupported") {
      setNotificationHint(
        isLikelyIos() && !isStandaloneWebApp()
          ? "En iPhone, las notificaciones web requieren instalar la app en la pantalla de inicio."
          : "Este navegador no permite notificaciones web aqui."
      )
    }
  }, [])

  useEffect(() => {
    if (!currentItem) return
    setExerciseSetup({
      plannedSets: currentItem.exercise.plannedSets ?? 3,
      plannedReps: currentItem.exercise.plannedReps ?? "10",
      weight: ""
    })
  }, [activeExerciseIndex, currentItem])

  useEffect(() => {
    const inferred = inferSessionStatus(exerciseStates, session.status)
    setSessionStatus(inferred)

    if (allCompleted && phase !== "rest" && phase !== "record" && phase !== "add_exercise" && phase !== "exerciseSetup") {
      setPhase("complete")
    }
  }, [allCompleted, exerciseStates, phase, session.status])

  useEffect(() => {
    const expectedLength = items.length
    const currentLength = exerciseStates.length

    if (expectedLength > currentLength) {
      const newStates = Array.from({ length: expectedLength - currentLength }, () => ({
        setsCompleted: 0,
        reps: "",
        weight: "",
        status: "pending" as const,
        note: ""
      }))

      setExerciseStates((prev) => [...prev, ...newStates])

      if (phase === "complete") {
        setActiveExerciseIndex(currentLength)
        setPhase("exerciseSetup")
      }
    }
  }, [items.length, phase, exerciseStates.length])

  useEffect(() => {
    if (phase !== "exercise") return

    setSetElapsedSeconds(0)
    exerciseTimerStartRef.current = Date.now()

    const syncExerciseTimer = () => {
      const startedAt = exerciseTimerStartRef.current
      if (startedAt === null) return

      setSetElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }

    syncExerciseTimer()

    const interval = window.setInterval(syncExerciseTimer, 1000)
    const handleVisibilityChange = () => {
      if (!document.hidden) syncExerciseTimer()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
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
          ? items[pendingAdvanceIndex]?.exercise.customName || items[pendingAdvanceIndex]?.exercise.libraryExercise?.name || "tu siguiente set"
          : "tu cierre de sesion"

      try {
        new window.Notification("Descanso terminado", {
          body: `Es momento de volver a ${targetName}.`,
          tag: `kinetik-rest-${session.id}`,
          requireInteraction: false
        })
      } catch {
        setNotificationHint("No pudimos emitir la notificacion del sistema.")
      }
    }

    setRestAlertMessage(
      pendingAdvanceIndex !== null
        ? `Descanso terminado. Sigue con ${items[pendingAdvanceIndex]?.exercise.customName || items[pendingAdvanceIndex]?.exercise.libraryExercise?.name || "tu siguiente set"}.`
        : "Descanso terminado. Sesion lista para cerrar."
    )

    if (restCompletesWorkout) {
      setSessionStatus("completed")
      setPhase("complete")
      return
    }

    if (pendingAdvanceIndex !== null) {
      setActiveExerciseIndex(pendingAdvanceIndex)
    }

    setPhase("exerciseSetup")
  }, [items, notificationPermission, pendingAdvanceIndex, restCompletesWorkout, session.id])

  useEffect(() => {
    if (phase !== "rest" || !restRunning) return

    restTimerEndAtRef.current = Date.now() + restRemainingRef.current * 1000

    const syncRestTimer = () => {
      const endAt = restTimerEndAtRef.current
      if (endAt === null) return

      const nextRemaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))

      setRestRemaining(nextRemaining)

      if (nextRemaining === 0) {
        window.clearInterval(interval)
        finishRest()
      }
    }

    syncRestTimer()

    const interval = window.setInterval(syncRestTimer, 1000)
    const handleVisibilityChange = () => {
      if (!document.hidden) syncRestTimer()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
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

  function beginRest(options: PendingRestPlan) {
    setPendingRestPlan(null)
    setPendingAdvanceIndex(options.nextIndex)
    setRestCompletesWorkout(options.completesWorkout)
    setRestDuration(options.seconds ?? 90)
    setRestRemaining(options.seconds ?? 90)
    restTimerEndAtRef.current = Date.now() + (options.seconds ?? 90) * 1000
    setRestRunning(true)
    setSessionStatus("in_progress")
    setPhase("rest")
  }

  function handleSeriesDone() {
    if (!currentItem || !currentExerciseState) return

    const nextSets = currentExerciseState.setsCompleted + 1
    const targetSets = exerciseSetup.plannedSets
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
        exerciseSetup.plannedSets
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

  function handleStartExercise() {
    updateExerciseState(activeExerciseIndex, {
      status: "in_progress",
      reps: exerciseSetup.plannedReps,
      weight: exerciseSetup.weight
    })
    setPhase("exercise")
  }

  function handleSkipSetup() {
    updateExerciseState(activeExerciseIndex, { status: "in_progress" })
    setPhase("exercise")
  }

  async function handleAddExerciseFromLibrary(groupName: string, exerciseName: string, exerciseId: string, defaultSets: number, defaultReps: string) {
    if (isAddingExercise) return
    setIsAddingExercise(true)
    const formData = new FormData()
    formData.set("exerciseData", JSON.stringify({
      exerciseId,
      customName: null,
      groupName,
      orderIndex: items.length,
      plannedSets: defaultSets,
      plannedReps: defaultReps
    }))
    try {
      await addAction(formData)
      router.refresh()
      setShowAddExercise(false)
    } finally {
      setIsAddingExercise(false)
    }
  }

  if (showAddExercise) {
    return (
      <div className="flex h-[calc(100svh-7.5rem)] flex-col gap-4 overflow-hidden md:h-[calc(100svh-10rem)]">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setShowAddExercise(false)}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Agregar ejercicio</h2>
            <p className="text-sm text-muted-foreground">Selecciona de la libreria</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {Object.entries(exerciseGroups).map(([groupName, exercises]) => (
            <Card key={groupName} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{groupName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {exercises.map((exercise) => (
                    <Button
                      key={exercise.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto justify-start rounded-xl px-3 py-2 text-sm font-normal"
                      onClick={() => handleAddExerciseFromLibrary(groupName, exercise.name, exercise.id, exercise.defaultSets, exercise.defaultReps)}
                      disabled={isAddingExercise}
                    >
                      {exercise.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const displayName = getDisplayName(currentItem.exercise)
  const displayGroup = getDisplayGroup(currentItem.exercise)

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
                {phase === "exerciseSetup" ? (
                  <div className="deck-card-enter flex max-h-full flex-col overflow-hidden rounded-[1.45rem] border border-border/70 bg-card/95 p-3 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur md:rounded-[2rem] md:p-5">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{currentItem.exercise.orderIndex + 1}</Badge>
                        <Badge variant="secondary">{displayGroup}</Badge>
                        <Badge variant="info">Configurar</Badge>
                      </div>
                      <div>
                        <h3 className="text-[1.25rem] uppercase leading-none md:text-[1.9rem]">{displayName}</h3>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sets</label>
                          <Input
                            type="number"
                            min="1"
                            value={exerciseSetup.plannedSets}
                            onChange={(e) => setExerciseSetup((prev) => ({ ...prev, plannedSets: parseInt(e.target.value) || 1 }))}
                            className="h-10 rounded-xl text-lg"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reps objetivo</label>
                          <Input
                            value={exerciseSetup.plannedReps}
                            onChange={(e) => setExerciseSetup((prev) => ({ ...prev, plannedReps: e.target.value }))}
                            placeholder="10"
                            className="h-10 rounded-xl text-lg"
                          />
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Peso</label>
                        <div className="relative">
                          <Dumbbell className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={exerciseSetup.weight}
                            onChange={(e) => setExerciseSetup((prev) => ({ ...prev, weight: e.target.value }))}
                            placeholder="20 kg"
                            className="h-10 rounded-xl pl-9 text-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" className="min-h-10 rounded-full" onClick={handleSkipSetup}>
                        Saltar
                      </Button>
                      <Button type="button" className="min-h-10 rounded-full" onClick={handleStartExercise}>
                        Empezar
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : phase === "exercise" ? (
                  <ExerciseActionCard
                    blockName={displayGroup}
                    orderLabel={currentItem.orderLabel}
                    exercise={{
                      id: currentItem.exercise.id,
                      name: displayName,
                      variant: currentItem.exercise.libraryExercise?.variant || null,
                      plannedSets: exerciseSetup.plannedSets,
                      plannedReps: exerciseSetup.plannedReps,
                      notes: currentItem.exercise.note
                    }}
                    status={currentExerciseState.status}
                    setsCompleted={currentExerciseState.setsCompleted}
                    setElapsedSeconds={setElapsedSeconds}
                    onSeriesDone={handleSeriesDone}
                    onCompleteExercise={handleCompleteExercise}
                    className="h-full min-h-0"
                  />
                ) : phase === "record" ? (
                  <SetRecordCard
                    sessionName={session.date}
                    sessionStatus={sessionStatus}
                    completedSets={completedSets}
                    totalSets={totalPlannedSets}
                    nextLabel={pendingRestPlan?.nextIndex !== null && pendingRestPlan?.nextIndex !== undefined
                      ? items[pendingRestPlan.nextIndex]?.exercise.customName || items[pendingRestPlan.nextIndex]?.exercise.libraryExercise?.name || null
                      : null}
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
                ) : (
                  <div className="deck-card-enter h-full min-h-0">
                    <RestTimerCard
                      duration={restDuration}
                      remaining={restRemaining}
                      running={restRunning}
                      nextLabel={pendingAdvanceIndex !== null ? items[pendingAdvanceIndex]?.exercise.customName || items[pendingAdvanceIndex]?.exercise.libraryExercise?.name || null : null}
                      notificationPermission={notificationPermission}
                      notificationHint={notificationHint}
                      onEnableNotifications={requestNotifications}
                      onToggle={() => setRestRunning((current) => !current)}
                      onReset={() => {
                        setRestRemaining(restDuration)
                        restTimerEndAtRef.current = Date.now() + restDuration * 1000
                        setRestRunning(false)
                      }}
                      onPreset={(seconds) => {
                        setRestDuration(seconds)
                        setRestRemaining(seconds)
                        restTimerEndAtRef.current = Date.now() + seconds * 1000
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
                        <p className="text-sm font-semibold">Cerraste la sesion completa.</p>
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
                      className="min-h-10 rounded-full px-5"
                      onClick={() => setShowAddExercise(true)}
                      disabled={isAddingExercise}
                    >
                      <Plus className="mr-2 size-4" />
                      Agregar ejercicio
                    </Button>
                    <Button
                      type="submit"
                      name="afterSave"
                      value="home"
                      className="min-h-10 rounded-full px-5 sm:col-span-2"
                    >
                      Guardar y volver al inicio
                    </Button>
                    <Button
                      type="submit"
                      name="afterSave"
                      value="summary"
                      variant="outline"
                      className="min-h-10 rounded-full px-5"
                    >
                      Ver resumen de sesion
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

      {phase !== "complete" && !showAddExercise ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => setShowAddExercise(true)}
            disabled={isAddingExercise}
          >
            <Plus className="mr-2 size-4" />
            Agregar ejercicio
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setPanelOpen(true)}
          >
            <NotebookPen className="size-5" />
          </Button>
        </div>
      ) : null}

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
                        <p className="font-semibold">{getDisplayName(item.exercise)}</p>
                        <p className="text-muted-foreground">{getDisplayGroup(item.exercise)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tus ejercicios cerrados apareceran aqui.
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
                          {index + 1}. {getDisplayName(item.exercise)}
                        </p>
                        <p className="text-muted-foreground">{getDisplayGroup(item.exercise)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Estas entrando al tramo final de la sesion.</p>
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
