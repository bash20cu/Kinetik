import { createManualPlanAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { ManualRoutineBuilder } from "@/components/manual-routine-builder";
import { SetupCallout } from "@/components/setup-callout";
import { requireUser } from "@/lib/auth";
import { getUnreadAlerts } from "@/lib/data";
import { isDatabaseConfigured } from "@/lib/env";

export default async function NewPlanPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    );
  }

  const user = await requireUser();
  const alerts = await getUnreadAlerts(user.id);

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6">
        <p className="eyebrow">Plan builder</p>
        <h2 className="page-heading">Nueva rutina</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Crea tu rutina manualmente desde la app, sin depender del CSV.
        </p>
      </div>

      <ManualRoutineBuilder action={createManualPlanAction} />
    </AppShell>
  );
}
