import Link from "next/link"

import { importPlanAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { requireUser } from "@/lib/auth"
import { getPlanImports, getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"

function importVariant(status: string) {
  if (status === "success") return "success"
  if (status === "processing") return "warning"
  return "error"
}

export default async function ImportPlanPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    )
  }

  const user = await requireUser()
  const [imports, alerts] = await Promise.all([getPlanImports(user.id), getUnreadAlerts(user.id)])

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Carga de rutina</p>
          <h2 className="page-heading">Importar plan</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Descarga la plantilla CSV, edita tu rutina y subela para activar un nuevo plan.
          </p>
        </div>

        <Link
          href="/api/plan/template"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
        >
          Descargar plantilla
        </Link>
      </div>

      <div className="panel-grid lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="hero-panel">
          <CardHeader>
            <CardTitle>Subir archivo CSV</CardTitle>
            <CardDescription className="text-base">
              La importacion acepta archivos separados por coma, punto y coma o tabulacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={importPlanAction} className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="file" className="text-sm font-semibold">
                  Archivo CSV
                </label>
                <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
              </div>
              <Button type="submit" className="rounded-full">
                Subir y validar
              </Button>
            </form>

            <Link
              href="/plan/nuevo"
              className={cn(buttonVariants({ variant: "secondary" }), "rounded-full")}
            >
              Crear rutina manualmente
            </Link>

            <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
              Cada fila representa un ejercicio. Si el archivo es valido, se crea un nuevo
              plan activo y el anterior queda archivado. <code>planned_sets</code> es
              opcional: si viene vacio o con un formato no reconocido, se guarda como
              pendiente.
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Historial de importaciones</CardTitle>
            <CardDescription>Ultimas cargas del plan para esta cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Errores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                        Aun no hay importaciones registradas.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  imports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.fileName}</TableCell>
                      <TableCell>
                        <Badge variant={importVariant(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>{item.createdAt}</TableCell>
                      <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                        {item.errorSummary ?? "Sin errores"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
