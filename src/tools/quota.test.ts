import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "../client.js";
import { registerQuotaTools } from "./quota.js";

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;

function harness(respond: () => Response = () => new Response('{"ok":true}', { status: 200 })) {
  const original = globalThis.fetch;
  const calls: { url: string; method: string }[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    const i = (init ?? {}) as { method?: string };
    calls.push({ url: String(url), method: String(i.method) });
    return respond();
  }) as typeof fetch;
  const client = new MerchantsClient({
    accessToken: "T",
    accountId: "111",
    apiBase: "https://merchantapi.googleapis.com",
    tokenUrl: "https://oauth2.googleapis.com/token",
    maxRetries: 0,
    retryBaseMs: 0,
  });
  const tools: Record<string, Handler> = {};
  const server = { registerTool: (name: string, _cfg: unknown, h: Handler) => { tools[name] = h; } };
  registerQuotaTools(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("registers the quota tools", () => {
  const { tools, restore } = harness();
  restore();
  assert.deepEqual(Object.keys(tools).sort(), ["list_method_quotas"]);
});

test("list_method_quotas hits quota/v1 with paging", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.list_method_quotas({ page_size: 10, page_token: "tok" });
    const url = new URL(calls[0].url);
    assert.equal(calls[0].method, "GET");
    assert.equal(url.pathname, "/quota/v1/accounts/111/quotas");
    assert.equal(url.searchParams.get("pageSize"), "10");
    assert.equal(url.searchParams.get("pageToken"), "tok");
  } finally {
    restore();
  }
});

test("a quota API error is an isError result, not a throw", async () => {
  const { tools, restore } = harness(
    () =>
      new Response(JSON.stringify({ error: { code: 403, message: "denied", status: "PERMISSION_DENIED" } }), {
        status: 403,
      }),
  );
  try {
    const res = await tools.list_method_quotas({});
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /PERMISSION_DENIED/);
  } finally {
    restore();
  }
});
