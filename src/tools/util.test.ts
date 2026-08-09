import { test } from "node:test";
import assert from "node:assert/strict";
import { accountParam, DESTRUCTIVE, fail, ok, pageSizeParam, READ_ONLY, WRITE } from "./util.js";

test("ok emits compact JSON; fail flags isError", () => {
  assert.equal((ok({ a: 1 }).content[0] as { text: string }).text, '{"a":1}');
  const f = fail(new Error("boom"));
  assert.equal(f.isError, true);
  assert.match((f.content[0] as { text: string }).text, /boom/);
});

test("ok survives an empty (undefined) response body", () => {
  assert.equal((ok(undefined).content[0] as { text: string }).text, "null");
});

test("fail appends the underlying cause when present", () => {
  const err = new Error("timeout", { cause: new Error("ECONNRESET") });
  const f = fail(err);
  assert.match((f.content[0] as { text: string }).text, /timeout \(ECONNRESET\)/);
});

test("annotation constants set all four hints explicitly", () => {
  assert.deepEqual(READ_ONLY, {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  });
  assert.deepEqual(WRITE, {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  });
  assert.deepEqual(DESTRUCTIVE, {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
  });
});

test("schema factories return independent schemas (no shared $ref)", () => {
  assert.notEqual(accountParam(), accountParam());
  assert.notEqual(pageSizeParam(100, 25), pageSizeParam(100, 25));
});
