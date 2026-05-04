"use client"

import { randomBytes } from "crypto"
import { useEffect, useState } from "react"
import { Copy } from "lucide-react"

import { createManagedUserAction, updateManagedUserAction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type UserFormData = {
  id?: string
  email: string
  role: "admin" | "user"
}

type UserFormDialogProps = {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserFormData
  onSuccess?: () => void
}

function generatePassword(): string {
  return randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)
}

export function UserFormDialog({ mode, open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const [email, setEmail] = useState(user?.email || "")
  const [password, setPassword] = useState(mode === "create" ? generatePassword() : "")
  const [role, setRole] = useState<"admin" | "user">(user?.role || "user")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setEmail(user?.email || "")
      setPassword(mode === "create" ? generatePassword() : "")
      setRole(user?.role || "user")
      setError(null)
    }
  }, [open, user, mode])

  function handleGeneratePassword() {
    setPassword(generatePassword())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.includes("@")) {
      setError("Ingresa un email valido.")
      return
    }

    if (mode === "create" && password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      if (mode === "create") {
        formData.set("email", email)
        formData.set("password", password)
        formData.set("role", role)
        await createManagedUserAction(formData)
        onOpenChange(false)
        onSuccess?.()
      } else if (user?.id) {
        formData.set("userId", user.id)
        formData.set("email", email)
        formData.set("role", role)
        if (password) {
          formData.set("password", password)
        }
        await updateManagedUserAction(formData)
        onOpenChange(false)
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el usuario.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Crear usuario" : "Editar usuario"}
      description={mode === "create" ? "Crea un nuevo usuario con email y contrasena." : "Modifica los datos del usuario."}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@correo.com"
            className="h-10 rounded-xl"
            required
          />
        </div>

        {mode === "create" && (
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Contrasena</label>
            <div className="flex gap-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Generar automatica"
                className="h-10 rounded-xl font-mono"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={handleGeneratePassword}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {mode === "edit" && (
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nueva contrasena (opcional)</label>
            <div className="flex gap-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar vacio para no cambiar"
                className="h-10 rounded-xl font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={handleGeneratePassword}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Rol</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                role === "user"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-accent"
              )}
            >
              Usuario
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                role === "admin"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-accent"
              )}
            >
              Administrador
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : mode === "create"
            ? "Crear usuario"
            : "Guardar cambios"}
        </Button>
      </form>
    </Dialog>
  )
}
