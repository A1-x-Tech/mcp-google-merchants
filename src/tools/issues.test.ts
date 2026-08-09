import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "../client.js";
import { registerIssueTools } from "./issues.js";

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;

function harness() {
  const original = globalThis.fetch;
  const calls: { url: string; method: string }[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    calls.push({ url: String(url), method: String((init as { method?: string })?.method) });
    return new Response('{"aggregateProductStatuses":[]}', { status: 200 });
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
  registerIssueTools(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("registers the issues tool", () => {
  const { tools, restore } = harness();
  restore();
  assert.deepEqual(Object.keys(tools), ["list_product_issues"]);
});

test("list_product_issues hits issueresolution/v1 with the filter", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.list_product_issues({
      filter: 'reporting_context = "SHOPPING_ADS" AND country = "US"',
      page_size: 50,
    });
    const url = new URL(calls[0].url);
    assert.equal(calls[0].method, "GET");
    assert.equal(url.pathname, "/issueresolution/v1/accounts/111/aggregateProductStatuses");
    assert.equal(url.searchParams.get("filter"), 'reporting_context = "SHOPPING_ADS" AND country = "US"');
    assert.equal(url.searchParams.get("pageSize"), "50");
  } finally {
    restore();
  }
});
