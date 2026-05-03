import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function SetupCallout() {
  return (
    <Card className="hero-panel max-w-3xl">
      <CardHeader className="pb-3">
        <p className="eyebrow">Setup requerido</p>
        <CardTitle>Conecta la base y activa tu entorno</CardTitle>
        <CardDescription className="max-w-2xl text-base">
          La app ya esta implementada, pero necesita <code>DATABASE_URL</code> y{" "}
          <code>SESSION_SECRET</code> en <code>.env.local</code> para funcionar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login" className={cn(buttonVariants(), "rounded-full px-6")}>
          Ir al acceso
        </Link>
      </CardContent>
    </Card>
  )
}
