import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "../client.js";
import { registerAccountTools } from "./accounts.js";

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;

/** Registers the tools against a real client with a recording fetch stub. */
function harness(respond: () => Response = () => new Response('{"ok":true}', { status: 200 })) {
  const original = globalThis.fetch;
  const calls: { url: string; method: string; body?: unknown }[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    const i = (init ?? {}) as { method?: string; body?: string };
    calls.push({ url: String(url), method: String(i.method), body: i.body ? JSON.parse(i.body) : undefined });
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
  registerAccountTools(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("registers the account tools", () => {
  const { tools, restore } = harness();
  restore();
  assert.deepEqual(Object.keys(tools).sort(), [
    "get_account",
    "get_homepage",
    "get_shipping_settings",
    "list_accounts",
  ]);
});

test("get_homepage and get_shipping_settings hit the account singletons", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.get_homepage({});
    assert.equal(calls[0].method, "GET");
    assert.equal(calls[0].url, "https://merchantapi.googleapis.com/accounts/v1/accounts/111/homepage");
    await tools.get_shipping_settings({ account: "222" });
    assert.equal(calls[1].method, "GET");
    assert.equal(calls[1].url, "https://merchantapi.googleapis.com/accounts/v1/accounts/222/shippingSettings");
  } finally {
    restore();
  }
});

test("list_accounts passes paging and filter through as query params", async () => {
  const { tools, calls, restore } = harness();
  try {
    const res = await tools.list_accounts({ page_size: 5, page_token: "tok", filter: 'accountName = "*x*"' });
    assert.equal(res.isError, undefined);
    const url = new URL(calls[0].url);
    assert.equal(url.pathname, "/accounts/v1/accounts");
    assert.equal(url.searchParams.get("pageSize"), "5");
    assert.equal(url.searchParams.get("pageToken"), "tok");
    assert.equal(url.searchParams.get("filter"), 'accountName = "*x*"');
  } finally {
    restore();
  }
});

test("get_account uses the default account when none is given", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.get_account({});
    assert.equal(calls[0].url, "https://merchantapi.googleapis.com/accounts/v1/accounts/111");
    await tools.get_account({ account: "222" });
    assert.equal(calls[1].url, "https://merchantapi.googleapis.com/accounts/v1/accounts/222");
  } finally {
    restore();
  }
});

test("an API error surfaces as an isError result, not a throw", async () => {
  const { tools, calls, restore } = harness(
    () =>
      new Response(JSON.stringify({ error: { code: 403, message: "denied", status: "PERMISSION_DENIED" } }), {
        status: 403,
      }),
  );
  try {
    const res = await tools.get_account({});
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /PERMISSION_DENIED/);
    assert.equal(calls.length, 1);
  } finally {
    restore();
  }
});
