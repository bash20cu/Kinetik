import Link from "next/link";

import {
  activateRoutinePlanAction,
  archiveRoutinePlanAction
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { SetupCallout } from "@/components/setup-callout";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getActivePlan, getRoutinePlans, getUnreadAlerts } from "@/lib/data";
import { isDatabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

export default async function RoutinePage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    );
  }

  const user = await requireUser();
  const [plan, plans, alerts] = await Promise.all([
    getActivePlan(user.id),
    getRoutinePlans(user.id),
    getUnreadAlerts(user.id)
  ]);

  const archivedPlans = plans.filter((item) => item.status === "archived");

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6">
        <p className="eyebrow">Plan actual</p>
        <h2 className="page-heading">Rutinas</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Gestiona tu rutina activa y conserva versiones archivadas sin perder el historial de
          sesiones.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/plan/nuevo" className={cn(buttonVariants(), "rounded-full")}>
          Crear rutina
        </Link>
        <Link
          href="/plan/importar"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
        >
          Importar CSV
        </Link>
      </div>

      {!plan ? (
        <Card className="hero-panel max-w-3xl">
          <CardHeader>
            <CardTitle>No hay una rutina activa</CardTitle>
            <CardDescription className="text-base">
              Puedes crear una rutina nueva desde la app o reactivar una archivada.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="panel-grid">
          <Card className="hero-panel overflow-hidden">
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="success">Activa</Badge>
                    <Badge variant="outline">{plan.days.length} dias</Badge>
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Activa desde {plan.activeFrom}.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/plan/${plan.id}/editar`}
                    className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                  >
                    Modificar
                  </Link>
                  <form action={archiveRoutinePlanAction}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <Button type="submit" variant="destructive" className="rounded-full">
                      Archivar
                    </Button>
                  </form>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {plan.days.map((day) => (
                <div
                  key={day.id}
                  className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Badge variant="outline">Dia {day.order}</Badge>
                    <h3 className="text-xl uppercase">{day.name}</h3>
                  </div>

                  <div className="grid gap-4">
                    {day.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="rounded-2xl border border-border/70 bg-card/80 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h4 className="text-lg uppercase">{block.name}</h4>
                          <Badge variant="secondary">{block.exercises.length} ejercicios</Badge>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {block.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="rounded-2xl border border-border/70 bg-background/90 p-4"
                            >
                              <h5 className="text-base uppercase leading-tight">{exercise.name}</h5>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline">{exercise.groupName}</Badge>
                                {exercise.variant ? (
                                  <Badge variant="secondary">{exercise.variant}</Badge>
                                ) : null}
                                {exercise.plannedSets ? (
                                  <Badge variant="info">{exercise.plannedSets} sets</Badge>
                                ) : null}
                                {exercise.plannedReps ? (
                                  <Badge variant="warning">{exercise.plannedReps} reps</Badge>
                                ) : null}
                              </div>
                              {exercise.notes ? (
                                <p className="mt-3 text-sm text-muted-foreground">{exercise.notes}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <section className="mt-8 grid gap-4">
        <div>
          <p className="eyebrow">Versiones</p>
          <h3 className="text-3xl uppercase tracking-[0.08em]">Gestion de planes</h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((item) => (
            <Card key={item.id} className="glass-card">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant={item.status === "active" ? "success" : "secondary"}>
                        {item.status === "active" ? "Activa" : "Archivada"}
                      </Badge>
                      <Badge variant="outline">{item.dayCount} dias</Badge>
                      <Badge variant="outline">{item.exerciseCount} ejercicios</Badge>
                      <Badge variant="outline">{item.sessionCount} sesiones</Badge>
                    </div>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription className="mt-2">
                      Ultima activacion: {item.activeFrom}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link
                  href={`/plan/${item.id}/editar`}
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                >
                  Modificar
                </Link>

                {item.status === "archived" ? (
                  <form action={activateRoutinePlanAction}>
                    <input type="hidden" name="planId" value={item.id} />
                    <Button type="submit" variant="secondary" className="rounded-full">
                      Reactivar
                    </Button>
                  </form>
                ) : (
                  <form action={archiveRoutinePlanAction}>
                    <input type="hidden" name="planId" value={item.id} />
                    <Button type="submit" variant="destructive" className="rounded-full">
                      Archivar
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {!plans.length ? (
          <Card className="glass-card">
            <CardContent className="pt-6 text-muted-foreground">
              Aun no tienes planes guardados.
            </CardContent>
          </Card>
        ) : null}

        {archivedPlans.length ? (
          <p className="text-sm text-muted-foreground">
            Las rutinas archivadas se conservan para mantener el contexto historico de tus
            sesiones anteriores.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
