# Home Gym-First + Entrenamiento Libre Reutilizable

## Resumen
Reorientar la app para que la entrada principal no sea el calendario ni la planeación semanal, sino el momento real de uso: `llego al gimnasio -> abro la app -> empiezo`.  
La home dejará de priorizar “lo que toca” y pasará a priorizar `Empezar entrenamiento`, `Continuar sesión` y `Ver lo último que hice`. El plan activo seguirá existiendo, pero como sugerencia secundaria.  
Además, se añadirá un segundo camino de inicio: `Entrenamiento libre`, creado desde un constructor rápido y guardable tanto en historial como como base reutilizable.

## Cambios clave
- Home `/`:
  - Reemplazar el enfoque `Dashboard semanal` por una home `Gym First`.
  - CTA principal: `Empezar entrenamiento`.
  - CTA secundario visible: `Entrenamiento libre`.
  - Si existe una sesión abierta, mostrar `Continuar sesión` con prioridad alta.
  - Mover `Semana de entrenamiento` y `Plan activo` a zonas secundarias o colapsables.
  - Cambiar el bloque principal para mostrar:
    - estado actual: `sin sesión`, `sesión en progreso`, `última sesión`
    - acción inmediata
    - resumen corto de lo último realizado
- Inicio de entrenamiento con plan:
  - Al tocar `Empezar entrenamiento`, la app debe sugerir el siguiente día/bloque del plan activo y crear la sesión sin obligar al usuario a pasar por la grilla semanal.
  - Si no hay plan activo, el CTA principal debe redirigir al flujo de `Entrenamiento libre` en vez de dejar al usuario bloqueado.
- Entrenamiento libre:
  - Añadir un `constructor rápido` previo a la sesión:
    - seleccionar 1-3 ejercicios iniciales
    - opcionalmente definir sets, reps y variante
    - crear sesión y entrar al mazo guiado
  - La sesión libre usa el mismo `SessionWorkoutFlow` ya existente.
  - Al terminar, el resultado se guarda:
    - como sesión en historial
    - y como base reutilizable para futuros entrenamientos libres
- Historial y post-entreno:
  - El home debe mostrar primero lo ya hecho:
    - última sesión
    - cuándo fue
    - qué entrenamiento realizó
  - El calendario semanal deja de ser fuente principal de arranque y pasa a servir como consulta/resumen.

## Interfaces y modelo
- Mantener el flujo de sesión tipo mazo como superficie principal de ejecución.
- Extender el modelo de inicio de sesión para soportar dos orígenes:
  - `planned session` desde plan activo sugerido
  - `free session` desde constructor rápido
- Añadir soporte conceptual para sesiones libres reutilizables:
  - una sesión libre debe poder persistirse y luego aparecer como base para “repetir entrenamiento”
  - no hace falta definir aquí una UI compleja de editor; basta con dejar claro que el entrenamiento libre puede volver a usarse
- Cambios funcionales esperados:
  - nueva acción server o equivalente para `start suggested workout`
  - nueva acción server o equivalente para `create free workout session`
  - datos de home deben incluir:
    - sesión abierta actual
    - última sesión hecha
    - sugerencia del próximo entrenamiento del plan activo
    - lista breve de entrenamientos libres reutilizables o al menos acceso a ellos
- El calendario semanal puede seguir usando `WeeklyCalendarDay`, pero deja de gobernar el flujo principal de entrada.

## Pruebas y escenarios
- Home:
  - usuario con plan activo y sin sesión abierta ve `Empezar entrenamiento` como CTA principal
  - usuario con sesión en progreso ve `Continuar sesión` arriba de todo
  - usuario sin plan activo sigue pudiendo arrancar mediante `Entrenamiento libre`
- Inicio rápido:
  - `Empezar entrenamiento` crea sesión sugerida sin obligar a tocar un día del calendario
  - `Entrenamiento libre` abre constructor rápido y desde ahí entra a la sesión
- Sesión libre:
  - los ejercicios elegidos en el constructor aparecen correctamente en el mazo
  - al guardar la sesión libre, queda visible en historial
  - al terminar, el entrenamiento libre queda reutilizable para futuras sesiones
- Home posterior:
  - después de entrenar, el home refleja `lo que hizo` antes que `lo que hará`
  - la última sesión se muestra con claridad y se puede reabrir o revisar
- Compatibilidad:
  - el flujo actual de sesiones planeadas no se rompe
  - la UI semanal sigue disponible como consulta secundaria

## Supuestos y decisiones
- Esta idea es `muy importante` y debe documentarse como cambio de producto prioritario, no solo como ajuste visual.
- La app pasa de ser `plan-first` a `gym-first`.
- Se soportarán ambas rutas de inicio:
  - entrenamiento sugerido desde plan activo
  - entrenamiento libre
- El entrenamiento libre se inicia con `constructor rápido`, no como sesión vacía.
- El entrenamiento libre se guarda en historial y además queda reutilizable.
- La home debe mostrar primero `acción inmediata` y `lo último que hizo el usuario`, no el calendario como pieza principal.
- El calendario y el plan activo permanecen, pero con protagonismo secundario respecto al inicio rápido del entrenamiento.
