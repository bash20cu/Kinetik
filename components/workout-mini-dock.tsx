"use client"

import { LayoutPanelTop, Pause, Play, SkipForward } from "lucide-react"

import { Button } from "@/components/ui/button"

type WorkoutMiniDockProps = {
  phase: "exercise" | "record" | "rest" | "complete"
  onToggleRest: () => void
  onSkipRest: () => void
  restRunning: boolean
  onTogglePanel: () => void
}

export function WorkoutMiniDock({
  phase,
  onToggleRest,
  onSkipRest,
  restRunning,
  onTogglePanel
}: WorkoutMiniDockProps) {
  if (phase !== "rest") {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2">
      <div className="mx-auto max-w-xl rounded-[1.35rem] border border-border/70 bg-background/95 p-2 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.85)] backdrop-blur">
        <div className="flex items-stretch gap-2">
          <Button type="button" variant="outline" className="h-10 flex-1 rounded-xl px-3 text-sm" onClick={onTogglePanel}>
            <LayoutPanelTop className="size-4" />
            Panel
          </Button>
          <Button type="button" variant="secondary" className="h-10 flex-1 rounded-xl px-3 text-sm" onClick={onToggleRest}>
            {restRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
            {restRunning ? "Pausar" : "Reanudar"}
          </Button>
          <Button type="button" variant="outline" className="h-10 flex-1 rounded-xl px-3 text-sm" onClick={onSkipRest}>
            <SkipForward className="size-4" />
            Saltar
          </Button>
        </div>
      </div>
    </div>
  )
}
