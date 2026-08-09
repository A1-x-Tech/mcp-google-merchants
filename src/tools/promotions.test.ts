import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "../client.js";
import { registerPromotionTools } from "./promotions.js";

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;

function harness() {
  const original = globalThis.fetch;
  const calls: { url: string; method: string; body?: unknown }[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    const i = (init ?? {}) as { method?: string; body?: string };
    calls.push({ url: String(url), method: String(i.method), body: i.body ? JSON.parse(i.body) : undefined });
    return new Response('{"ok":true}', { status: 200 });
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
  registerPromotionTools(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("registers the promotion tools", () => {
  const { tools, restore } = harness();
  restore();
  assert.deepEqual(Object.keys(tools).sort(), ["get_promotion", "insert_promotion", "list_promotions"]);
});

test("insert_promotion wraps the promotion and puts dataSource in the body", async () => {
  const { tools, calls, restore } = harness();
  try {
    const promotion = {
      promotionId: "SUMMER10",
      contentLanguage: "en",
      targetCountry: "US",
      redemptionChannel: ["ONLINE"],
    };
    await tools.insert_promotion({ data_source: "9", promotion });
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].url, "https://merchantapi.googleapis.com/promotions/v1/accounts/111/promotions:insert");
    assert.deepEqual(calls[0].body, { promotion, dataSource: "accounts/111/dataSources/9" });
  } finally {
    restore();
  }
});

test("list_promotions hits promotions/v1 with paging", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.list_promotions({ page_size: 25, page_token: "tok" });
    const url = new URL(calls[0].url);
    assert.equal(url.pathname, "/promotions/v1/accounts/111/promotions");
    assert.equal(url.searchParams.get("pageSize"), "25");
    assert.equal(url.searchParams.get("pageToken"), "tok");
  } finally {
    restore();
  }
});

test("get_promotion fetches one promotion by ID", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.get_promotion({ promotion: "SUMMER10" });
    assert.equal(
      calls[0].url,
      "https://merchantapi.googleapis.com/promotions/v1/accounts/111/promotions/SUMMER10",
    );
  } finally {
    restore();
  }
});
