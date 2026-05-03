export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return value;
}

export function getSessionSecret() {
  const value = process.env.SESSION_SECRET;

  if (!value) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }

  return value;
}
