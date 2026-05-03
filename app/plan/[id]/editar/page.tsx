import { notFound } from "next/navigation";

import { updateRoutinePlanAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { ManualRoutineBuilder } from "@/components/manual-routine-builder";
import { SetupCallout } from "@/components/setup-callout";
import { requireUser } from "@/lib/auth";
import { getPlanById, getUnreadAlerts } from "@/lib/data";
import { isDatabaseConfigured } from "@/lib/env";

type EditPlanPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPlanPage({ params }: EditPlanPageProps) {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    );
  }

  const { id } = await params;
  const user = await requireUser();
  const [alerts, plan] = await Promise.all([getUnreadAlerts(user.id), getPlanById(user.id, id)]);

  if (!plan) {
    notFound();
  }

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6">
        <p className="eyebrow">Plan builder</p>
        <h2 className="page-heading">Editar rutina</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Ajusta esta rutina y guardala como una nueva version activa. La version anterior se
          conserva archivada para proteger tu historial.
        </p>
      </div>

      <ManualRoutineBuilder
        action={updateRoutinePlanAction}
        initialPlan={plan}
        submitLabel="Guardar cambios"
        intro="Edita dias, bloques y ejercicios. Al guardar, esta configuracion se convierte en la nueva version activa."
      />
    </AppShell>
  );
}
