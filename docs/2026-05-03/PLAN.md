# Rediseño Mobile-First: Athletic Editorial + Calendario + Sesión Intuitiva

## Resumen
Evolucionar la app desde un dashboard/formulario hacia una interfaz de entrenamiento mobile-first, con una dirección visual `athletic editorial`, un calendario semanal en la home y una pantalla de sesión pensada para usar mientras entrenas. La tipografía recomendada es:
- Display: `Bebas Neue` o `Oswald` refinada como fallback inmediato
- Body/UI: `Manrope` o `IBM Plex Sans`
La combinación preferida para la siguiente iteración es `Bebas Neue + Manrope`: titulares potentes, números memorables y texto secundario limpio.

## Cambios clave
- Dirección visual:
  - Mantener `shadcn/ui` como sistema base y reorientar tokens para una estética más editorial/deportiva.
  - Usar una tipografía display condensada para títulos, métricas, días y temporizador.
  - Reservar la tipografía de cuerpo para labels, ayudas y formularios.
  - Hacer que los números sean protagonistas: fecha, día, reps, descanso, sets.
- Dashboard principal:
  - Convertir `/` en centro operativo.
  - Añadir calendario semanal visible en la home con estados por día:
    - día de rutina asignado
    - sesión completada
    - sesión pendiente
    - hoy
  - Mostrar debajo del calendario una tarjeta “Entrena hoy” con CTA principal.
  - Mantener acceso a última sesión y plan activo, pero con menos protagonismo que hoy.
- Pantalla de sesión:
  - Rediseñar `/sesion/[id]` como flujo de entrenamiento, no como formulario largo.
  - Añadir cronómetro de descanso dentro de la sesión:
    - comportamiento elegido: arranque automático al completar serie/acción
    - mantener controles de pausar, reiniciar y presets visibles
  - Añadir contador de repeticiones grande y táctil:
    - `+1`, `-1`, reset
    - visible por ejercicio o por set actual
  - Reorganizar cada ejercicio como tarjeta operativa:
    - nombre
    - variante
    - reps objetivo
    - peso
    - estado
    - acciones rápidas
  - Reducir el peso visual de campos secundarios como notas largas.
- Navegación móvil:
  - Mantener topbar colapsable, pero reforzar el enfoque mobile-first:
    - home = semana + hoy
    - sesión = ejecución
    - rutina = consulta
    - historial = revisión
- Componentes nuevos:
  - `WeeklyCalendarCard`
  - `TodayWorkoutHero`
  - `RestTimerCard`
  - `RepCounter`
  - `ExerciseActionCard`
  - `SessionProgressBar`
  - posible `WorkoutMiniDock` fijo abajo en móvil para acciones rápidas

## Interfaces y comportamiento
- Tipografía:
  - cargar display y body desde `next/font`
  - exponer tokens semánticos para headings, stats y labels
- Calendario semanal:
  - no requiere cambio de esquema para v1 si se deriva desde `RoutinePlan` + `WorkoutSession`
  - mostrar 7 días con:
    - nombre corto
    - número de fecha
    - estado visual
    - click/tap para abrir o crear sesión correspondiente
- Cronómetro de descanso:
  - componente cliente con estado local
  - presets mínimos: `30s`, `60s`, `90s`, `120s`
  - auto-start cuando se marque una serie/acción completada
  - no persistir en base en v1
- Contador de repeticiones:
  - componente cliente local por ejercicio o set actual
  - puede poblar el campo `reps` o una UI derivada antes de guardar
  - no necesita nuevo modelo persistente en v1 si sigue sincronizando al submit
- Estados visuales:
  - `completed`, `in_progress`, `planned`, `skipped` deben mapearse a badges y bloques más claros
  - hoy y sesión activa deben tener acento fuerte y legibilidad inmediata

## Pruebas y escenarios
- Móvil:
  - home carga con calendario semanal usable sin scroll confuso
  - menú y alertas siguen colapsándose correctamente
  - sesión permite arrancar descanso y sumar reps con una mano
- Sesión:
  - al marcar progreso, el cronómetro arranca automáticamente
  - el contador de reps actualiza el valor esperado del ejercicio sin romper guardado
  - guardar sesión conserva estados, peso, reps y notas existentes
- Dashboard:
  - el calendario refleja correctamente días con sesión completada o pendiente
  - desde el día actual se puede iniciar o retomar sesión
- UI:
  - tipografía elegida se aplica consistentemente a títulos, métricas y texto base
  - contraste y foco visible siguen cumpliendo accesibilidad básica
- Compatibilidad:
  - dark/light theme sigue funcionando con `shadcn/ui`
  - SSR no se rompe; timer y rep counter quedan como componentes cliente aislados

## Supuestos y decisiones
- Estilo elegido: `athletic editorial`.
- Calendario principal: integrado en el dashboard.
- Cronómetro: auto-start tras completar serie/acción.
- Prioridad de sesión: descanso + reps por encima de notas o analítica avanzada.
- No se agrega persistencia nueva para timer ni rep counter en esta fase; se resuelven como UX operativa sobre los datos actuales.
- La primera mejora tipográfica se plantea con `Bebas Neue + Manrope`; si no se quiere añadir fuentes externas, fallback aceptable: `Oswald + IBM Plex Sans`.
