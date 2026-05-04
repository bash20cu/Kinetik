import Link from "next/link"

import { AppShell } from "@/components/app-shell"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { requireUser } from "@/lib/auth"
import { getSessions, getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"

export default async function HistoryPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    )
  }

  const user = await requireUser()
  const [sessions, alerts] = await Promise.all([getSessions(user.id), getUnreadAlerts(user.id)])

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6">
        <p className="eyebrow">Registro</p>
        <h2 className="page-heading">Historial</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Todas tus sesiones guardadas y listas para revisar.
        </p>
      </div>

      <Card className="glass-card overflow-hidden">
        {sessions.length === 0 ? (
          <CardHeader>
            <CardTitle>Aun no tienes sesiones</CardTitle>
            <CardDescription className="text-base">
              Crea una sesion desde el inicio para empezar a registrar tu progreso.
            </CardDescription>
          </CardHeader>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ejercicios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.date}</TableCell>
                    <TableCell className="font-medium">Sesion #{session.id.slice(0, 4)}</TableCell>
                    <TableCell>
                      <Badge variant={session.status === "completed" ? "success" : session.status === "in_progress" ? "info" : session.status === "discarded" ? "outline" : "warning"}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/sesion/${session.id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
                        >
                          Abrir
                        </Link>
                        <Link
                          href={`/sesion/${session.id}/resumen`}
                          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "rounded-full")}
                        >
                          Resumen
                        </Link>
                        {session.status === "completed" && (
                          <Link
                            href={`/sesion/${session.id}/guardar-como-rutina`}
                            className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
                          >
                            Guardar rutina
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      <div className="mt-6">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
        >
          ← Volver al inicio
        </Link>
      </div>
    </AppShell>
  )
}
