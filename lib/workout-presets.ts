export const VARIANT_OPTIONS = [
  "barra",
  "mancuernas",
  "maquina",
  "smith",
  "polea",
  "peso corporal"
] as const;

export const EXERCISE_GROUPS: Record<string, string[]> = {
  "Pecho": [
    "Press plano",
    "Press plano inclinado",
    "Press declinado",
    "Aperturas",
    "Push ups",
    "Cross over",
    "Pull over",
    "Press pecho maquina"
  ],
  "Espalda": [
    "Dominadas",
    "Jalon abierto",
    "Jalon cerrado",
    "Remo barra",
    "Remo mancuerna",
    "Remo polea",
    "Remo maquina",
    "Remo T maquina",
    "Remo banca declinada",
    "Pull over espalda"
  ],
  "Pierna": [
    "Sentadilla",
    "Sentadilla bulgara",
    "Press de pierna",
    "Extension de rodilla",
    "Peso muerto",
    "Peso muerto rumano",
    "Flexion de rodilla",
    "Elevacion de cadera",
    "Extension cadera",
    "Aductores/Abductores",
    "Zancada",
    "Sentadilla sissy",
    "Pantorrilla de pie",
    "Pantorrilla sentado"
  ],
  "Triceps": [
    "Press frances",
    "Press cerrado",
    "Patada de mula",
    "Extension polea",
    "Copa",
    "Fondos",
    "Diamond push ups"
  ],
  "Biceps": [
    "Flexion barra",
    "Curl mancuerna",
    "Flexion Scott",
    "Flexion polea",
    "Curl martillo",
    "Curl spider",
    "Curl 21",
    "Curl dragon",
    "Curl polea"
  ],
  "Hombros": [
    "Press militar",
    "Press Arnold",
    "Elevacion lateral",
    "Elevacion frontal",
    "Elevacion posterior",
    "Remo al menton",
    "Face pull",
    "Press maquina hombro"
  ],
  "Core": [
    "Crunches",
    "Lumbares",
    "Oblicuos",
    "Elevacion pierna",
    "Flexion tronco cruzado",
    "Tijeras",
    "Plancha",
    "Ab roller",
    "Russian twist"
  ],
  "Cardio": [
    "Cinta",
    "Bicicleta",
    "Eliptica",
    "Remo cardio",
    "Jump rope"
  ],
  "Trapecio": [
    "Encogimientos",
    "Encogimientos barra"
  ]
};

export const EXERCISE_LIBRARY = Object.entries(EXERCISE_GROUPS).flatMap(([groupName, exercises]) =>
  exercises.map((name) => ({ name, groupName }))
);
