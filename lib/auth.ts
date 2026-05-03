import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionSecret, isDatabaseConfigured } from "@/lib/env";
import type { User } from "@/lib/types";

const COOKIE_NAME = "kinetik_session";

function hashToken(token: string) {
  return createHash("sha256").update(`${token}:${getSessionSecret()}`).digest("hex");
}

function toUser(user: { id: string; email: string; createdAt: Date }): User {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString()
  };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.userSession.findUnique({
    where: {
      tokenHash: hashToken(token)
    },
    include: {
      user: true
    }
  });

  if (!session) {
    return null;
  }

  return toUser(session.user);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function signInWithEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("El email es obligatorio.");
  }

  let user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail
      }
    });
  }

  const token = randomBytes(24).toString("hex");

  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token)
    }
  });

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token && isDatabaseConfigured()) {
    await prisma.userSession.deleteMany({
      where: {
        tokenHash: hashToken(token)
      }
    });
  }

  cookieStore.delete(COOKIE_NAME);
}
