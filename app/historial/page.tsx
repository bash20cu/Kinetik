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

function statusVariant(status: string) {
  if (status === "completed") return "success"
  if (status === "in_progress") return "warning"
  return "outline"
}

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
              Inicia un dia de entrenamiento desde el dashboard para generar historial.
            </CardDescription>
          </CardHeader>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Dia</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.date}</TableCell>
                    <TableCell className="font-medium">{session.dayName}</TableCell>
                    <TableCell>{session.planName}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(session.status)}>{session.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/sesion/${session.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
                      >
                        Abrir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </AppShell>
  )
}
