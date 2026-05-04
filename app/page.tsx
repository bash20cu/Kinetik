import Link from "next/link"

import { AppShell } from "@/components/app-shell"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { getHomeDashboardData } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"
import { cn } from "@/lib/utils"

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    )
  }

  const user = await requireUser()
  const dashboard = await getHomeDashboardData(user.id)

  return (
    <AppShell user={dashboard.user} alerts={dashboard.alerts}>
      <div className="mb-6">
        <p className="eyebrow">Gym first</p>
        <h2 className="page-heading">Entrenar</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Llega al gym, abre la app y empieza. El historial y las rutinas quedan para apoyar, no para bloquear.
        </p>
      </div>

      <div className="panel-grid">
        <Card className="glass-card">
          <CardHeader>
            <p className="eyebrow">Accion rapida</p>
            <CardTitle>
              {dashboard.openSession ? "Tienes sesion en curso" : "Empezar entreno"}
            </CardTitle>
            <CardDescription className="text-base">
              {dashboard.openSession
                ? `Sesion del ${dashboard.openSession.date}. Continua donde quedaste.`
                : "Crea una sesion con los ejercicios que quieras hacer hoy."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.openSession ? (
              <Link
                href={`/sesion/${dashboard.openSession.id}`}
                className={cn(buttonVariants(), "w-full rounded-full")}
              >
                Continuar sesion
              </Link>
            ) : (
              <Link
                href="/sesion/nueva"
                className={cn(buttonVariants(), "w-full rounded-full")}
              >
                Crear sesion
              </Link>
            )}
          </CardContent>
        </Card>

        {dashboard.recentTemplates.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <p className="eyebrow">Reutilizables</p>
              <CardTitle>Rutinas guardadas</CardTitle>
              <CardDescription className="text-base">
                Tus rutinas favoritas para repetir sin construir de nuevo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboard.recentTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">
                        {template.isFavorite ? "★ " : ""}{template.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {template.exerciseCount} ejercicios
                      </p>
                    </div>
                    <form
                      action={async (formData) => {
                        "use server"
                        const { startTemplateSessionAction } = await import("@/app/actions")
                        formData.append("templateId", template.id)
                        startTemplateSessionAction(formData)
                      }}
                      className="flex gap-2"
                    >
                      <input type="hidden" name="templateId" value={template.id} />
                      <Button type="submit" variant="secondary" className="rounded-full">
                        Entrenar
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
              <Link
                href="/rutinas"
                className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
              >
                Ver todas las rutinas
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader>
            <p className="eyebrow">Lo que ya hiciste</p>
            <CardTitle>
              {dashboard.latestSession ? "Ultima sesion" : "Aun no has entrenado"}
            </CardTitle>
            <CardDescription className="text-base">
              {dashboard.latestSession
                ? `Completada el ${dashboard.latestSession.date}.`
                : "Cuando cierres tu primera sesion, aparecera aqui."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.latestSession ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="success">{dashboard.latestSession.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Sesion del {dashboard.latestSession.date}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/sesion/${dashboard.latestSession.id}/resumen`}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
                  >
                    Ver resumen
                  </Link>
                  <Link
                    href={`/sesion/${dashboard.latestSession.id}/guardar-como-rutina`}
                    className={cn(buttonVariants({ variant: "secondary" }), "w-full rounded-full")}
                  >
                    Guardar como rutina
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/sesion/nueva"
                className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
              >
                Empezar primera sesion
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
