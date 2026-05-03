export const VARIANT_OPTIONS = [
  "barra",
  "mancuernas",
  "maquina",
  "smith",
  "polea",
  "peso corporal"
] as const;

export const EXERCISE_LIBRARY = [
  { name: "Press plano", groupName: "Pecho" },
  { name: "Press inclinado", groupName: "Pecho" },
  { name: "Press declinado", groupName: "Pecho" },
  { name: "Aperturas", groupName: "Pecho" },
  { name: "Push ups", groupName: "Pecho" },
  { name: "Cross over", groupName: "Pecho" },
  { name: "Pull over", groupName: "Pecho" },
  { name: "Dominadas", groupName: "Espalda" },
  { name: "Jalon abierto", groupName: "Espalda" },
  { name: "Jalon cerrado", groupName: "Espalda" },
  { name: "Remo barra", groupName: "Espalda" },
  { name: "Remo mancuerna", groupName: "Espalda" },
  { name: "Remo polea", groupName: "Espalda" },
  { name: "Remo maquina", groupName: "Espalda" },
  { name: "Remo T maquina", groupName: "Espalda" },
  { name: "Remo banca declinada", groupName: "Espalda" },
  { name: "Sentadilla", groupName: "Pierna" },
  { name: "Sentadilla bulgara", groupName: "Pierna" },
  { name: "Press de pierna", groupName: "Pierna" },
  { name: "Extension de rodilla", groupName: "Pierna" },
  { name: "Peso muerto", groupName: "Pierna" },
  { name: "Flexion de rodilla", groupName: "Pierna" },
  { name: "Elevacion de cadera", groupName: "Pierna" },
  { name: "Extension cadera", groupName: "Pierna" },
  { name: "Aductores/Abductores", groupName: "Pierna" },
  { name: "Zancada", groupName: "Pierna" },
  { name: "Sentadilla sissy", groupName: "Pierna" },
  { name: "Press frances", groupName: "Triceps" },
  { name: "Press cerrado", groupName: "Triceps" },
  { name: "Patada de mula", groupName: "Triceps" },
  { name: "Extension polea", groupName: "Triceps" },
  { name: "Copa", groupName: "Triceps" },
  { name: "Fondos", groupName: "Triceps" },
  { name: "Diamond push ups", groupName: "Triceps" },
  { name: "Flexion barra", groupName: "Biceps" },
  { name: "Curl mancuerna", groupName: "Biceps" },
  { name: "Flexion Scott", groupName: "Biceps" },
  { name: "Flexion polea", groupName: "Biceps" },
  { name: "Flexion cuclillas", groupName: "Biceps" },
  { name: "Curl martillo", groupName: "Biceps" },
  { name: "Curl spider", groupName: "Biceps" },
  { name: "Curl 21", groupName: "Biceps" },
  { name: "Curl dragon", groupName: "Biceps" },
  { name: "Press militar", groupName: "Hombros" },
  { name: "Press militar cerrado", groupName: "Hombros" },
  { name: "Elevacion lateral", groupName: "Hombros" },
  { name: "Elevacion frontal", groupName: "Hombros" },
  { name: "Elevacion posterior", groupName: "Hombros" },
  { name: "Rowing", groupName: "Hombros" },
  { name: "Face pull", groupName: "Hombros" },
  { name: "Crunches", groupName: "Core" },
  { name: "Lumbares", groupName: "Core" },
  { name: "Oblicuos", groupName: "Core" },
  { name: "Elevacion pierna", groupName: "Core" },
  { name: "Flexion tronco cruzado", groupName: "Core" },
  { name: "Tijeras", groupName: "Core" },
  { name: "Plancha", groupName: "Core" },
  { name: "Ab roller", groupName: "Core" },
  { name: "Abs paquete", groupName: "Core" }
] as const;

export const EXERCISE_GROUPS = EXERCISE_LIBRARY.reduce<Record<string, string[]>>((groups, exercise) => {
  if (!groups[exercise.groupName]) {
    groups[exercise.groupName] = [];
  }

  groups[exercise.groupName].push(exercise.name);
  return groups;
}, {});
