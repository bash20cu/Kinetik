import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { isDatabaseConfigured } from "@/lib/env"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/")
  }

  return (
    <div className="page-container flex min-h-screen items-center justify-center">
      <Card className="hero-panel w-full max-w-lg">
        <CardHeader className="space-y-3">
          <p className="eyebrow">Kinetik access</p>
          <CardTitle className="max-w-[12ch] text-4xl leading-none">
            Controla tu rutina desde una sola app
          </CardTitle>
          <CardDescription className="text-base">
            Inicia con tu email y contrasena para abrir tus planes, sesiones e historial.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isDatabaseConfigured() ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Define <code>DATABASE_URL</code> y <code>SESSION_SECRET</code> para
              activar el login y la persistencia.
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                El acceso es privado. Las cuentas se crean manualmente por administrador.
              </div>
              <LoginForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
