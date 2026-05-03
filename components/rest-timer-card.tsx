"use client"

import { Pause, Play, RotateCcw, TimerReset } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const PRESETS = [30, 60, 90, 120]

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

type RestTimerCardProps = {
  duration: number
  remaining: number
  running: boolean
  visible?: boolean
  onToggle: () => void
  onReset: () => void
  onPreset: (seconds: number) => void
}

export function RestTimerCard({
  duration,
  remaining,
  running,
  visible = true,
  onToggle,
  onReset,
  onPreset
}: RestTimerCardProps) {

  const progress = useMemo(() => {
    if (duration <= 0) return 0
    return Math.max(0, Math.min(100, ((duration - remaining) / duration) * 100))
  }, [duration, remaining])

  return (
    <Card className={cn("glass-card overflow-hidden transition-all", !visible && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Rest timer</p>
            <CardTitle className="text-3xl">Descanso</CardTitle>
          </div>
          <TimerReset className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
          <p className="font-display text-6xl leading-none tracking-wide">{formatTime(remaining)}</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((seconds) => (
            <Button
              key={seconds}
              type="button"
              variant={duration === seconds ? "default" : "outline"}
              onClick={() => onPreset(seconds)}
              className="rounded-2xl"
            >
              {seconds}s
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onToggle}
            className="rounded-2xl"
          >
            {running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {running ? "Pausar" : "Iniciar"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset} className="rounded-2xl">
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl border border-border/70 px-3 text-sm font-medium",
              running ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"
            )}
          >
            {running ? "Corriendo" : "En espera"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
