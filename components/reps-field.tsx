"use client"

import { Minus, Plus, RotateCcw } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type RepsFieldProps = {
  exerciseId: string
  value: string
  plannedValue: string | null
  onChange: (value: string) => void
}

function toNumericValue(value: string) {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : 0
}

export function RepsField({
  exerciseId,
  value,
  plannedValue,
  onChange
}: RepsFieldProps) {
  const numericValue = useMemo(() => toNumericValue(value), [value])

  return (
    <div className="grid gap-3">
      <div className="rounded-[1.2rem] border border-border/70 bg-background/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Reps
        </p>
        <p className="mt-2 font-display text-[2.65rem] leading-none">{numericValue}</p>
      </div>

      <div className="grid grid-cols-[1fr_1.25fr_1fr] gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-2xl"
          onClick={() => onChange(String(Math.max(0, numericValue - 1)))}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-2xl"
          onClick={() => onChange(String(numericValue + 1))}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-2xl"
          onClick={() => onChange(plannedValue || "0")}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <Input
        id={`reps-${exerciseId}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="12 / 10-8 / 45s"
      />
    </div>
  )
}
