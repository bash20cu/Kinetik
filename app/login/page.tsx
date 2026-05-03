import { redirect } from "next/navigation"

import { loginAction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
            Inicia con tu email para abrir tus planes, sesiones e historial.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isDatabaseConfigured() ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Define <code>DATABASE_URL</code> y <code>SESSION_SECRET</code> para
              activar el login y la persistencia.
            </div>
          ) : (
            <form action={loginAction} className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-semibold">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <Button type="submit" className="rounded-full">
                Entrar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
