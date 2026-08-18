#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MerchantsClient } from "./client.js";
import { ConfigError, DEFAULT_BASE, DEFAULT_TOKEN_URL, hasCredentials, loadConfig } from "./config.js";
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
  "delete_product_input and raw_request change a live feed irreversibly, and insert_product_input " +
  "wholesale-overwrites any existing input with the same ID.";

/**
 * Prepended to INSTRUCTIONS when no credentials are configured. The model reads
 * this before it picks a tool, so an unconfigured session opens with the fix
 * rather than with a failed call. There is no in-chat login here: credentials
 * come only from the environment, so the fix is an operator action + restart.
 */
const UNCONFIGURED_PREFIX =
  "ATTENTION: Google Merchant Center is not connected yet — no credentials are configured, so " +
  "every tool call will fail. The operator must set GOOGLE_MERCHANTS_CLIENT_ID + " +
  "GOOGLE_MERCHANTS_CLIENT_SECRET + GOOGLE_MERCHANTS_REFRESH_TOKEN (OAuth refresh flow) or " +
  "GOOGLE_MERCHANTS_ACCESS_TOKEN (pre-minted token, expires in ~1 hour) in the MCP client's " +
  "server config and restart this server — the variables are read only at startup. ";

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
 * Loads the config without dying on a bad value. A server that exits here never
 * completes the MCP handshake, so the user sees a dead server and no reason.
 * Instead the problem is carried into the session, where the model can read it
 * and relay it: the config degrades to "no credentials" and every tool call
 * fails with the actionable message.
 */
function loadConfigOrDegraded(telemetry: Telemetry): {
  config: MerchantsConfig;
  problem?: ConfigError;
} {
  try {
    return { config: loadConfig() };
  } catch (err) {
    if (!(err instanceof ConfigError)) throw err;
    console.error(`Error: ${err.message}`);
    // Fire-and-forget now that the process survives: the historical
    // `startup_failed` funnel stays comparable, but nothing blocks startup.
    telemetry.send("startup_failed", { reason: err.reason });
    return {
      config: {
        apiBase: process.env.GOOGLE_MERCHANTS_API_BASE || DEFAULT_BASE,
        tokenUrl: process.env.GOOGLE_MERCHANTS_TOKEN_URL || DEFAULT_TOKEN_URL,
      },
      problem: err,
    };
  }
}

async function main(): Promise<void> {
  // Anonymous usage pings (ids/names/versions only, never data or arguments);
  // opt out with ASKADS_TELEMETRY=0. Built before the config so missing
  // credentials can be reported; wired to the server before tools register.
  const telemetry = new Telemetry(readVersion());
  const { config, problem } = loadConfigOrDegraded(telemetry);
  const client = new MerchantsClient(config);

  // Decided once, at startup: credentials come only from the environment, so
  // "restart after setting the variables" is the accurate advice to give.
  const connected = hasCredentials(config);

  const server = new McpServer(
    {
      name: "mcp-google-merchants",
      version: readVersion(),
    },
    {
      instructions: connected
        ? INSTRUCTIONS
        : UNCONFIGURED_PREFIX + (problem ? `Configuration problem: ${problem.message} ` : "") + INSTRUCTIONS,
    },
  );

  instrumentToolCalls(server, telemetry);
  server.server.oninitialized = () => {
    telemetry.setClientInfo(server.server.getClientVersion());
    // Split on purpose: `server_start` keeps meaning "a usable install started",
    // so the unconfigured case gets its own event instead of inflating that number.
    if (connected) telemetry.send("server_start");
    else telemetry.send("unconfigured_start", { reason: problem?.reason ?? "missing_credentials" });
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
  console.error(
    `mcp-google-merchants running on stdio${connected ? "" : " (no credentials — set the environment variables and restart)"}`,
  );
}

main().catch((err) => {
  console.error("Fatal error starting mcp-google-merchants:", err);
  process.exit(1);
});
