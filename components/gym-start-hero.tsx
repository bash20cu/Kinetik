"use client"

import Link from "next/link"
import { Flame, History, PlayCircle, Sparkles } from "lucide-react"

import { createSessionAction, startSuggestedWorkoutAction } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getWorkoutSessionBadgeVariant } from "@/lib/status-ui"
import type { WorkoutSession, WorkoutSuggestion } from "@/lib/types"
import { cn } from "@/lib/utils"

type GymStartHeroProps = {
  openSession: WorkoutSession | null
  latestSession: WorkoutSession | null
  suggestedWorkout: WorkoutSuggestion | null
}

export function GymStartHero({
  openSession,
  latestSession,
  suggestedWorkout
}: GymStartHeroProps) {
  const headline = openSession
    ? `Continua ${openSession.dayName}`
    : suggestedWorkout
      ? `Empieza ${suggestedWorkout.dayName}`
      : "Empieza a entrenar"

  const description = openSession
    ? "Tienes una sesion abierta. Vuelve al mazo, marca tus sets y sigue desde donde ibas."
    : suggestedWorkout
      ? `Te sugerimos ${suggestedWorkout.dayName} de ${suggestedWorkout.planName}, pero el foco es arrancar rapido.`
      : "No dependes del calendario para empezar. Crea un entrenamiento libre y entra directo a la sesion."

  return (
    <Card className="hero-panel overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={openSession ? "warning" : "info"}>
            {openSession ? "sesion abierta" : "gym first"}
          </Badge>
          {latestSession ? <Badge variant={getWorkoutSessionBadgeVariant(latestSession.status)}>{latestSession.status}</Badge> : null}
        </div>
        <CardTitle className="max-w-[12ch] text-5xl leading-none">{headline}</CardTitle>
        <CardDescription className="max-w-2xl text-base">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Estado
            </p>
            <p className="mt-2 font-display text-3xl">
              {openSession ? "Continuar" : suggestedWorkout ? "Listo" : "Libre"}
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sugerido
            </p>
            <p className="mt-2 font-display text-3xl">{suggestedWorkout?.dayName ?? "Sin plan"}</p>
          </div>
          <div className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ultimo hecho
            </p>
            <p className="mt-2 font-display text-3xl">{latestSession?.dayName ?? "Ninguno"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {openSession ? (
            <Link
              href={`/sesion/${openSession.id}`}
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
            >
              <PlayCircle className="size-4" />
              Continuar sesion
            </Link>
          ) : suggestedWorkout ? (
            <form action={startSuggestedWorkoutAction}>
              <Button type="submit" size="lg" className="rounded-full px-8">
                <Flame className="size-4" />
                Empezar entrenamiento
              </Button>
            </form>
          ) : (
            <Link
              href="/entrenar/libre"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
            >
              <Sparkles className="size-4" />
              Empezar entrenamiento
            </Link>
          )}

          <Link
            href="/entrenar/libre"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8")}
          >
            <Sparkles className="size-4" />
            Entrenamiento libre
          </Link>

          {latestSession ? (
            <Link
              href={`/sesion/${latestSession.id}`}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "rounded-full px-8")}
            >
              <History className="size-4" />
              Ver lo ultimo que hice
            </Link>
          ) : null}
        </div>

        {suggestedWorkout && !openSession ? (
          <form action={createSessionAction} className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
            <input type="hidden" name="dayId" value={suggestedWorkout.dayId} />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Si prefieres el camino clasico</p>
                <p className="text-sm text-muted-foreground">
                  Tambien puedes crear la sesion sugerida de {suggestedWorkout.dayName} directamente.
                </p>
              </div>
              <Button type="submit" variant="ghost" className="rounded-full">
                Crear sesion sugerida
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
