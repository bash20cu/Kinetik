# MUY IMPORTANTE: Home Gym-First + Entrenamiento Libre

## Idea central
La app no debe obligar al usuario a planear antes de entrenar.

El flujo correcto es:

`llego al gimnasio -> abro la app -> empiezo`

El plan, el calendario y la semana sirven como soporte, sugerencia y referencia, pero no como puerta de entrada obligatoria.

## Prioridad de producto
La home debe mostrar primero:

1. `Continuar sesion` si existe una abierta.
2. `Empezar entrenamiento` si hay una rutina sugerida.
3. `Entrenamiento libre` si el usuario quiere arrancar sin depender del calendario.
4. `Lo ultimo que hice` antes que `lo que me toca`.

## Decision de UX
- La app pasa de `plan-first` a `gym-first`.
- El calendario semanal sigue existiendo, pero baja a un plano secundario.
- El historial y la ultima sesion realizada ganan prioridad visual.
- El usuario puede entrenar con dos caminos:
  - sugerencia desde plan activo
  - entrenamiento libre

## Entrenamiento libre
- Se inicia desde un constructor rapido.
- Permite elegir 1 a 3 ejercicios iniciales.
- Usa el mismo flujo de sesion tipo mazo.
- Al guardarse, queda:
  - en historial
  - reutilizable para repetirlo despues

## Nota de implementacion
Para esta iteracion, los entrenamientos libres reutilizables se resuelven reutilizando la estructura existente de `plan -> day -> block -> exercises`, pero tratados como plantillas internas y no como parte del plan activo visible.
