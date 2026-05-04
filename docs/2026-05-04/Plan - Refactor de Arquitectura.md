# Refactor de Arquitectura — 2026-05-04

## Contexto
El modelo anterior era muy rigido: todo colgaba de `RoutinePlan → RoutineDay → RoutineBlock → Exercise`.
No existia un ejercicio fuera de una rutina. El "entrenamiento libre" usaba un hack con prefijo `__FREE_WORKOUT__::`.
Al agregar ejercicios mid-sesion se modificaba la estructura del plan.

Flujo ideal del usuario:
`Llego al gym → abro la app → hago ejercicios libres → termino → abro historial → si quiero, guardo como rutina`

## Decision
- **Drop completo de la base de datos** (modo pruebas, no habia data que migrar)
- **Nuevo schema** desde cero
- **Se mantiene la UI tipo mazo/Tinder** de la sesion (lo que gusta)
- **Catalogo de ejercicios** con seed a la database (72 ejercicios)

## Nuevo Schema

### ExerciseLibrary
Catalogo global de ejercicios reutilizables, independiente de usuarios y sesiones.
72 ejercicios con defaults (sets, reps, descanso).

### SessionLog
Lo que realmente hiciste en el gym. No cuelga de ningun plan.

### SessionExercise
Un ejercicio dentro de una sesion. Referencia a ExerciseLibrary (nullable para custom).
Una fila = un ejercicio ejecutado.

### RoutineTemplate
Rutina reutilizable: snapshot de una sesion exitosa o creada manualmente.

### RoutineTemplateExercise
Ejercicios de un template en orden especifico.

## Lo que se elimino
- `RoutinePlan`, `RoutineDay`, `RoutineBlock`, `Exercise` (jerarquia rigida)
- `WorkoutSession` → `SessionLog`
- `ExerciseLog` → mergeado en `SessionExercise`
- Hack `__FREE_WORKOUT__::`
- Paginas: `/entrenar/libre`, `/plan/*`, `/rutina`, `/admin/*`
- Componentes: `gym-start-hero`, `manual-routine-builder`, `free-workout-builder`, `today-workout-hero`

## Lo que se mantiene
- **Toda la UI de sesion**: SessionWorkoutFlow, ExerciseActionCard, RestTimerCard (mazo tipo Tinder)
- Auth, alerts, AppShell, nav
- CSV import → ahora mapea a RoutineTemplate
- Historial con drill-down

## Lo que es nuevo
- Seed de 72 ejercicios en ExerciseLibrary
- Pantalla `/sesion/nueva` con selector de ejercicios desde libreria + custom
- "Guardar como rutina" desde cada sesion del historial
- Lista de templates en home con boton "Entrenar"
- Pagina de resumen de sesion `/sesion/[id]/resumen`

## Resultado
- `typecheck`: ✅ sin errores
- `lint`: ✅ sin warnings
- `db push`: ✅ schema aplicado
- `seed`: ✅ 72 ejercicios en libreria
