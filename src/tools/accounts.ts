import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MerchantsClient } from "../client.js";
import { accountParam, fail, ok, pageSizeParam, pageTokenParam, READ_ONLY } from "./util.js";

export function registerAccountTools(server: McpServer, client: MerchantsClient): void {
  server.registerTool(
    "list_accounts",
    {
      title: "List Merchant Center accounts",
      annotations: READ_ONLY,
      description:
        "Lists the Merchant Center accounts the authenticated user can access. Returns accounts[] " +
        "(name, accountId, accountName, languageCode, timeZone, adultContent, testAccount) and " +
        "nextPageToken. Use it first to discover the account ID the other tools need (or set " +
        "GOOGLE_MERCHANTS_ACCOUNT_ID once). Optional filter uses the account filter syntax, " +
        'e.g. accountName = "*store*".',
      inputSchema: {
        page_size: pageSizeParam(500, 250),
        page_token: pageTokenParam(),
        filter: z
          .string()
          .min(1)
          .optional()
          .describe('Account filter, e.g. accountName = "*store*" or relationship(providerId = 123).'),
      },
    },
    async ({ page_size, page_token, filter }) => {
      try {
        return ok(await client.listAccounts({ pageSize: page_size, pageToken: page_token, filter }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_account",
    {
      title: "Get a Merchant Center account",
      annotations: READ_ONLY,
      description:
        "Returns a single Merchant Center account: name (accounts/{id}), accountId, accountName, " +
        "languageCode, timeZone, adultContent and testAccount. Useful to verify the configured " +
        "account or inspect a sub-account.",
      inputSchema: {
        account: accountParam(),
      },
    },
    async ({ account }) => {
      try {
        return ok(await client.getAccount({ account }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_homepage",
    {
      title: "Get the store homepage",
      annotations: READ_ONLY,
      description:
        "Returns the store homepage of an account: uri and claimed (whether the homepage is verified and " +
        "claimed by the merchant — a prerequisite for serving offers). An unclaimed homepage is a common " +
        "reason for account-level problems; claiming/unclaiming is not exposed as a tool (use raw_request " +
        "POST accounts/v1/accounts/{a}/homepage:claim if you really need it).",
      inputSchema: {
        account: accountParam(),
      },
    },
    async ({ account }) => {
      try {
        return ok(await client.getHomepage({ account }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_shipping_settings",
    {
      title: "Get shipping settings",
      annotations: READ_ONLY,
      description:
        "Returns the account-level shipping settings: services[] (delivery countries, delivery times, rate " +
        "tables and carrier rates), warehouses[] and an etag. Read-only by design: the API's only write is " +
        "shippingSettings:insert, a FULL REPLACE of every service — too dangerous for a tool; use " +
        "raw_request if you really need it.",
      inputSchema: {
        account: accountParam(),
      },
    },
    async ({ account }) => {
      try {
        return ok(await client.getShippingSettings({ account }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
