import { Bell, Dumbbell, LogOut } from "lucide-react"
import { ReactNode } from "react"

import { logoutAction, markAlertReadAction } from "@/app/actions"
import { MobileShellControls } from "@/components/mobile-shell-controls"
import { ModeToggle } from "@/components/mode-toggle"
import { NavLink } from "@/components/nav-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { InAppAlert, User } from "@/lib/types"

type AppShellProps = {
  user: User
  alerts?: InAppAlert[]
  children: ReactNode
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

export function AppShell({ user, alerts = [], children }: AppShellProps) {
  const unreadCount = alerts.filter((alert) => !alert.readAt).length

  return (
    <div className="page-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>

      <header className="topbar-shell">
        <div className="topbar-grid">
          <div className="flex min-w-0 items-center justify-between gap-4 md:block">
            <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Dumbbell className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="eyebrow mb-1">Kinetik</p>
              <h1 className="truncate text-2xl uppercase leading-none tracking-wide">
                Gym Plan Control
              </h1>
              <p className="text-sm text-muted-foreground">
                Rutina, cargas e historial con tema claro y oscuro.
              </p>
            </div>
          </div>
            <MobileShellControls alerts={alerts} />
          </div>

          <nav
            className="hidden flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card/75 p-1 md:flex"
            aria-label="Navegacion principal"
          >
            <NavLink href="/" label="Hoy" />
            <NavLink href="/rutina" label="Rutina" />
            <NavLink href="/historial" label="Historial" />
            <NavLink href="/plan/importar" label="Importar plan" />
          </nav>

          <div className="hidden flex-col gap-3 lg:min-w-[340px] lg:items-end md:flex">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ModeToggle />
              <details className="group relative">
                <summary className="flex list-none cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-2 text-sm font-medium shadow-sm">
                  <Bell className="size-4" />
                  <span>Alertas</span>
                  <Badge variant={unreadCount > 0 ? "info" : "outline"}>{unreadCount}</Badge>
                </summary>
                <Card className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[22rem] max-w-[90vw] p-3 shadow-glow">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Notificaciones</p>
                      <p className="text-xs text-muted-foreground">
                        {unreadCount} pendientes
                      </p>
                    </div>
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
              </details>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="rounded-2xl border border-border/70 bg-card/75 px-4 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Cuenta activa
                </p>
                <p className="max-w-[220px] truncate text-sm font-medium">{user.email}</p>
              </div>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="size-4" />
                  Cerrar sesion
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="page-container">
        {children}
      </main>
    </div>
  )
}
