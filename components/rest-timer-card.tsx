"use client"

import { Bell, Pause, Play, SkipForward, TimerReset } from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  nextLabel: string | null
  notificationPermission: NotificationPermission | "unsupported"
  notificationHint: string
  onEnableNotifications: () => void
  onToggle: () => void
  onReset: () => void
  onPreset: (seconds: number) => void
  onSkip: () => void
}

export function RestTimerCard({
  duration,
  remaining,
  running,
  nextLabel,
  notificationPermission,
  notificationHint,
  onEnableNotifications,
  onToggle,
  onReset,
  onPreset,
  onSkip
}: RestTimerCardProps) {
  const progress = useMemo(() => {
    if (duration <= 0) return 0
    return Math.max(0, Math.min(100, ((duration - remaining) / duration) * 100))
  }, [duration, remaining])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-border/70 bg-card/96 p-3.5 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.9)] backdrop-blur md:rounded-[2rem] md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Descanso</p>
          <h3 className="text-[1.8rem] uppercase leading-none md:text-5xl">Recupera</h3>
          <p className="mt-2 max-h-8 max-w-xl overflow-hidden text-xs text-muted-foreground md:mt-3 md:max-h-none md:text-sm">
            {nextLabel
              ? `Cuando termine el reloj, te llevo a ${nextLabel}.`
              : "Cuando termine el reloj, cerramos la rutina y celebramos el avance."}
          </p>
        </div>
        <Badge variant={running ? "warning" : "outline"}>
          {running ? "corriendo" : "en pausa"}
        </Badge>
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-primary/15 bg-primary/5 p-4 md:mt-6 md:rounded-[1.75rem] md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
          Tiempo restante
        </p>
        <p className="mt-2 text-[4.5rem] font-semibold leading-none tracking-tight md:mt-3 md:text-7xl">{formatTime(remaining)}</p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted md:mt-5 md:h-3">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:mt-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((seconds) => (
            <Button
              key={seconds}
              type="button"
              variant={duration === seconds ? "default" : "outline"}
              onClick={() => onPreset(seconds)}
              className="h-10 rounded-[0.95rem] px-2 text-sm md:rounded-2xl"
            >
              {seconds}s
            </Button>
          ))}
        </div>

        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-[1rem] border px-3 py-2 text-xs md:rounded-[1.35rem] md:px-4 md:py-3 md:text-sm",
            notificationPermission === "granted"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border/70 bg-background/70 text-muted-foreground"
          )}
        >
          <span className="min-w-0">
            {notificationPermission === "granted"
              ? "Notificaciones activas."
              : notificationHint || "Activa aviso del sistema si tu navegador lo permite."}
          </span>
          {notificationPermission === "default" ? (
            <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 rounded-full px-3 text-xs" onClick={onEnableNotifications}>
              <Bell className="size-3.5" />
              Activar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-4 md:mt-5 md:pt-0">
        <Button type="button" variant="secondary" onClick={onToggle} className="min-h-10 rounded-[1rem] px-2 text-xs md:min-h-12 md:rounded-2xl md:text-sm">
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pausar" : "Reanudar"}
        </Button>
        <Button type="button" variant="outline" onClick={onReset} className="min-h-10 rounded-[1rem] px-2 text-xs md:min-h-12 md:rounded-2xl md:text-sm">
          <TimerReset className="size-4" />
          Reiniciar
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip} className="min-h-10 rounded-[1rem] px-2 text-xs md:min-h-12 md:rounded-2xl md:text-sm">
          <SkipForward className="size-4" />
          Seguir ya
        </Button>
      </div>
    </div>
  )
}
