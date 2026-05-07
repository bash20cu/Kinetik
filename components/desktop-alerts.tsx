"use client"

import { Bell, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { markAlertReadAction } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { InAppAlert } from "@/lib/types"

type DesktopAlertsProps = {
  alerts: InAppAlert[]
}

function alertVariant(type: InAppAlert["type"]) {
  switch (type) {
    case "success":
      return "success"
    case "warning":
      return "warning"
    case "error":
      return "error"
    default:
      return "info"
  }
}

export function DesktopAlerts({ alerts }: DesktopAlertsProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => setOpen(false), [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, handleClose])

  const unreadCount = alerts.filter((alert) => !alert.readAt).length

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm font-medium shadow-sm"
      >
        <Bell className="size-4" />
        <span>Alertas</span>
        <Badge variant={unreadCount > 0 ? "info" : "outline"}>{unreadCount}</Badge>
      </button>

      {open ? (
        <Card className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[22rem] max-w-[90vw] p-3 shadow-glow">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Notificaciones</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount} pendientes
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-full"
              onClick={handleClose}
            >
              <X className="size-3" />
            </Button>
          </div>

          <div className="grid gap-2">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
                No tienes alertas activas.
              </div>
            ) : (
              alerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-border/70 bg-muted/30 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={alertVariant(alert.type)}>{alert.type}</Badge>
                    {alert.readAt ? (
                      <span className="text-xs text-muted-foreground">Leida</span>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
                  {!alert.readAt ? (
                    <form action={markAlertReadAction} className="mt-3">
                      <input type="hidden" name="alertId" value={alert.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Marcar leida
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
