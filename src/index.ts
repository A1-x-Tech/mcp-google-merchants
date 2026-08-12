#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MerchantsClient } from "./client.js";
import { ConfigError, loadConfig } from "./config.js";
import { instrumentToolCalls, Telemetry } from "./telemetry.js";
import type { MerchantsConfig } from "./types.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerProductTools } from "./tools/products.js";
import { registerDataSourceTools } from "./tools/datasources.js";
import { registerPromotionTools } from "./tools/promotions.js";
import { registerReportTools } from "./tools/reports.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerQuotaTools } from "./tools/quota.js";
import { registerRawTool } from "./tools/raw.js";

/**
 * Prose the calling model receives in the `initialize` result, before it picks a
 * tool — the only place to say what the tool list cannot: which Google product
 * this is (the feed, not the ads cabinet), where the writes stop, the one-time
 * registration without which nothing works, and which answers mean something
 * other than they say. English, like the tool descriptions.
 */
const INSTRUCTIONS =
  "Google Merchant Center through the Merchant API v1 is the product feed behind Shopping ads, not " +
  "an ads cabinet — campaigns, budgets and bids live in Google Ads, not here. Writes are limited to " +
  "product inputs, promotions, new API data sources and file-feed re-fetches; everything else is " +
  "read-only unless you use raw_request. list_products cannot filter — filter via search_reports " +
  "(MCQL) — and product writes need an API-type data source, never a file feed, surfacing in the " +
  "processed views minutes later. Every call fails with a permission error until the Cloud project " +
  "is registered once with the account (raw_request POST " +
  "accounts/v1/accounts/{a}/developerRegistration:registerGcp) — check that before blaming OAuth. " +
  "On 429 read list_method_quotas: quotas are per account and daily counters reset at 12:00 UTC, " +
  "not midnight. Empty price_competitiveness/price_insights rows usually mean no Market Insights " +
  "opt-in rather than no data, and list_product_issues does not cover advanced (parent) accounts. " +
  "delete_product_input and raw_request change a live feed irreversibly.";

/** Reads the package version so the server reports its real version to MCP clients. */
function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * Loads the config, reporting the drop-off if it is missing. An unconfigured
 * server dies before the MCP handshake, so this ping is the only trace such an
 * install ever leaves — and it has to be awaited, or process.exit() below would
 * kill the request in flight.
 */
async function loadConfigOrExit(telemetry: Telemetry): Promise<MerchantsConfig> {
  try {
    return loadConfig();
  } catch (err) {
    if (!(err instanceof ConfigError)) throw err;
    console.error(`Error: ${err.message}`);
    await telemetry.sendBlocking("startup_failed", { reason: err.reason });
    process.exit(1);
  }
}

async function main(): Promise<void> {
  // Anonymous usage pings (ids/names/versions only, never data or arguments);
  // opt out with ASKADS_TELEMETRY=0. Built before the config so missing
  // credentials can be reported; wired to the server before tools register.
  const telemetry = new Telemetry(readVersion());
  const config = await loadConfigOrExit(telemetry);
  const client = new MerchantsClient(config);

  const server = new McpServer(
    {
      name: "mcp-google-merchants",
      version: readVersion(),
    },
    { instructions: INSTRUCTIONS },
  );

  instrumentToolCalls(server, telemetry);
  server.server.oninitialized = () => {
    telemetry.setClientInfo(server.server.getClientVersion());
    telemetry.send("server_start");
  };

  registerAccountTools(server, client);
  registerProductTools(server, client);
  registerDataSourceTools(server, client);
  registerPromotionTools(server, client);
  registerReportTools(server, client);
  registerIssueTools(server, client);
  registerQuotaTools(server, client);
  registerRawTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-google-merchants running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting mcp-google-merchants:", err);
  process.exit(1);
});
