import test from "node:test";
import assert from "node:assert/strict";

import { parsePlanPayload, parseSessionStatus, requireEmail } from "../lib/validation.ts";

test("requireEmail normalizes valid emails", () => {
  assert.equal(requireEmail("  USER@Example.com "), "user@example.com");
});

test("parseSessionStatus accepts valid statuses", () => {
  assert.equal(parseSessionStatus("completed"), "completed");
});

test("parsePlanPayload throws on invalid JSON", () => {
  assert.throws(() => parsePlanPayload("{invalid"), /interpretar la rutina/i);
});
