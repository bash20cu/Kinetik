"use client"

import { LogOut, Settings } from "lucide-react"
import { useState } from "react"

import { logoutAction } from "@/app/actions"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import type { User } from "@/lib/types"

type UserMenuProps = {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  return (
    <>
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent/50">
          <Avatar email={user.email} size="sm" />
          <span className="max-w-[140px] truncate font-medium">{user.email}</span>
        </summary>
        <Card className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-64 overflow-hidden p-0 shadow-glow">
          <div className="border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar email={user.email} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.email}</p>
                <Badge variant={user.role === "admin" ? "default" : "outline"} className="mt-1 text-[10px]">
                  {user.role === "admin" ? "Administrador" : "Usuario"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="p-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Settings className="size-4" />
              Cambiar contrasena
            </button>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 px-3 py-2">
                <LogOut className="size-4" />
                Cerrar sesion
              </Button>
            </form>
          </div>
        </Card>
      </details>

      <ChangePasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
    </>
  )
}
