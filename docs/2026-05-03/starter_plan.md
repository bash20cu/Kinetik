# App Web SSR Para Rutina de Gimnasio

## Resumen
Construir una app web personal con SSR, TypeScript, despliegue en Vercel y base de datos en Neon. La v1 permitirá gestionar tu rutina, registrar sesiones, mostrar alertas dentro de la app y actualizar el plan mediante una plantilla CSV descargable y reimportable.

## Cambios clave
- Base técnica:
  - Framework web con SSR y TypeScript, optimizado para móvil y escritorio.
  - Hosting en Vercel.
  - Persistencia en Neon PostgreSQL.
- Acceso:
  - cuenta personal simple con login por email
  - datos protegidos por usuario desde el inicio, aunque la v1 esté enfocada en un solo usuario real
- Rutina y carga de planes:
  - la rutina ya no se cargará desde OCR ni transcripción manual fija
  - se ofrecerá una plantilla CSV descargable con formato definido para ejercicios, días, bloques y parámetros base
  - el usuario podrá subir un CSV para reemplazar o actualizar su plan cuando cambie la rutina
  - validar el CSV antes de importar y mostrar errores claros por fila/campo
- Ejecución diaria:
  - vista `Hoy` con el día activo o el día que el usuario quiera entrenar
  - registro de series hechas, repeticiones, peso, estado del ejercicio y notas
  - cierre de sesión con resumen rápido
- Alertas:
  - solo in-app en v1
  - alertas para recordar sesión pendiente, rutina recién actualizada o inconsistencias de carga
- Historial:
  - sesiones por fecha
  - detalle por ejercicio con cargas y repeticiones registradas
  - base preparada para luego agregar progreso y estadísticas

## Interfaces y datos importantes
- `User`: id, email, createdAt
- `RoutinePlan`: id, userId, name, activeFrom, status
- `RoutineDay`: id, planId, name, order
- `RoutineBlock`: id, dayId, name, order
- `Exercise`: id, blockId, name, groupName, variant, plannedSets, plannedReps, notes
- `WorkoutSession`: id, userId, planId, dayId, date, status, generalNotes
- `ExerciseLog`: id, sessionId, exerciseId, setNumber, reps, weight, status, note
- `InAppAlert`: id, userId, type, title, body, readAt, createdAt
- `PlanImport`: id, userId, fileName, status, createdAt, errorSummary
- CSV plantilla:
  - columnas mínimas: `day_name`, `day_order`, `block_name`, `block_order`, `exercise_name`, `group_name`, `variant`, `planned_sets`, `planned_reps`, `notes`
  - una fila por ejercicio
  - importación idempotente a nivel de plan nuevo activo, sin mezclar silenciosamente con el anterior

## Implementación
- Pantallas:
  - `/` dashboard con resumen, alertas y acceso a entreno del día
  - `/rutina` plan activo agrupado por día y bloque
  - `/historial` sesiones anteriores
  - `/sesion/:id` detalle/edición de una sesión
  - `/plan/importar` descargar plantilla, subir CSV y revisar validación
- Flujo de importación:
  - descargar CSV modelo
  - completar o editar rutina
  - subir archivo
  - validar estructura y contenido
  - crear nuevo `RoutinePlan` activo
  - mantener referencia histórica del plan anterior para no romper sesiones pasadas
- SSR:
  - usar renderizado del lado servidor para dashboard, rutina e historial
  - hidratar solo las interacciones necesarias como registro de ejercicios, alertas y subida de CSV

## Pruebas y escenarios
- Registro y login correctos del usuario.
- Descarga exitosa de plantilla CSV.
- Subida de CSV válido y creación de nuevo plan activo.
- Rechazo de CSV inválido con mensajes por columna o fila.
- Visualización correcta de rutina agrupada por día y bloque.
- Creación de sesión y guardado de ejercicios con peso, reps y notas.
- Persistencia del historial en Neon y render correcto vía SSR.
- Generación y lectura de alertas in-app.
- Compatibilidad responsive en móvil y escritorio.

## Supuestos y decisiones
- La v1 sigue siendo personal, aunque ya queda estructurada por usuario.
- No habrá OCR ni editor visual de rutina en esta primera fase.
- Cambiar de rutina se hace exclusivamente por CSV importado.
- Las alertas son solo dentro de la app; no habrá email ni push en v1.
- Se conservarán planes históricos para que el historial de entrenamientos no pierda contexto.
- El stack se diseña desde el inicio para Vercel + Neon + TypeScript + SSR.
