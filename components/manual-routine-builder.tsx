"use client"

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RoutinePlan } from "@/lib/types";

const CUSTOM_EXERCISE_VALUE = "__custom__";
const WEEKDAY_OPTIONS = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo"
] as const;

const EXERCISE_LIBRARY = [
  { name: "Press plano", groupName: "Pecho" },
  { name: "Press inclinado", groupName: "Pecho" },
  { name: "Press declinado", groupName: "Pecho" },
  { name: "Aperturas", groupName: "Pecho" },
  { name: "Push ups", groupName: "Pecho" },
  { name: "Cross over", groupName: "Pecho" },
  { name: "Pull over", groupName: "Pecho" },
  { name: "Dominadas", groupName: "Espalda" },
  { name: "Jalon abierto", groupName: "Espalda" },
  { name: "Jalon cerrado", groupName: "Espalda" },
  { name: "Remo barra", groupName: "Espalda" },
  { name: "Remo mancuerna", groupName: "Espalda" },
  { name: "Remo polea", groupName: "Espalda" },
  { name: "Remo maquina", groupName: "Espalda" },
  { name: "Remo T maquina", groupName: "Espalda" },
  { name: "Remo banca declinada", groupName: "Espalda" },
  { name: "Sentadilla", groupName: "Pierna" },
  { name: "Sentadilla bulgara", groupName: "Pierna" },
  { name: "Press de pierna", groupName: "Pierna" },
  { name: "Extension de rodilla", groupName: "Pierna" },
  { name: "Peso muerto", groupName: "Pierna" },
  { name: "Flexion de rodilla", groupName: "Pierna" },
  { name: "Elevacion de cadera", groupName: "Pierna" },
  { name: "Extension cadera", groupName: "Pierna" },
  { name: "Aductores/Abductores", groupName: "Pierna" },
  { name: "Zancada", groupName: "Pierna" },
  { name: "Sentadilla sissy", groupName: "Pierna" },
  { name: "Press frances", groupName: "Triceps" },
  { name: "Press cerrado", groupName: "Triceps" },
  { name: "Patada de mula", groupName: "Triceps" },
  { name: "Extension polea", groupName: "Triceps" },
  { name: "Copa", groupName: "Triceps" },
  { name: "Fondos", groupName: "Triceps" },
  { name: "Diamond push ups", groupName: "Triceps" },
  { name: "Flexion barra", groupName: "Biceps" },
  { name: "Curl mancuerna", groupName: "Biceps" },
  { name: "Flexion Scott", groupName: "Biceps" },
  { name: "Flexion polea", groupName: "Biceps" },
  { name: "Flexion cuclillas", groupName: "Biceps" },
  { name: "Curl martillo", groupName: "Biceps" },
  { name: "Curl spider", groupName: "Biceps" },
  { name: "Curl 21", groupName: "Biceps" },
  { name: "Curl dragon", groupName: "Biceps" },
  { name: "Press militar", groupName: "Hombros" },
  { name: "Press militar cerrado", groupName: "Hombros" },
  { name: "Elevacion lateral", groupName: "Hombros" },
  { name: "Elevacion frontal", groupName: "Hombros" },
  { name: "Elevacion posterior", groupName: "Hombros" },
  { name: "Rowing", groupName: "Hombros" },
  { name: "Face pull", groupName: "Hombros" },
  { name: "Crunches", groupName: "Core" },
  { name: "Lumbares", groupName: "Core" },
  { name: "Oblicuos", groupName: "Core" },
  { name: "Elevacion pierna", groupName: "Core" },
  { name: "Flexion tronco cruzado", groupName: "Core" },
  { name: "Tijeras", groupName: "Core" },
  { name: "Plancha", groupName: "Core" },
  { name: "Ab roller", groupName: "Core" },
  { name: "Abs paquete", groupName: "Core" }
] as const;

const EXERCISE_GROUPS = EXERCISE_LIBRARY.reduce<Record<string, string[]>>((groups, exercise) => {
  if (!groups[exercise.groupName]) {
    groups[exercise.groupName] = [];
  }

  groups[exercise.groupName].push(exercise.name);
  return groups;
}, {});

type DraftExercise = {
  id: string;
  name: string;
  groupName: string;
  variant: string;
  plannedSets: string;
  plannedReps: string;
  notes: string;
};

type DraftBlock = {
  id: string;
  name: string;
  exercises: DraftExercise[];
};

type DraftDay = {
  id: string;
  name: string;
  blocks: DraftBlock[];
};

type ManualRoutineBuilderProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialPlan?: RoutinePlan | null;
  submitLabel?: string;
  intro?: string;
};

function createId() {
  return Math.random().toString(36).slice(2, 10);
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
  };
}

