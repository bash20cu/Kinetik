"use client"

import { ArrowLeft, ArrowRight, Dumbbell, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { createSessionLogAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { InAppAlert } from "@/lib/types"

type SelectedExercise = {
  exerciseId?: string | null
  customName?: string | null
  groupName: string
  plannedSets?: number | null
  plannedReps?: string | null
  displayGroup: string
  displayName: string
}

type SessionCreationPageProps = {
  user: { id: string; email: string; createdAt: string }
  alerts: InAppAlert[]
  exerciseGroups: Record<string, { name: string; groupName: string; id?: string; defaultSets: number; defaultReps: string }[]>
}

export function SessionCreationFlow({ user, alerts, exerciseGroups }: SessionCreationPageProps) {
  const [selected, setSelected] = useState<SelectedExercise[]>([])
  const [showSelector, setShowSelector] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customGroup, setCustomGroup] = useState("")
  const [customSets, setCustomSets] = useState("3")
  const [customReps, setCustomReps] = useState("10")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function addFromLibrary(groupName: string, exerciseName: string) {
    const group = exerciseGroups[groupName]
    const exercise = group?.find((ex) => ex.name === exerciseName)
    if (!group) return

    setSelected((prev) => [
      ...prev,
      {
        exerciseId: exercise?.id || null,
        customName: null,
        groupName,
        displayGroup: groupName,
        displayName: exerciseName,
        plannedSets: exercise?.defaultSets ?? 3,
        plannedReps: exercise?.defaultReps ?? "10"
      }
    ])
    setShowSelector(false)
  }

  function addCustom() {
    if (!customName.trim()) return

    setSelected((prev) => [
      ...prev,
      {
        groupName: customGroup || "Libre",
        customName: customName.trim(),
        displayGroup: customGroup || "Libre",
        displayName: customName.trim(),
        plannedSets: parseInt(customSets) || 3,
        plannedReps: customReps || "10"
      }
    ])

    setCustomName("")
    setCustomGroup("")
    setCustomSets("3")
    setCustomReps("10")
    setShowSelector(false)
  }

  function removeExercise(index: number) {
    setSelected((prev) => prev.filter((_, i) => i !== index))
  }

  function moveExercise(index: number, direction: "up" | "down") {
    if ((direction === "up" && index === 0) || (direction === "down" && index === selected.length - 1)) return
    const next = [...selected]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    setSelected(next)
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      for (let i = 0; i < selected.length; i++) {
        const ex = selected[i]
        formData.set(`exercise-${i}`, JSON.stringify({
          exerciseId: ex.exerciseId || null,
          customName: ex.customName || null,
          groupName: ex.groupName,
          plannedSets: ex.plannedSets,
          plannedReps: ex.plannedReps
        }))
      }
      await createSessionLogAction(formData)
    } catch {
      setIsSubmitting(false)
    }
  }

  if (selected.length === 0 && !showSelector) {
    return (
      <AppShell user={user} alerts={alerts}>
        <div className="mb-6">
          <p className="eyebrow">Empezar entreno</p>
          <h2 className="page-heading">Nueva sesion</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Elige los ejercicios que vas a hacer hoy. Puedes agregar mas durante la sesion.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Arma tu sesion</CardTitle>
            <CardDescription>
              Selecciona ejercicios de la libreria o crea uno personalizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-8 text-center">
                <Dumbbell className="mx-auto mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm font-medium">Sin ejercicios todavia</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Empieza agregando ejercicios para crear tu sesion.
                </p>
                <Button
                  onClick={() => setShowSelector(true)}
                  className="mt-4 rounded-full"
                >
                  <Plus className="mr-2 size-4" />
                  Agregar ejercicio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  if (showSelector) {
    return (
      <AppShell user={user} alerts={alerts}>
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setShowSelector(false)}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Elegir ejercicio</h2>
            <p className="text-sm text-muted-foreground">De la libreria o personalizado</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personalizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-1.5">
                <label className="text-xs text-muted-foreground">Nombre del ejercicio</label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej. Farmer walk"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Grupo</label>
                  <Input
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                    placeholder="Libre"
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Sets</label>
                  <Input
                    type="number"
                    min="1"
                    value={customSets}
                    onChange={(e) => setCustomSets(e.target.value)}
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Reps</label>
                  <Input
                    value={customReps}
                    onChange={(e) => setCustomReps(e.target.value)}
                    placeholder="10"
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={addCustom}
                disabled={!customName.trim()}
                className="w-full rounded-full"
              >
                Agregar personalizado
              </Button>
            </CardContent>
          </Card>

          {Object.entries(exerciseGroups).map(([groupName, exercises]) => (
            <Card key={groupName} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{groupName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {exercises.map((exercise) => (
                    <Button
                      key={exercise.name}
                      variant="outline"
                      size="sm"
                      className="h-auto justify-start rounded-xl px-3 py-2 text-sm font-normal"
                      onClick={() => addFromLibrary(groupName, exercise.name)}
                    >
                      {exercise.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setShowSelector(true)}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Tu sesion</h2>
          <p className="text-sm text-muted-foreground">{selected.length} ejercicio{selected.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <form action={handleSubmit}>
        <div className="space-y-2">
          {selected.map((exercise, index) => (
            <Card key={index} className="glass-card">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-full"
                      onClick={() => moveExercise(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowLeft className="size-3 rotate-90" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-full"
                      onClick={() => moveExercise(index, "down")}
                      disabled={index === selected.length - 1}
                    >
                      <ArrowRight className="size-3 rotate-90" />
                    </Button>
                  </div>

                    <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{index + 1}.</span>
                      <p className="font-semibold truncate">{exercise.displayName}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{exercise.displayGroup}</Badge>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 rounded-full"
                    onClick={() => removeExercise(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => setShowSelector(true)}
          >
            <Plus className="mr-2 size-4" />
            Agregar
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-full"
            disabled={isSubmitting}
          >
            Empezar sesion
          </Button>
        </div>
      </form>
    </AppShell>
  )
}
