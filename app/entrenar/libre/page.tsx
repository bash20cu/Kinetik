import Link from "next/link"

import { createFreeWorkoutSessionAction } from "@/app/actions"
import { AppShell } from "@/components/app-shell"
import { FreeWorkoutBuilder } from "@/components/free-workout-builder"
import { SetupCallout } from "@/components/setup-callout"
import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { getUnreadAlerts } from "@/lib/data"
import { isDatabaseConfigured } from "@/lib/env"
import { cn } from "@/lib/utils"

export default async function FreeWorkoutPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page-container">
        <SetupCallout />
      </main>
    )
  }

  const user = await requireUser()
  const alerts = await getUnreadAlerts(user.id)

  return (
    <AppShell user={user} alerts={alerts}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Libre</p>
          <h2 className="page-heading">Entrenamiento libre</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Construye algo corto, entra al gimnasio sin friccion y guarda la base para repetirla despues.
          </p>
        </div>

        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
        >
          Volver al inicio
        </Link>
      </div>

      <FreeWorkoutBuilder action={createFreeWorkoutSessionAction} />
    </AppShell>
  )
}
