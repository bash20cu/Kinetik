import {
  createManagedUserAction,
  deleteManagedUserAction,
  updateManagedUserAction
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { SetupCallout } from "@/components/setup-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { getManagedUsers, getUnreadAlerts } from "@/lib/data";
import { isDatabaseConfigured } from "@/lib/env";

export default async function AdminUsersPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    );
  }

  const user = await requireUser();
  const [alerts, users] = await Promise.all([getUnreadAlerts(user.id), getManagedUsers()]);

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6">
        <p className="eyebrow">Admin</p>
        <h2 className="page-heading">Usuarios</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Crea cuentas privadas, actualiza email o contrasena y elimina usuarios cuando ya no
          deban tener acceso.
        </p>
      </div>

      <div className="panel-grid lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="hero-panel">
          <CardHeader>
            <CardTitle>Crear usuario</CardTitle>
            <CardDescription className="text-base">
              Las cuentas nuevas quedan listas para iniciar sesion de inmediato.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createManagedUserAction} className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="new-email" className="text-sm font-semibold">
                  Email
                </label>
                <Input id="new-email" name="email" type="email" placeholder="persona@correo.com" required />
              </div>

              <div className="grid gap-2">
                <label htmlFor="new-password" className="text-sm font-semibold">
                  Contrasena inicial
                </label>
                <Input id="new-password" name="password" type="password" required />
              </div>

              <Button type="submit" className="rounded-full">
                Crear usuario
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Cuentas existentes</CardTitle>
            <CardDescription>
              Edita el email, cambia la contrasena dejando un nuevo valor o borra la cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((managedUser) => (
                  <TableRow key={managedUser.id}>
                    <TableCell className="min-w-[280px]">
                      <form action={updateManagedUserAction} className="grid gap-3">
                        <input type="hidden" name="userId" value={managedUser.id} />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{managedUser.email}</span>
                          {managedUser.id === user.id ? <Badge variant="info">Tu sesion</Badge> : null}
                        </div>
                        <Input name="email" type="email" defaultValue={managedUser.email} required />
                        <Input
                          name="password"
                          type="password"
                          placeholder="Nueva contrasena (opcional)"
                        />
                        <div className="text-xs text-muted-foreground">
                          Creado: {managedUser.createdAt.slice(0, 10)}
                        </div>
                        <div>
                          <Button type="submit" variant="outline" size="sm" className="rounded-full">
                            Guardar cambios
                          </Button>
                        </div>
                      </form>
                    </TableCell>
                    <TableCell className="w-[180px]">
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div>{managedUser.planCount} planes</div>
                        <div>{managedUser.sessionCount} sesiones</div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[140px]">
                      <form action={deleteManagedUserAction}>
                        <input type="hidden" name="userId" value={managedUser.id} />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          className="rounded-full"
                          disabled={managedUser.id === user.id}
                        >
                          Borrar
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
