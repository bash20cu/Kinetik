import { randomBytes, scryptSync } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const EXERCISES = [
  // Pecho
  { name: "Press plano", groupName: "Pecho", defaultSets: 4, defaultReps: "12", defaultRest: 90, variant: "Barra" },
  { name: "Press plano inclinado", groupName: "Pecho", defaultSets: 3, defaultReps: "10", defaultRest: 90, variant: "Barra" },
  { name: "Press declinado", groupName: "Pecho", defaultSets: 3, defaultReps: "12", defaultRest: 90, variant: "Barra" },
  { name: "Aperturas", groupName: "Pecho", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Push ups", groupName: "Pecho", defaultSets: 3, defaultReps: "20", defaultRest: 60 },
  { name: "Cross over", groupName: "Pecho", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Polea" },
  { name: "Pull over", groupName: "Pecho", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Press pecho maquina", groupName: "Pecho", defaultSets: 3, defaultReps: "12", defaultRest: 90, variant: "Maquina" },

  // Espalda
  { name: "Dominadas", groupName: "Espalda", defaultSets: 4, defaultReps: "8", defaultRest: 90 },
  { name: "Jalon abierto", groupName: "Espalda", defaultSets: 4, defaultReps: "10", defaultRest: 90, variant: "Polea" },
  { name: "Jalon cerrado", groupName: "Espalda", defaultSets: 3, defaultReps: "12", defaultRest: 90, variant: "Polea" },
  { name: "Remo barra", groupName: "Espalda", defaultSets: 4, defaultReps: "10", defaultRest: 90, variant: "Barra" },
  { name: "Remo mancuerna", groupName: "Espalda", defaultSets: 3, defaultReps: "10", defaultRest: 90, variant: "Mancuernas" },
  { name: "Remo polea", groupName: "Espalda", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Polea" },
  { name: "Remo maquina", groupName: "Espalda", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Maquina" },
  { name: "Remo T maquina", groupName: "Espalda", defaultSets: 3, defaultReps: "10", defaultRest: 90, variant: "Maquina" },
  { name: "Remo banca declinada", groupName: "Espalda", defaultSets: 3, defaultReps: "10", defaultRest: 90, variant: "Mancuernas" },
  { name: "Pull over espalda", groupName: "Espalda", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Polea" },

  // Pierna
  { name: "Sentadilla", groupName: "Pierna", defaultSets: 4, defaultReps: "10", defaultRest: 120, variant: "Barra" },
  { name: "Sentadilla bulgara", groupName: "Pierna", defaultSets: 3, defaultReps: "10", defaultRest: 90 },
  { name: "Press de pierna", groupName: "Pierna", defaultSets: 4, defaultReps: "12", defaultRest: 90, variant: "Maquina" },
  { name: "Extension de rodilla", groupName: "Pierna", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Maquina" },
  { name: "Peso muerto", groupName: "Pierna", defaultSets: 4, defaultReps: "8", defaultRest: 120, variant: "Barra" },
  { name: "Peso muerto rumano", groupName: "Pierna", defaultSets: 3, defaultReps: "10", defaultRest: 90, variant: "Barra" },
  { name: "Flexion de rodilla", groupName: "Pierna", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Maquina" },
  { name: "Elevacion de cadera", groupName: "Pierna", defaultSets: 3, defaultReps: "12", defaultRest: 60 },
  { name: "Extension cadera", groupName: "Pierna", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Polea" },
  { name: "Aductores/Abductores", groupName: "Pierna", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Maquina" },
  { name: "Zancada", groupName: "Pierna", defaultSets: 3, defaultReps: "10", defaultRest: 90, variant: "Mancuernas" },
  { name: "Sentadilla sissy", groupName: "Pierna", defaultSets: 3, defaultReps: "8", defaultRest: 90 },
  { name: "Pantorrilla de pie", groupName: "Pierna", defaultSets: 4, defaultReps: "15", defaultRest: 60, variant: "Maquina" },
  { name: "Pantorrilla sentado", groupName: "Pierna", defaultSets: 3, defaultReps: "15", defaultRest: 60, variant: "Maquina" },

  // Triceps
  { name: "Press frances", groupName: "Triceps", defaultSets: 3, defaultReps: "12", defaultRest: 60 },
  { name: "Press cerrado", groupName: "Triceps", defaultSets: 3, defaultReps: "10", defaultRest: 90, variant: "Barra" },
  { name: "Patada de mula", groupName: "Triceps", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Extension polea", groupName: "Triceps", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Polea" },
  { name: "Copa", groupName: "Triceps", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Fondos", groupName: "Triceps", defaultSets: 3, defaultReps: "10", defaultRest: 60 },
  { name: "Diamond push ups", groupName: "Triceps", defaultSets: 3, defaultReps: "12", defaultRest: 60 },

  // Biceps
  { name: "Flexion barra", groupName: "Biceps", defaultSets: 3, defaultReps: "10", defaultRest: 60, variant: "Barra" },
  { name: "Curl mancuerna", groupName: "Biceps", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Flexion Scott", groupName: "Biceps", defaultSets: 3, defaultReps: "10", defaultRest: 60 },
  { name: "Flexion polea", groupName: "Biceps", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Polea" },
  { name: "Curl martillo", groupName: "Biceps", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Curl spider", groupName: "Biceps", defaultSets: 3, defaultReps: "10", defaultRest: 60, variant: "Mancuernas" },
  { name: "Curl 21", groupName: "Biceps", defaultSets: 1, defaultReps: "21", defaultRest: 90, variant: "Barra" },
  { name: "Curl dragon", groupName: "Biceps", defaultSets: 3, defaultReps: "10", defaultRest: 60, variant: "Mancuernas" },
  { name: "Curl polea", groupName: "Biceps", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Polea" },

  // Hombros
  { name: "Press militar", groupName: "Hombros", defaultSets: 4, defaultReps: "10", defaultRest: 90, variant: "Barra" },
  { name: "Press Arnold", groupName: "Hombros", defaultSets: 3, defaultReps: "10", defaultRest: 90, variant: "Mancuernas" },
  { name: "Elevacion lateral", groupName: "Hombros", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Elevacion frontal", groupName: "Hombros", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Elevacion posterior", groupName: "Hombros", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Remo al menton", groupName: "Hombros", defaultSets: 3, defaultReps: "10", defaultRest: 60, variant: "Barra" },
  { name: "Face pull", groupName: "Hombros", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Polea" },
  { name: "Press maquina hombro", groupName: "Hombros", defaultSets: 3, defaultReps: "12", defaultRest: 90, variant: "Maquina" },

  // Core
  { name: "Crunches", groupName: "Core", defaultSets: 3, defaultReps: "20", defaultRest: 45 },
  { name: "Lumbares", groupName: "Core", defaultSets: 3, defaultReps: "15", defaultRest: 45 },
  { name: "Oblicuos", groupName: "Core", defaultSets: 3, defaultReps: "15", defaultRest: 45 },
  { name: "Elevacion pierna", groupName: "Core", defaultSets: 3, defaultReps: "12", defaultRest: 45 },
  { name: "Flexion tronco cruzado", groupName: "Core", defaultSets: 3, defaultReps: "12", defaultRest: 45 },
  { name: "Tijeras", groupName: "Core", defaultSets: 3, defaultReps: "30s", defaultRest: 45 },
  { name: "Plancha", groupName: "Core", defaultSets: 3, defaultReps: "45s", defaultRest: 45 },
  { name: "Ab roller", groupName: "Core", defaultSets: 3, defaultReps: "10", defaultRest: 45 },
  { name: "Russian twist", groupName: "Core", defaultSets: 3, defaultReps: "20", defaultRest: 45, variant: "Mancuernas" },

  // Cardio
  { name: "Cinta", groupName: "Cardio", defaultSets: 1, defaultReps: "20min", defaultRest: 0 },
  { name: "Bicicleta", groupName: "Cardio", defaultSets: 1, defaultReps: "15min", defaultRest: 0 },
  { name: "Eliptica", groupName: "Cardio", defaultSets: 1, defaultReps: "20min", defaultRest: 0 },
  { name: "Remo cardio", groupName: "Cardio", defaultSets: 1, defaultReps: "15min", defaultRest: 0 },
  { name: "Jump rope", groupName: "Cardio", defaultSets: 5, defaultReps: "2min", defaultRest: 30 },

  // Trapecio
  { name: "Encogimientos", groupName: "Trapecio", defaultSets: 3, defaultReps: "12", defaultRest: 60, variant: "Mancuernas" },
  { name: "Encogimientos barra", groupName: "Trapecio", defaultSets: 3, defaultReps: "10", defaultRest: 60, variant: "Barra" },
];

const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL || "admin@kinetik.app";
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || "kinetik123";

async function main() {
  console.log("Seeding ExerciseLibrary...");

  for (const exercise of EXERCISES) {
    await prisma.exerciseLibrary.upsert({
      where: { name: exercise.name },
      update: exercise,
      create: exercise
    });
  }

  const exerciseCount = await prisma.exerciseLibrary.count();
  console.log(`Done. ${exerciseCount} exercises in library.`);

  console.log(`Seeding default user: ${SEED_USER_EMAIL}`);
  const user = await prisma.user.upsert({
    where: { email: SEED_USER_EMAIL },
    update: { passwordHash: hashPassword(SEED_USER_PASSWORD) },
    create: {
      email: SEED_USER_EMAIL,
      passwordHash: hashPassword(SEED_USER_PASSWORD)
    }
  });
  console.log(`User ready: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
