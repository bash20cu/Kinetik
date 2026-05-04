# Analisis de proyecto — 2026-05-04

## Revision inicial del proyecto Kinetik

### Stack
- Next.js 15 + App Router + TypeScript + React 19
- Neon PostgreSQL + Prisma 6.19.0
- Tailwind CSS + shadcn/ui
- Auth propia por email/password con cookies de sesion

### Estructura de datos
- `RoutinePlan -> RoutineDay -> RoutineBlock -> Exercise` (rutinas planeadas)
- `WorkoutSession -> ExerciseLog` (sesiones ejecutadas)
- Entrenamiento libre = plan archivado con prefijo `__FREE_WORKOUT__::`

### Limitaciones actuales (documento MVP Gym-First)
- `ExerciseLog` guarda `setsCompleted` como total, no set individual
- No se guarda duracion real de sesion, tiempo por set, descanso real
- No hay volumen calculable ni progresion automatica de cargas

### Lo que guarda hoy
- Sesiones (planned, in_progress, completed)
- Sets completados por ejercicio (total)
- Reps y peso como texto libre
- Notas por ejercicio y notas generales
- Estado de sesion y estado de ejercicio

### Proximos pasos del MVP (documento 2026-05-04)
1. **Construccion progresiva de rutina** — Guardar sesiones como rutinas reutilizables, agregar ejercicios a dias existentes
2. **Mejorar experiencia de sesion** — Pulir add_exercise, saltar ejercicio, mejorar copy
3. **Metricas reales** — Tabla `ExerciseSetLog` para tracking set-a-set
4. **iOS / PWA** — Manifest, service worker, Web Push
