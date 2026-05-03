import { AppShell } from "@/components/app-shell"
import { SetupCallout } from "@/components/setup-callout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import { getActivePlan, getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"

export default async function RoutinePage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    )
  }

  const user = await requireUser()
  const [plan, alerts] = await Promise.all([getActivePlan(user.id), getUnreadAlerts(user.id)])

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6">
        <p className="eyebrow">Plan actual</p>
        <h2 className="page-heading">Rutina</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Vista SSR del plan activo agrupado por dia y bloque muscular.
        </p>
      </div>

      {!plan ? (
        <Card className="hero-panel max-w-3xl">
          <CardHeader>
            <CardTitle>No hay una rutina activa</CardTitle>
            <CardDescription className="text-base">
              Importa un CSV para crear tu primer plan y empezar a registrar entrenos.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="panel-grid">
          {plan.days.map((day) => (
            <Card key={day.id} className="glass-card overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">Dia {day.order}</Badge>
                  <CardTitle>{day.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {day.blocks.map((block) => (
                  <div key={block.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-xl uppercase">{block.name}</h3>
                      <Badge variant="secondary">{block.exercises.length} ejercicios</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {block.exercises.map((exercise) => (
                        <div key={exercise.id} className="rounded-2xl border border-border/70 bg-card p-4">
                          <h4 className="text-lg uppercase leading-tight">{exercise.name}</h4>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline">{exercise.groupName}</Badge>
                            {exercise.variant ? <Badge variant="secondary">{exercise.variant}</Badge> : null}
                            {exercise.plannedSets ? <Badge variant="info">{exercise.plannedSets} sets</Badge> : null}
                            {exercise.plannedReps ? <Badge variant="warning">{exercise.plannedReps} reps</Badge> : null}
                          </div>
                          {exercise.notes ? (
                            <p className="mt-3 text-sm text-muted-foreground">{exercise.notes}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
