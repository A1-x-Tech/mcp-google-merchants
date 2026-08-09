import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "../client.js";
import { registerDataSourceTools } from "./datasources.js";

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;

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
  registerDataSourceTools(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("registers the data source tools", () => {
  const { tools, restore } = harness();
  restore();
  assert.deepEqual(Object.keys(tools).sort(), [
    "create_data_source",
    "fetch_data_source",
    "get_data_source",
    "list_data_sources",
  ]);
});

test("create_data_source builds the primary-products wire body", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.create_data_source({
      display_name: "API feed",
      type: "primary_products",
      content_language: "en",
      feed_label: "US",
      countries: ["US"],
    });
    assert.equal(calls[0].method, "POST");
    assert.equal(new URL(calls[0].url).pathname, "/datasources/v1/accounts/111/dataSources");
    assert.deepEqual(calls[0].body, {
      displayName: "API feed",
      primaryProductDataSource: { contentLanguage: "en", feedLabel: "US", countries: ["US"] },
    });
  } finally {
    restore();
  }
});

test("create_data_source builds the promotions wire body", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.create_data_source({
      display_name: "Promos",
      type: "promotions",
      content_language: "en",
      target_country: "US",
    });
    assert.deepEqual(calls[0].body, {
      displayName: "Promos",
      promotionDataSource: { targetCountry: "US", contentLanguage: "en" },
    });
  } finally {
    restore();
  }
});

test("create_data_source validates cross-field rules locally — no request is made", async () => {
  const { tools, calls, restore } = harness();
  try {
    const halfPair = await tools.create_data_source({
      display_name: "X",
      type: "primary_products",
      content_language: "en",
    });
    assert.equal(halfPair.isError, true);
    assert.match(halfPair.content[0].text, /both set or both omitted/);

    const promoNoCountry = await tools.create_data_source({
      display_name: "X",
      type: "promotions",
      content_language: "en",
    });
    assert.equal(promoNoCountry.isError, true);
    assert.match(promoNoCountry.content[0].text, /target_country/);

    assert.equal(calls.length, 0);
  } finally {
    restore();
  }
});

test("list_data_sources hits datasources/v1", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.list_data_sources({ page_size: 50 });
    const url = new URL(calls[0].url);
    assert.equal(calls[0].method, "GET");
    assert.equal(url.pathname, "/datasources/v1/accounts/111/dataSources");
    assert.equal(url.searchParams.get("pageSize"), "50");
  } finally {
    restore();
  }
});

test("get_data_source expands a numeric ID into the resource name", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.get_data_source({ data_source: "104628" });
    assert.equal(
      calls[0].url,
      "https://merchantapi.googleapis.com/datasources/v1/accounts/111/dataSources/104628",
    );
  } finally {
    restore();
  }
});

test("fetch_data_source POSTs to :fetch with an empty body", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.fetch_data_source({ data_source: "104628" });
    assert.equal(calls[0].method, "POST");
    assert.equal(
      calls[0].url,
      "https://merchantapi.googleapis.com/datasources/v1/accounts/111/dataSources/104628:fetch",
    );
    assert.deepEqual(calls[0].body, {});
  } finally {
    restore();
  }
});

test("an API error (e.g. :fetch on an API source) is an isError result", async () => {
  const { tools, restore } = harness(
    () =>
      new Response(
        JSON.stringify({ error: { code: 400, message: "not a file feed", status: "INVALID_ARGUMENT" } }),
        { status: 400 },
      ),
  );
  try {
    const res = await tools.fetch_data_source({ data_source: "1" });
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /INVALID_ARGUMENT/);
  } finally {
    restore();
  }
});
