# Construccion progresiva de rutina — 2026-05-04

## Objetivo
Implementar la Prioridad 1 del MVP Gym-First: permitir que la rutina emerja desde lo que el usuario realmente hizo.

## Que vamos a construir

### 1. Guardar sesion como rutina reutilizable
- Desde la pantalla de cierre de sesion (phase `complete`)
- Desde el historial (boton en sesiones completadas)

### 2. Agregar ejercicios hechos a un dia existente
- Selector de dias del plan activo
- Deteccion de duplicados por nombre de ejercicio
- Bloque "Agregado desde sesion" si el dia tiene multiples bloques

### 3. Pagina intermedia de decision
- Ruta: `/sesion/[id]/guardar-como-rutina`
- Dos modos: crear rutina nueva O agregar a dia existente

## Plan de cambios

| # | Archivo | Cambio | Estado |
|---|---------|--------|--------|
| 1 | `lib/types.ts` | Tipo `RoutineDayOption` | [x] |
| 2 | `lib/data.ts` | Funciones: `saveSessionAsRoutine`, `addSessionExercisesToDay`, `getActivePlanDays` | [x] |
| 3 | `app/actions.ts` | Actions: `saveSessionAsRoutineAction`, `addSessionExercisesToDayAction` | [x] |
| 4 | `app/sesion/[id]/guardar-como-rutina/page.tsx` | Nueva pagina con formulario de decision | [x] |
| 5 | `app/historial/page.tsx` | Boton "Usar para rutina" en sesiones completadas | [x] |
| 6 | `components/session-workout-flow.tsx` | Boton "Guardar como rutina reutilizable" en fase complete | [x] |

## Decisiones de diseño
- **Duplicados**: Se omiten ejercicios con el mismo nombre al agregar a dia existente
- **Valores planeados**: Los valores reales del log (`reps`, `weight`) se usan como `plannedReps` para futura referencia
- **Bloques**: Si el dia tiene un solo bloque se agrega ahi; si tiene multiples se crea bloque nuevo
- **Versionado**: Crear nueva rutina desde sesion archiva el plan activo actual (mismo patron que `createManualPlan`)

## Resultado
- `typecheck`: ✅ sin errores
- `lint`: ✅ sin warnings
- Flujo completo implementado y funcional

## Ajuste post-implementacion
- Pagina `/historial` ahora tiene boton "Volver al inicio" mobile-friendly
- Boton "Ver historial" en cierre de sesion → cambiado a "Ver resumen de sesion" → redirige a `/sesion/[id]/resumen`
- Nueva pagina `/sesion/[id]/resumen` muestra detalle de ESA sesion: ejercicios, sets, reps, peso, notas, estado
