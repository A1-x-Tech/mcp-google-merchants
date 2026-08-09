import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "../client.js";
import { registerRawTool } from "./raw.js";

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;

function harness() {
  const original = globalThis.fetch;
  const calls: { url: string; method: string; auth?: string; body?: unknown }[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    const i = (init ?? {}) as { method?: string; headers?: Record<string, string>; body?: string };
    calls.push({
      url: String(url),
      method: String(i.method),
      auth: i.headers?.Authorization,
      body: i.body ? JSON.parse(i.body) : undefined,
    });
    return new Response('{"ok":true}', { status: 200 });
  }) as typeof fetch;
  const client = new MerchantsClient({
    accessToken: "SECRET",
    accountId: "111",
    apiBase: "https://merchantapi.googleapis.com",
    tokenUrl: "https://oauth2.googleapis.com/token",
    maxRetries: 0,
    retryBaseMs: 0,
  });
  const tools: Record<string, Handler> = {};
  const server = { registerTool: (name: string, _cfg: unknown, h: Handler) => { tools[name] = h; } };
  registerRawTool(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("raw_request defaults to GET and sends the Bearer token", async () => {
  const { tools, calls, restore } = harness();
  try {
    const res = await tools.raw_request({ path: "quota/v1/accounts/111/quotas" });
    assert.equal(res.isError, undefined);
    assert.equal(calls[0].method, "GET");
    assert.equal(calls[0].url, "https://merchantapi.googleapis.com/quota/v1/accounts/111/quotas");
    assert.equal(calls[0].auth, "Bearer SECRET");
  } finally {
    restore();
  }
});

test("raw_request passes method, query and body through", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.raw_request({
      path: "products/v1/accounts/111/productInputs:insert",
      method: "POST",
      query: { dataSource: "accounts/111/dataSources/1" },
      body: { offerId: "sku1" },
    });
    const url = new URL(calls[0].url);
    assert.equal(calls[0].method, "POST");
    assert.equal(url.pathname, "/products/v1/accounts/111/productInputs:insert");
    assert.equal(url.searchParams.get("dataSource"), "accounts/111/dataSources/1");
    assert.deepEqual(calls[0].body, { offerId: "sku1" });
  } finally {
    restore();
  }
});

test("raw_request rejects an absolute path as an isError result, without fetching", async () => {
  for (const evil of ["https://evil.example/steal", "http://evil.example/x", "\\\\evil.example/x"]) {
    const { tools, calls, restore } = harness();
    try {
      const res = await tools.raw_request({ path: evil });
      assert.equal(res.isError, true, `${JSON.stringify(evil)} should be isError`);
      assert.match(res.content[0].text, /foreign origin/);
      assert.equal(calls.length, 0, `must not fetch for ${JSON.stringify(evil)}`);
    } finally {
      restore();
    }
  }
});
