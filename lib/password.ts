import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

function encodeKey(password: string, salt: string) {
  return scryptSync(password, salt, KEY_LENGTH).toString("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = encodeKey(password, salt);
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [prefix, salt, storedHash] = passwordHash.split("$");

  if (prefix !== HASH_PREFIX || !salt || !storedHash) {
    return false;
  }

  const candidateBuffer = Buffer.from(encodeKey(password, salt), "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (candidateBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, storedBuffer);
}
