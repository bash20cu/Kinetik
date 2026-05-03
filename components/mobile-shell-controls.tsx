"use client"

import { Bell, Menu, X } from "lucide-react"
import { useState } from "react"

import { markAlertReadAction } from "@/app/actions"
import { ModeToggle } from "@/components/mode-toggle"
import { NavLink } from "@/components/nav-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { InAppAlert } from "@/lib/types"

type MobileShellControlsProps = {
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

export function MobileShellControls({ alerts }: MobileShellControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const unreadCount = alerts.filter((alert) => !alert.readAt).length

  return (
    <div className="flex items-center gap-2 md:hidden">
      <ModeToggle />

      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Mostrar alertas"
          onClick={() => setAlertsOpen((current) => !current)}
          className="rounded-full"
        >
          <Bell className="size-4" />
        </Button>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount}
          </span>
        ) : null}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
        onClick={() => setMenuOpen((current) => !current)}
        className="rounded-full"
      >
        {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {alertsOpen ? (
        <Card className="absolute left-4 right-4 top-[5.2rem] z-40 p-3 shadow-glow">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Notificaciones</p>
              <p className="text-xs text-muted-foreground">{unreadCount} pendientes</p>
            </div>
          </div>
          <div className="grid gap-2">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
                No tienes alertas activas.
              </div>
            ) : (
              alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={alertVariant(alert.type)}>{alert.type}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
                  {!alert.readAt ? (
                    <form action={markAlertReadAction} className="mt-3">
                      <input type="hidden" name="alertId" value={alert.id} />
                      <Button type="submit" variant="ghost" size="sm" onClick={() => setAlertsOpen(false)}>
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

      {menuOpen ? (
        <Card className="absolute left-4 right-4 top-[5.2rem] z-40 p-3 shadow-glow">
          <nav className="grid gap-2" aria-label="Navegacion movil">
            <div onClick={() => setMenuOpen(false)}>
              <NavLink href="/" label="Hoy" />
            </div>
            <div onClick={() => setMenuOpen(false)}>
              <NavLink href="/rutina" label="Rutina" />
            </div>
            <div onClick={() => setMenuOpen(false)}>
              <NavLink href="/historial" label="Historial" />
            </div>
            <div onClick={() => setMenuOpen(false)}>
              <NavLink href="/plan/importar" label="Importar plan" />
            </div>
          </nav>
        </Card>
      ) : null}
    </div>
  )
}
