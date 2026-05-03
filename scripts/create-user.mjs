import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

import { PrismaClient } from "@prisma/client";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const [, , emailArg, passwordArg] = process.argv;
const email = normalizeEmail(emailArg ?? "");
const password = (passwordArg ?? "").trim();

if (!email || !password) {
  console.error("Uso: npm run user:create -- usuario@correo.com 'tu-password'");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en el entorno.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      passwordHash: hashPassword(password)
    },
    create: {
      email,
      passwordHash: hashPassword(password)
    }
  });

  console.log(`Usuario listo: ${user.email}`);
} finally {
  await prisma.$disconnect();
}
