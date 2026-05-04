"use client"

import { useState } from "react"

import { changeMyPasswordAction, resetUserPasswordAction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type ChangePasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isReset?: boolean
  userId?: string
  defaultPassword?: string
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  isReset,
  userId,
  defaultPassword,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState(defaultPassword || "")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contrasenas no coinciden.")
      return
    }

    setIsSubmitting(true)

    try {
      if (isReset && userId) {
        const formData = new FormData()
        formData.set("userId", userId)
        formData.set("newPassword", newPassword)
        await resetUserPasswordAction(formData)
        setGeneratedPassword(newPassword)
        setShowResult(true)
      } else {
        const formData = new FormData()
        formData.set("currentPassword", currentPassword)
        formData.set("newPassword", newPassword)
        formData.set("confirmPassword", confirmPassword)
        await changeMyPasswordAction(formData)
        onOpenChange(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar la contrasena.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    setShowResult(false)
    setError(null)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setGeneratedPassword("")
  }

  if (showResult && isReset) {
    return (
      <Dialog open={open} onOpenChange={handleClose} title="Contrasena actualizada">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Nueva contrasena</p>
            <p className="mt-1 font-mono text-lg font-semibold">{generatedPassword}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Comparte esta contrasena con el usuario. Debera cambiarla al iniciar sesion.
          </p>
          <Button onClick={handleClose} className="w-full rounded-full">
            Cerrar
          </Button>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={isReset ? "Resetear contrasena" : "Cambiar contrasena"}
      description={isReset ? "Genera una nueva contrasena para este usuario." : "Ingresa tu contrasena actual y la nueva."}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {!isReset && (
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Contrasena actual</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contrasena actual"
              className="h-10 rounded-xl"
              required
            />
          </div>
        )}

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nueva contrasena</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimo 6 caracteres"
            className="h-10 rounded-xl"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Confirmar contrasena</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contrasena"
            className="h-10 rounded-xl"
            required
          />
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isReset ? "Generar nueva contrasena" : "Actualizar contrasena"}
        </Button>
      </form>
    </Dialog>
  )
}