function createBlock(): DraftBlock {
  return {
    id: createId(),
    name: "Bloque 1",
    exercises: [createExercise()]
  };
}

function createDay(index: number): DraftDay {
  return {
    id: createId(),
    name: WEEKDAY_OPTIONS[(index - 1) % WEEKDAY_OPTIONS.length] ?? `Dia ${index}`,
    blocks: [createBlock()]
  };
}

function getExerciseSelectValue(name: string) {
  if (!name) {
    return "";
  }

  return EXERCISE_LIBRARY.some((exercise) => exercise.name === name)
    ? name
    : CUSTOM_EXERCISE_VALUE;
}

function draftFromPlan(plan: RoutinePlan): DraftDay[] {
  return plan.days.map((day) => ({
    id: createId(),
    name: day.name,
    blocks: day.blocks.map((block) => ({
      id: createId(),
      name: block.name,
      exercises: block.exercises.map((exercise) => ({
        id: createId(),
        name: exercise.name,
        groupName: exercise.groupName,
        variant: exercise.variant ?? "",
        plannedSets: exercise.plannedSets?.toString() ?? "",
        plannedReps: exercise.plannedReps ?? "",
        notes: exercise.notes ?? ""
      }))
    }))
  }));
}

export function ManualRoutineBuilder({
  action,
  initialPlan = null,
  submitLabel = "Guardar rutina",
  intro = "Crea dias, bloques y ejercicios. Al guardar, este plan pasa a ser el activo."
}: ManualRoutineBuilderProps) {
  const [planName, setPlanName] = useState(initialPlan?.name ?? "Mi rutina");
  const [days, setDays] = useState<DraftDay[]>(
    initialPlan ? draftFromPlan(initialPlan) : [createDay(1)]
  );

  const payload = useMemo(() => {
    return JSON.stringify({
      days: days.map((day, dayIndex) => ({
        name: day.name,
        dayOrder: dayIndex + 1,
        blocks: day.blocks.map((block, blockIndex) => ({
          name: block.name,
          blockOrder: blockIndex + 1,
          exercises: block.exercises.map((exercise) => ({
            name: exercise.name,
            groupName: exercise.groupName,
            variant: exercise.variant,
            plannedSets: exercise.plannedSets ? Number(exercise.plannedSets) : null,
            plannedReps: exercise.plannedReps,
            notes: exercise.notes
          }))
        }))
      }))
    });
  }, [days]);

  function updateDay(dayId: string, field: keyof DraftDay, value: string) {
    setDays((current) =>
      current.map((day) => (day.id === dayId ? { ...day, [field]: value } : day))
    );
  }

  function updateBlock(dayId: string, blockId: string, value: string) {
    setDays((current) =>
      current.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block) =>
                block.id === blockId ? { ...block, name: value } : block
              )
            }
      )
    );
  }

  function updateExercise(
    dayId: string,
    blockId: string,
    exerciseId: string,
    field: keyof DraftExercise,
    value: string
  ) {
    setDays((current) =>
      current.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block) =>
                block.id !== blockId
                  ? block
                  : {
                      ...block,
                      exercises: block.exercises.map((exercise) =>
                        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
                      )
                    }
              )
            }
      )
    );
  }

  function updateExerciseName(dayId: string, blockId: string, exerciseId: string, value: string) {
    const selectedExercise = EXERCISE_LIBRARY.find((exercise) => exercise.name === value);

    setDays((current) =>
      current.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block) =>
                block.id !== blockId
                  ? block
                  : {
                      ...block,
                      exercises: block.exercises.map((exercise) => {
                        if (exercise.id !== exerciseId) {
                          return exercise;
                        }

                        if (value === CUSTOM_EXERCISE_VALUE) {
                          return {
                            ...exercise,
                            name: EXERCISE_LIBRARY.some((item) => item.name === exercise.name)
                              ? ""
                              : exercise.name
                          };
                        }

                        if (!selectedExercise) {
                          return { ...exercise, name: value };
                        }

                        return {
                          ...exercise,
                          name: selectedExercise.name,
                          groupName: selectedExercise.groupName
                        };
                      })
                    }
              )
            }
      )
    );
  }

  function addDay() {
    setDays((current) => [...current, createDay(current.length + 1)]);
  }

  function removeDay(dayId: string) {
    setDays((current) => (current.length > 1 ? current.filter((day) => day.id !== dayId) : current));
  }

  function addBlock(dayId: string) {
    setDays((current) =>
      current.map((day) =>
        day.id === dayId
          ? {
              ...day,
              blocks: [...day.blocks, { ...createBlock(), name: `Bloque ${day.blocks.length + 1}` }]
            }
          : day
      )
    );
  }

  function removeBlock(dayId: string, blockId: string) {
    setDays((current) =>
      current.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              blocks:
                day.blocks.length > 1
                  ? day.blocks.filter((block) => block.id !== blockId)
                  : day.blocks
            }
      )
    );
  }

  function addExercise(dayId: string, blockId: string) {
    setDays((current) =>
      current.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block) =>
                block.id === blockId
                  ? { ...block, exercises: [...block.exercises, createExercise()] }
                  : block
              )
            }
      )
    );
  }

  function removeExercise(dayId: string, blockId: string, exerciseId: string) {
    setDays((current) =>
      current.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block) =>
                block.id !== blockId
                  ? block
                  : {
                      ...block,
                      exercises:
                        block.exercises.length > 1
                          ? block.exercises.filter((exercise) => exercise.id !== exerciseId)
                          : block.exercises
                    }
              )
            }
      )
    );
  }

  return (
    <form action={action} className="panel-grid">
      <input type="hidden" name="payload" value={payload} />
      {initialPlan ? <input type="hidden" name="planId" value={initialPlan.id} /> : null}

      <Card className="hero-panel">
        <CardHeader>
          <CardTitle className="text-4xl">Creador de rutina</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="planName" className="text-sm font-semibold">
              Nombre del plan
            </label>
            <Input
              id="planName"
              name="planName"
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              placeholder="Ej. Rutina fuerza mayo"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" className="rounded-full" onClick={addDay}>
              <Plus className="size-4" />
              Agregar dia
            </Button>
            <p className="text-sm text-muted-foreground">
              {intro}
            </p>
          </div>
        </CardContent>
      </Card>

      {days.map((day) => (
        <Card key={day.id} className="glass-card">
          <CardHeader className="border-b border-border/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold">Nombre del dia</label>
                <select
                  value={day.name}
                  onChange={(event) => updateDay(day.id, "name", event.target.value)}
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {WEEKDAY_OPTIONS.map((weekday) => (
                    <option key={weekday} value={weekday}>
                      {weekday}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={() => removeDay(day.id)}
              >
                <Trash2 className="size-4" />
                Quitar dia
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6">
            {day.blocks.map((block, blockIndex) => (
              <div key={block.id} className="rounded-[1.5rem] border border-border/70 bg-background/60 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-semibold">Bloque</label>
                    <Input
                      value={block.name}
                      onChange={(event) => updateBlock(day.id, block.id, event.target.value)}
                      placeholder={`Bloque ${blockIndex + 1}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => removeBlock(day.id, block.id)}
                  >
                    <Trash2 className="size-4" />
                    Quitar bloque
                  </Button>
                </div>

                <div className="grid gap-4">
                  {block.exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="rounded-[1.25rem] border border-border/70 bg-card/80 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Ejercicio
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full"
                          onClick={() => removeExercise(day.id, block.id, exercise.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Ejercicio
                          </label>
                          <select
                            value={getExerciseSelectValue(exercise.name)}
                            onChange={(event) =>
                              updateExerciseName(day.id, block.id, exercise.id, event.target.value)
                            }
                            className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Selecciona un ejercicio</option>
                            {Object.entries(EXERCISE_GROUPS).map(([groupName, exercises]) => (
                              <optgroup key={groupName} label={groupName}>
                                {exercises.map((exerciseName) => (
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
                              onChange={(event) =>
                                updateExercise(day.id, block.id, exercise.id, "name", event.target.value)
                              }
                              placeholder="Ej. Farmer walk"
                            />
                          </div>
                        ) : null}
                        <Input
                          value={exercise.groupName}
                          onChange={(event) =>
                            updateExercise(day.id, block.id, exercise.id, "groupName", event.target.value)
                          }
                          placeholder="Grupo muscular"
                        />
                        <Input
                          value={exercise.variant}
                          onChange={(event) =>
                            updateExercise(day.id, block.id, exercise.id, "variant", event.target.value)
                          }
                          placeholder="Variante / maquina"
                        />
                        <Input
                          value={exercise.plannedSets}
                          onChange={(event) =>
                            updateExercise(day.id, block.id, exercise.id, "plannedSets", event.target.value)
                          }
                          placeholder="Sets"
                          type="number"
                          min="0"
                        />
                        <Input
                          value={exercise.plannedReps}
                          onChange={(event) =>
                            updateExercise(day.id, block.id, exercise.id, "plannedReps", event.target.value)
                          }
                          placeholder="Reps / tiempo"
                        />
                        <Textarea
                          value={exercise.notes}
                          onChange={(event) =>
                            updateExercise(day.id, block.id, exercise.id, "notes", event.target.value)
                          }
                          placeholder="Notas del ejercicio"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => addExercise(day.id, block.id)}
                  >
                    <Plus className="size-4" />
                    Agregar ejercicio
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                onClick={() => addBlock(day.id)}
              >
                <Plus className="size-4" />
                Agregar bloque
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full px-6">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
