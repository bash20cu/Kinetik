"use client"

import { Plus, Sparkles, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EXERCISE_GROUPS, EXERCISE_LIBRARY, VARIANT_OPTIONS } from "@/lib/workout-presets"

const CUSTOM_EXERCISE_VALUE = "__custom__"
const MAX_EXERCISES = 3

type DraftExercise = {
  id: string
  name: string
  groupName: string
  variant: string
  plannedSets: string
  plannedReps: string
  notes: string
}

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

function createExercise(): DraftExercise {
  return {
    id: createId(),
    name: "",
    groupName: "",
    variant: "",
    plannedSets: "",
    plannedReps: "",
    notes: ""
  }
}

function getExerciseSelectValue(name: string) {
  if (!name) {
    return ""
  }

  return EXERCISE_LIBRARY.some((exercise) => exercise.name === name) ? name : CUSTOM_EXERCISE_VALUE
}

type FreeWorkoutBuilderProps = {
  action: (formData: FormData) => void | Promise<void>
}

export function FreeWorkoutBuilder({ action }: FreeWorkoutBuilderProps) {
  const [workoutName, setWorkoutName] = useState("Entrenamiento libre")
  const [exercises, setExercises] = useState<DraftExercise[]>([createExercise()])

  const payload = useMemo(
    () =>
      JSON.stringify({
        name: workoutName,
        exercises: exercises.map((exercise) => ({
          name: exercise.name,
          groupName: exercise.groupName,
          variant: exercise.variant,
          plannedSets: exercise.plannedSets ? Number(exercise.plannedSets) : null,
          plannedReps: exercise.plannedReps,
          notes: exercise.notes
        }))
      }),
    [exercises, workoutName]
  )

  function updateExercise(exerciseId: string, field: keyof DraftExercise, value: string) {
    setExercises((current) =>
      current.map((exercise) => (exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise))
    )
  }

  function updateExerciseName(exerciseId: string, value: string) {
    const selectedExercise = EXERCISE_LIBRARY.find((exercise) => exercise.name === value)

    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise
        }

        if (value === CUSTOM_EXERCISE_VALUE) {
          return {
            ...exercise,
            name: EXERCISE_LIBRARY.some((item) => item.name === exercise.name) ? "" : exercise.name
          }
        }

        if (!selectedExercise) {
          return { ...exercise, name: value }
        }

        return {
          ...exercise,
          name: selectedExercise.name,
          groupName: selectedExercise.groupName
        }
      })
    )
  }

  function addExercise() {
    setExercises((current) => (current.length >= MAX_EXERCISES ? current : [...current, createExercise()]))
  }

  function removeExercise(exerciseId: string) {
    setExercises((current) =>
      current.length > 1 ? current.filter((exercise) => exercise.id !== exerciseId) : current
    )
  }

  return (
    <form action={action} className="panel-grid">
      <input type="hidden" name="payload" value={payload} />

      <Card className="hero-panel">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <CardTitle className="text-4xl">Entrenamiento libre</CardTitle>
              <CardDescription className="text-base">
                Elige de 1 a 3 ejercicios, entra directo a la sesion y guarda esta base para repetirla.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="workoutName" className="text-sm font-semibold">
              Nombre del entrenamiento
            </label>
            <Input
              id="workoutName"
              value={workoutName}
              onChange={(event) => setWorkoutName(event.target.value)}
              placeholder="Ej. Push rapido / Upper express"
            />
          </div>
        </CardContent>
      </Card>

      {exercises.map((exercise, index) => (
        <Card key={exercise.id} className="glass-card">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Inicio rapido</p>
                <CardTitle className="text-2xl">Ejercicio {index + 1}</CardTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => removeExercise(exercise.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ejercicio
              </label>
              <select
                value={getExerciseSelectValue(exercise.name)}
                onChange={(event) => updateExerciseName(exercise.id, event.target.value)}
                className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

            {getExerciseSelectValue(exercise.name) === CUSTOM_EXERCISE_VALUE ? (
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Nombre personalizado
                </label>
                <Input
                  value={exercise.name}
                  onChange={(event) => updateExercise(exercise.id, "name", event.target.value)}
                  placeholder="Ej. Farmer walk"
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Grupo muscular
              </label>
              <Input
                value={exercise.groupName}
                onChange={(event) => updateExercise(exercise.id, "groupName", event.target.value)}
                placeholder="Grupo muscular"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Variante / implemento
              </label>
              <select
                value={exercise.variant}
                onChange={(event) => updateExercise(exercise.id, "variant", event.target.value)}
                className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Sin especificar</option>
                {VARIANT_OPTIONS.map((variant) => (
                  <option key={variant} value={variant}>
                    {variant}
                  </option>
                ))}
              </select>
            </div>

            <Input
              value={exercise.plannedSets}
              onChange={(event) => updateExercise(exercise.id, "plannedSets", event.target.value)}
              placeholder="Sets"
              type="number"
              min="0"
            />
            <Input
              value={exercise.plannedReps}
              onChange={(event) => updateExercise(exercise.id, "plannedReps", event.target.value)}
              placeholder="Reps / tiempo"
            />
            <Textarea
              value={exercise.notes}
              onChange={(event) => updateExercise(exercise.id, "notes", event.target.value)}
              placeholder="Notas rapidas"
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={addExercise}
          disabled={exercises.length >= MAX_EXERCISES}
        >
          <Plus className="size-4" />
          Agregar ejercicio
        </Button>
        <Button type="submit" className="rounded-full px-6">
          Crear y empezar
        </Button>
      </div>
    </form>
  )
}
