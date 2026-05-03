import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword } from "../lib/password.ts";

test("hashPassword and verifyPassword roundtrip", () => {
  const passwordHash = hashPassword("super-secret");

  assert.equal(verifyPassword("super-secret", passwordHash), true);
  assert.equal(verifyPassword("wrong-password", passwordHash), false);
});

test("verifyPassword rejects malformed hashes", () => {
  assert.equal(verifyPassword("secret", "invalid-format"), false);
});
