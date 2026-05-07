import { Dumbbell } from "lucide-react"
import { ReactNode } from "react"

import { DesktopAlerts } from "@/components/desktop-alerts"
import { MobileShellControls } from "@/components/mobile-shell-controls"
import { ModeToggle } from "@/components/mode-toggle"
import { NavLink } from "@/components/nav-link"
import { UserMenu } from "@/components/user-menu"
import type { InAppAlert, User } from "@/lib/types"

type AppShellProps = {
  user: User
  alerts?: InAppAlert[]
  children: ReactNode
}

export function AppShell({ user, alerts = [], children }: AppShellProps) {
  return (
    <div className="page-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>

      <header className="topbar-shell">
        <div className="topbar-grid">
          <div className="flex min-w-0 items-center justify-between gap-3 md:block">
            <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Dumbbell className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Kinetik</p>
              <h1 className="truncate text-xl uppercase leading-none tracking-wide md:text-2xl">
                Gym Plan Control
              </h1>
              <p className="hidden text-xs text-muted-foreground md:block">
                Rutina, cargas e historial con tema claro y oscuro.
              </p>
            </div>
          </div>
            <MobileShellControls alerts={alerts} user={user} />
          </div>

          <nav
            className="hidden flex-wrap items-center gap-1 rounded-2xl border border-border/70 bg-card/75 p-1 md:flex"
            aria-label="Navegacion principal"
          >
            <NavLink href="/" label="Hoy" />
            <NavLink href="/historial" label="Historial" />
            {user.role === "admin" && (
              <NavLink href="/admin/usuarios" label="Admin" />
            )}
          </nav>

          <div className="hidden flex-col gap-2 lg:min-w-[340px] lg:items-end md:flex">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ModeToggle />
              <DesktopAlerts alerts={alerts} />
            </div>

            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main id="main-content" className="page-container">
        {children}
      </main>
    </div>
  )
}
