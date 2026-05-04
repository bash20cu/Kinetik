# Estado MVP Gym-First y Siguientes Pasos

## Resumen
Este documento captura el estado actual del producto despues de la iteracion `gym-first`.

La app deja de comportarse como una herramienta centrada en planear antes de entrenar y pasa a responder al momento real de uso:

`llego al gym -> abro la app -> empiezo -> agrego ejercicios segun lo que hago -> guardo`

La idea validada es que la rutina puede construirse progresivamente desde sesiones reales. El usuario no necesita tener toda la semana perfecta antes de entrenar; puede empezar con pocos ejercicios, registrar lo que hizo y reutilizar esa base despues.

## Que se implemento
- Home con prioridad en `Continuar sesion`, `Empezar entrenamiento` y `Entrenamiento libre`.
- Entrenamiento libre reutilizable usando la estructura interna `plan -> day -> block -> exercises`.
- Sesion tipo mazo guiado con fases locales: `exercise`, `record`, `rest`, `complete` y `add_exercise`.
- Registro post-set separado de la tarjeta principal para evitar formularios largos durante el set.
- Descanso integrado con timer, presets, sonido, vibracion y fallback visual dentro de la app.
- Cierre de sesion con acciones claras: guardar, ver historial o empezar otro entrenamiento.
- Agregar ejercicio durante la sesion como una tarjeta separada del mazo, sin mezclarlo con la tarjeta de cierre.
- Notificaciones web como mejora progresiva, con limitacion documentada para iOS cuando no existe PWA instalada.
- Alertas internas corregidas para poder marcarse como leidas desde movil.
- UI mobile ajustada para iPhone, reduciendo scroll innecesario en el flujo principal.

## Como va la app hoy
El MVP ya es usable para ir al gym y registrar un entrenamiento real.

El usuario puede arrancar con un entrenamiento libre o sugerido, completar sets, registrar reps/peso/notas, descansar y seguir. Si termina lo planeado pero quiere continuar, puede agregar otro ejercicio y volver al mazo sin cerrar la sesion.

Hoy se guarda:
- sesiones realizadas o en progreso
- sets completados por ejercicio
- reps como texto libre
- peso como texto libre
- notas por ejercicio
- notas generales de sesion
- estado de sesion y estado de ejercicio

Todavia no se guarda de forma estructurada:
- cada set individual
- duracion real total de la sesion
- tiempo real por set
- descanso real por set
- volumen calculable confiable
- progresion automatica de cargas

## Modelo de datos actual
Las rutinas planeadas y los entrenamientos libres reutilizables usan las mismas entidades base:

`RoutinePlan -> RoutineDay -> RoutineBlock -> Exercise`

Las sesiones ejecutadas usan `WorkoutSession`.

El progreso por ejercicio usa `ExerciseLog`, donde se guarda `setsCompleted`, `reps`, `weight`, `status` y `note`.

El entrenamiento libre se guarda como un plan archivado reutilizable. Esto permite repetirlo despues sin mostrarlo como plan activo principal.

Cuando el usuario agrega un ejercicio durante una sesion, la app crea un nuevo `Exercise` en el dia/bloque actual y redirige de vuelta a la misma sesion para continuar el mazo.

## Proximos pasos recomendados
### Prioridad 1: Construccion progresiva de rutina
- Permitir guardar una sesion completa como rutina reutilizable con nombre.
- Permitir agregar ejercicios hechos a un dia existente, por ejemplo `Agregar a lunes` o `Agregar a pecho`.
- Mostrar desde historial una accion tipo `Usar esta sesion para construir rutina`.

### Prioridad 2: Mejorar experiencia durante sesion
- Pulir la tarjeta `add_exercise` para que sea tan rapida como el constructor inicial.
- Agregar accion explicita `Saltar ejercicio` si se quiere usar el estado `skipped`.
- Revisar el copy final para dejar claro si el usuario esta guardando sesion, rutina o plantilla.

### Prioridad 3: Metricas reales
- Disenar una futura tabla `ExerciseSetLog` para guardar set por set.
- Capturar reps, peso, tiempo de set y descanso real por set.
- Calcular volumen, progresion y ultimas cargas de forma confiable.

### Prioridad 4: iOS / PWA
- Evaluar soporte PWA si se quieren notificaciones reales en iPhone.
- Agregar manifest, service worker y Web Push solo cuando sea prioridad clara.
- Mantener fallback in-app mientras tanto.

## Pruebas y escenarios importantes
- Usuario llega sin rutina completa y empieza `Entrenamiento libre`.
- Usuario completa un ejercicio y agrega otro sin cerrar sesion.
- Usuario termina sesion y guarda al Home.
- Usuario termina sesion y decide empezar otro entrenamiento.
- Usuario guarda sesion y luego revisa historial.
- Usuario marca alertas como leidas en movil.
- Usuario en iPhone recibe fallback visual/sonoro en vez de push nativo.

## Supuestos
- El objetivo inmediato es MVP usable en gym, no analitica avanzada.
- No se requiere migracion de base de datos para este estado del producto.
- El documento es descriptivo y de producto, no una guia tecnica exhaustiva.
- La rutina debe poder emerger desde lo que el usuario realmente hizo, no solo desde una planeacion previa.
