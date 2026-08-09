import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "../client.js";
import { registerReportTools } from "./reports.js";

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;

function harness() {
  const original = globalThis.fetch;
  const calls: { url: string; method: string; body?: unknown }[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    const i = (init ?? {}) as { method?: string; body?: string };
    calls.push({ url: String(url), method: String(i.method), body: i.body ? JSON.parse(i.body) : undefined });
    return new Response('{"results":[]}', { status: 200 });
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
  registerReportTools(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("registers the report tools", () => {
  const { tools, restore } = harness();
  restore();
  assert.deepEqual(Object.keys(tools).sort(), ["price_competitiveness", "price_insights", "search_reports"]);
});

test("search_reports POSTs the raw MCQL to reports:search", async () => {
  const { tools, calls, restore } = harness();
  try {
    const query =
      "SELECT offer_id, clicks FROM product_performance_view " +
      "WHERE date BETWEEN '2026-07-01' AND '2026-07-31'";
    await tools.search_reports({ query, page_size: 500 });
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].url, "https://merchantapi.googleapis.com/reports/v1/accounts/111/reports:search");
    assert.deepEqual(calls[0].body, { query, pageSize: 500 });
  } finally {
    restore();
  }
});

test("price_competitiveness builds the canned MCQL with the country filter", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.price_competitiveness({ country: "US" });
    const body = calls[0].body as { query: string };
    assert.match(body.query, /^SELECT id, offer_id, title, brand, price, benchmark_price, report_country_code /);
    assert.match(body.query, /FROM price_competitiveness_product_view WHERE report_country_code = 'US'$/);
  } finally {
    restore();
  }
});

test("price_insights builds the canned MCQL and passes paging through", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.price_insights({ page_size: 20, page_token: "tok" });
    const body = calls[0].body as { query: string; pageSize: number; pageToken: string };
    assert.match(body.query, /suggested_price/);
    assert.match(body.query, /FROM price_insights_product_view$/);
    assert.equal(body.pageSize, 20);
    assert.equal(body.pageToken, "tok");
  } finally {
    restore();
  }
});
