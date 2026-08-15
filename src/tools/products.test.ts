import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "../client.js";
import { registerProductTools } from "./products.js";

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
  registerProductTools(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("registers the product tools", () => {
  const { tools, restore } = harness();
  restore();
  assert.deepEqual(Object.keys(tools).sort(), [
    "delete_product_input",
    "get_product",
    "insert_product_input",
    "list_products",
    "update_product_input",
  ]);
});

test("update_product_input PATCHes with dataSource + updateMask query params", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.update_product_input({
      product_input: "en~US~sku123",
      data_source: "104628",
      update_mask: "productAttributes.price",
      product_attributes: { price: { amountMicros: "8990000", currencyCode: "USD" } },
    });
    const url = new URL(calls[0].url);
    assert.equal(calls[0].method, "PATCH");
    assert.equal(url.pathname, "/products/v1/accounts/111/productInputs/en~US~sku123");
    assert.equal(url.searchParams.get("dataSource"), "accounts/111/dataSources/104628");
    assert.equal(url.searchParams.get("updateMask"), "productAttributes.price");
    assert.deepEqual(calls[0].body, {
      productAttributes: { price: { amountMicros: "8990000", currencyCode: "USD" } },
    });
  } finally {
    restore();
  }
});

test("update_product_input rejects a masked path with no value locally — no request is made", async () => {
  const { tools, calls, restore } = harness();
  try {
    const res = await tools.update_product_input({
      product_input: "en~US~sku123",
      data_source: "104628",
      update_mask: "productAttributes.price,productAttributes.availability",
      product_attributes: { availability: "out_of_stock" },
    });
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /ERASE/);
    assert.match(res.content[0].text, /productAttributes\.price/);
    assert.equal(calls.length, 0);
  } finally {
    restore();
  }
});

test("list_products hits products/v1 with paging", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.list_products({ page_size: 100 });
    const url = new URL(calls[0].url);
    assert.equal(calls[0].method, "GET");
    assert.equal(url.pathname, "/products/v1/accounts/111/products");
    assert.equal(url.searchParams.get("pageSize"), "100");
  } finally {
    restore();
  }
});

test("get_product accepts the tilde ID directly", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.get_product({ product: "en~US~sku123" });
    assert.equal(calls[0].url, "https://merchantapi.googleapis.com/products/v1/accounts/111/products/en~US~sku123");
  } finally {
    restore();
  }
});

test("get_product joins the three components with ~", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.get_product({ content_language: "en", feed_label: "US", offer_id: "sku123" });
    assert.equal(calls[0].url, "https://merchantapi.googleapis.com/products/v1/accounts/111/products/en~US~sku123");
  } finally {
    restore();
  }
});

test("get_product without an ID is a local error — no request is made", async () => {
  const { tools, calls, restore } = harness();
  try {
    const res = await tools.get_product({ content_language: "en" });
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /content_language, feed_label and offer_id/);
    assert.equal(calls.length, 0);
  } finally {
    restore();
  }
});

test("insert_product_input maps snake_case inputs to the camelCase wire body", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.insert_product_input({
      data_source: "104628",
      offer_id: "sku123",
      content_language: "en",
      feed_label: "US",
      product_attributes: { title: "Bike" },
      custom_attributes: [{ name: "season", value: "summer" }],
      version_number: "7",
    });
    const url = new URL(calls[0].url);
    assert.equal(calls[0].method, "POST");
    assert.equal(url.pathname, "/products/v1/accounts/111/productInputs:insert");
    assert.equal(url.searchParams.get("dataSource"), "accounts/111/dataSources/104628");
    assert.deepEqual(calls[0].body, {
      offerId: "sku123",
      contentLanguage: "en",
      feedLabel: "US",
      productAttributes: { title: "Bike" },
      customAttributes: [{ name: "season", value: "summer" }],
      versionNumber: "7",
    });
  } finally {
    restore();
  }
});

test("delete_product_input sends DELETE with the dataSource query param", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.delete_product_input({ product_input: "en~US~sku123", data_source: "104628" });
    const url = new URL(calls[0].url);
    assert.equal(calls[0].method, "DELETE");
    assert.equal(url.pathname, "/products/v1/accounts/111/productInputs/en~US~sku123");
    assert.equal(url.searchParams.get("dataSource"), "accounts/111/dataSources/104628");
    assert.equal(calls[0].body, undefined);
  } finally {
    restore();
  }
});
