# Flujo de Entrenamiento Tipo Mazo Guiado

## Resumen
Rediseñar `/sesion/[id]` para que deje de sentirse como una lista/formulario y pase a ser un flujo de ejecución guiado, mobile-first, con un `mazo activo` de tarjetas: una tarjeta principal al frente, 2-3 detrás como vista previa, casi sin scroll.  
La interacción base será: `hacer set -> tocar "Serie hecha" -> arranca descanso -> al terminar el descanso se promueve la siguiente tarjeta/serie -> mensaje de refuerzo -> continuar`.  
El registro por defecto será liviano: marcar la serie hecha y dejar `reps`/`peso` como controles rápidos opcionales, sin obligar captura completa en cada set.

## Cambios de implementación
- Rehacer `SessionWorkoutFlow` para que maneje un `activeCard`, una `deckPreview` y un `restOverlay`, en lugar de renderizar toda la secuencia vertical como contenido principal.
- Mantener visibles solo:
  - tarjeta actual
  - contador de progreso global
  - mini preview de las próximas 2-3 tarjetas apiladas
  - dock fijo inferior en móvil con acciones rápidas
- Convertir `ExerciseActionCard` en tarjeta operativa principal:
  - nombre del ejercicio, variante, bloque y objetivo
  - contador grande de sets completados vs objetivo
  - CTA principal `Serie hecha`
  - CTA secundaria `Completar ejercicio`
  - inputs rápidos opcionales para `reps` y `peso`
  - nota breve colapsable, no protagonista
- Integrar el descanso dentro del flujo, no como tarjeta lateral separada:
  - al tocar `Serie hecha`, abrir estado de descanso sobre la misma experiencia
  - mostrar reloj grande, progreso circular o barra, preset rápido y botón de pausar/reanudar
  - al terminar el timer, volver automáticamente al ejercicio actual o promover la siguiente tarjeta si el ejercicio quedó completo
- Añadir refuerzo motivacional en dos niveles:
  - micro-feedback por set: mensajes cortos tipo `Bien, vamos por la siguiente`
  - cierre de rutina: pantalla/estado de celebración con resumen simple y CTA para volver al inicio o revisar historial
- Mantener una vista resumida de ejercicios completados detrás del mazo para dar sensación de avance sin obligar scroll.
- En escritorio, conservar la misma lógica pero con composición más ancha:
  - tarjeta principal al centro
  - preview lateral o inferior
  - dock de descanso y progreso sin romper el foco
- No introducir una navegación tipo carrusel manual libre; el avance es guiado por estado de sets y descanso, no por swipe arbitrario.

## Interfaces y tipos
- Extender el estado cliente de sesión con una máquina de flujo local:
  - `phase: "exercise" | "rest" | "complete"`
  - `activeExerciseIndex`
  - `pendingAdvanceIndex | null`
  - `motivationalMessage | null`
- Mantener `SessionDetail` y `ExerciseLog` sin cambios de esquema para esta iteración.
- Seguir enviando al server los mismos campos persistidos:
  - `setsCompleted`
  - `reps`
  - `weight`
  - `status`
  - `note`
- Añadir solo estado de UI local para:
  - permisos de notificación
  - timer activo/pausado
  - mensaje de recompensa
- Notificaciones:
  - implementar `Web Notifications` solo como mejora progresiva cuando el navegador lo permita
  - mostrar prompt de permiso al iniciar sesión de entrenamiento o en el primer descanso
  - fallback obligatorio: aviso visual y sonoro dentro de la sesión cuando el descanso termina

## Pruebas y escenarios
- Inicio de sesión:
  - al abrir `/sesion/[id]`, se muestra una sola tarjeta principal y preview apilado de las siguientes
  - no hace falta scroll para operar el flujo principal en móvil
- Progreso por sets:
  - `Serie hecha` incrementa sets, cambia estado a `in_progress` o `completed`, y abre descanso
  - si aún faltan sets del mismo ejercicio, al terminar el descanso vuelve al mismo ejercicio
  - si se completó el último set, al terminar el descanso avanza al siguiente ejercicio
- Fin de ejercicio y rutina:
  - `Completar ejercicio` marca el ejercicio y prepara el avance
  - al terminar el último ejercicio, aparece estado final de celebración y progreso completo
- Persistencia:
  - guardar sesión conserva sets, reps, peso, notas y estados actuales
  - recargar la página rehidrata correctamente el ejercicio activo a partir del primer no completado
- Notificaciones:
  - en desktop compatible, si el permiso fue concedido, se emite notificación al terminar descanso
  - sin permiso o en entorno no compatible, aparece fallback in-app sin romper el flujo
- Responsive:
  - móvil usa dock fijo inferior y tarjeta dominante
  - escritorio no vuelve a una lista larga; sigue siendo experiencia guiada

## Supuestos y decisiones
- Patrón elegido: `mazo activo` con vista previa apilada; no lista vertical larga.
- Registro elegido: `solo set hecho` como acción principal; `reps` y `peso` quedan opcionales y rápidos.
- El descanso se dispara automáticamente después de marcar una serie.
- El flujo guía de forma secuencial al siguiente ejercicio; no se habilita navegación libre entre todas las tarjetas.
- No se agrega persistencia nueva para timer, mensajes o notificaciones en esta fase.
- Como el repo no tiene base PWA hoy, no se planifica push real para iOS en esta iteración.
- Para iPhone, el alcance de esta fase es aviso dentro de la app web; soporte de notificación push en iOS queda como fase posterior con PWA/instalación.
