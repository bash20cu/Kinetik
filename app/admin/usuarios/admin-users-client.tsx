"use client"

import { useState } from "react"
import { formatDate } from "@/lib/dates"
import type { AdminUser, InAppAlert, User } from "@/lib/types"

import { deleteManagedUserAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { Dialog } from "@/components/ui/dialog"
import { UserFormDialog } from "@/components/user-form-dialog"

type AdminUsersClientProps = {
  user: User
  alerts: InAppAlert[]
  users: AdminUser[]
  currentUserId: string
}

export function AdminUsersClient({ user, alerts, users: initialUsers, currentUserId }: AdminUsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteUserId) return
    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.set("userId", deleteUserId)
      await deleteManagedUserAction(formData)
      setUsers((prev) => prev.filter((u) => u.id !== deleteUserId))
      setDeleteUserId(null)
    } catch {
      // error handled by server action
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCreateSuccess() {
    setCreateOpen(false)
    window.location.reload()
  }

  function handleEditSuccess() {
    setEditUser(null)
    window.location.reload()
  }

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Administracion</p>
          <h2 className="page-heading">Usuarios</h2>
          <p className="mt-2 text-muted-foreground">
            {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="shrink-0 rounded-full"
        >
          Crear usuario
        </Button>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3 flex-1">
                  <Avatar email={u.email} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{u.email}</p>
                      <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-[10px]">
                        {u.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Creado el {formatDate(new Date(u.createdAt), "es-CR", { day: "2-digit", month: "short", year: "numeric" })}
                      {" · "}
                      {u.sessionCount} sesion{u.sessionCount !== 1 ? "es" : ""}
                      {" · "}
                      {u.templateCount} rutina{u.templateCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setEditUser(u)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setResetUser(u)}
                  >
                    Contrasena
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleteUserId(u.id)}
                    disabled={u.id === currentUserId}
                  >
                    Borrar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No hay usuarios registrados todavia.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <UserFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {editUser && (
        <UserFormDialog
          mode="edit"
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          user={{
            id: editUser.id,
            email: editUser.email,
            role: editUser.role,
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {resetUser && (
        <ChangePasswordDialog
          open={!!resetUser}
          onOpenChange={(open) => !open && setResetUser(null)}
          isReset
          userId={resetUser.id}
        />
      )}

      <Dialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        title="Borrar usuario"
        description="Esta accion no se puede deshacer. El usuario perdera acceso a todas sus rutinas y historial."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estas seguro de que deseas borrar este usuario?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => setDeleteUserId(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-full"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Borrando..." : "Borrar usuario"}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}
