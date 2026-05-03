import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionSecret, isDatabaseConfigured } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { User } from "@/lib/types";
import { requireEmail, requirePassword } from "@/lib/validation";

const COOKIE_NAME = "kinetik_session";

export class AuthenticationError extends Error {}

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

export async function signInWithPassword(email: string, password: string) {
  const normalizedEmail = requireEmail(email);
  const normalizedPassword = requirePassword(password);

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (!user?.passwordHash || !verifyPassword(normalizedPassword, user.passwordHash)) {
    throw new AuthenticationError("Email o contrasena incorrectos.");
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

export async function provisionUser(email: string, password: string) {
  const normalizedEmail = requireEmail(email);
  const normalizedPassword = requirePassword(password);

  return prisma.user.upsert({
    where: {
      email: normalizedEmail
    },
    update: {
      passwordHash: hashPassword(normalizedPassword)
    },
    create: {
      email: normalizedEmail,
      passwordHash: hashPassword(normalizedPassword)
    }
  });
}

export async function updateProvisionedUser(userId: string, input: { email: string; password?: string | null }) {
  const normalizedEmail = requireEmail(input.email);
  const nextPassword = input.password?.trim();

  return prisma.user.update({
    where: {
      id: userId
    },
    data: {
      email: normalizedEmail,
      ...(nextPassword ? { passwordHash: hashPassword(nextPassword) } : {})
    }
  });
}

export async function deleteProvisionedUser(userId: string) {
  return prisma.user.delete({
    where: {
      id: userId
    }
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
