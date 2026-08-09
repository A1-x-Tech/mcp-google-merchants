import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { MerchantsClient } from "../dist/client.js";

const DIST_ENTRY = fileURLToPath(new URL("../dist/index.js", import.meta.url));

const ALL_TOOLS = [
  "create_data_source",
  "delete_product_input",
  "fetch_data_source",
  "get_account",
  "get_data_source",
  "get_homepage",
  "get_product",
  "get_promotion",
  "get_shipping_settings",
  "insert_product_input",
  "insert_promotion",
  "list_accounts",
  "list_data_sources",
  "list_method_quotas",
  "list_product_issues",
  "list_products",
  "list_promotions",
  "price_competitiveness",
  "price_insights",
  "raw_request",
  "search_reports",
  "update_product_input",
];

test("dist binary completes a real MCP handshake over stdio and lists every tool", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [DIST_ENTRY],
    env: {
      ...getDefaultEnvironment(),
      GOOGLE_MERCHANTS_ACCESS_TOKEN: "test-token",
      GOOGLE_MERCHANTS_ACCOUNT_ID: "123",
      ASKADS_TELEMETRY: "0",
    },
    stderr: "ignore",
  });
  const client = new Client({ name: "dist-smoke", version: "0.0.0" });
  await client.connect(transport);
  try {
    const server = client.getServerVersion();
    assert.equal(server?.name, "mcp-google-merchants");
    assert.match(String(server?.version), /^\d+\.\d+\.\d+$/);

    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), ALL_TOOLS);
    for (const tool of tools) {
      assert.ok(tool.annotations, `${tool.name} must ship annotations`);
      assert.equal(typeof tool.annotations.readOnlyHint, "boolean", `${tool.name} readOnlyHint`);
    }
  } finally {
    await client.close();
  }
});

test("dist client rejects foreign-origin paths before sending the Bearer token", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };
  try {
    const client = new MerchantsClient({
      accessToken: "SECRET",
      accountId: "123",
      apiBase: "https://merchantapi.googleapis.com",
      tokenUrl: "https://oauth2.googleapis.com/token",
      timeoutMs: 1000,
      maxRetries: 0,
    });
    await assert.rejects(() => client.request("GET", "https://example.invalid/steal"), /foreign origin/);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("dist client sends the Bearer token and the dataSource query param on product writes", async () => {
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, init) => {
    sent = { url: String(url), auth: init.headers.Authorization, body: JSON.parse(init.body) };
    return new Response('{"ok":true}', { status: 200 });
  };
  try {
    const client = new MerchantsClient({
      accessToken: "SECRET",
      accountId: "123",
      apiBase: "https://merchantapi.googleapis.com",
      tokenUrl: "https://oauth2.googleapis.com/token",
      timeoutMs: 1000,
      maxRetries: 0,
    });
    await client.insertProductInput({
      dataSource: "7",
      offerId: "sku1",
      contentLanguage: "en",
      feedLabel: "US",
    });
    assert.equal(sent.auth, "Bearer SECRET");
    const url = new URL(sent.url);
    assert.equal(url.pathname, "/products/v1/accounts/123/productInputs:insert");
    assert.equal(url.searchParams.get("dataSource"), "accounts/123/dataSources/7");
    assert.deepEqual(sent.body, { offerId: "sku1", contentLanguage: "en", feedLabel: "US" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
