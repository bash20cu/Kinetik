"use client"

import { Minus, Plus, RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type RepsFieldProps = {
  exerciseId: string
  defaultValue: string
  plannedValue: string | null
  disabled?: boolean
}

function toNumericValue(value: string) {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : 0
}

export function RepsField({
  exerciseId,
  defaultValue,
  plannedValue,
  disabled = false
}: RepsFieldProps) {
  const initial = defaultValue || plannedValue || ""
  const [value, setValue] = useState(initial)

  const numericValue = useMemo(() => toNumericValue(value), [value])

  return (
    <div className="grid gap-3">
      <div className="rounded-[1.35rem] border border-border/70 bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Reps
        </p>
        <p className="mt-2 font-display text-5xl leading-none">{numericValue}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          disabled={disabled}
          onClick={() => setValue(String(Math.max(0, numericValue - 1)))}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="rounded-2xl"
          disabled={disabled}
          onClick={() => setValue(String(numericValue + 1))}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-2xl"
          disabled={disabled}
          onClick={() => setValue(plannedValue || "0")}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <Input
        id={`reps-${exerciseId}`}
        name={`reps-${exerciseId}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="12 / 10-8 / 45s"
        disabled={disabled}
      />
    </div>
  )
}
