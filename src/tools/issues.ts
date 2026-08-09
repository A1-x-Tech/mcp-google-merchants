import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MerchantsClient } from "../client.js";
import { accountParam, fail, ok, pageSizeParam, pageTokenParam, READ_ONLY } from "./util.js";

export function registerIssueTools(server: McpServer, client: MerchantsClient): void {
  server.registerTool(
    "list_product_issues",
    {
      title: "Aggregated product issues",
      annotations: READ_ONLY,
      description:
        "Lists aggregate product statuses per reporting context and country (issueresolution sub-API): stats " +
        "{active, pending, disapproved, expiring counts} plus itemLevelIssues[] with how many products each " +
        "issue affects — the fastest way to see what is wrong with a feed at a glance. Works only for " +
        "sub-accounts and standalone accounts, NOT for advanced (parent) accounts. The filter supports only " +
        'reporting_context and country, e.g. reporting_context = "SHOPPING_ADS" AND country = "US". For a ' +
        "single product's issues use get_product (productStatus.itemLevelIssues).",
      inputSchema: {
        account: accountParam(),
        filter: z
          .string()
          .min(1)
          .optional()
          .describe(
            'Filter on reporting_context and/or country only, e.g. reporting_context = "SHOPPING_ADS" AND country = "US".',
          ),
        page_size: pageSizeParam(1000, 25),
        page_token: pageTokenParam(),
      },
    },
    async ({ account, filter, page_size, page_token }) => {
      try {
        return ok(
          await client.listAggregateProductStatuses({
            account,
            filter,
            pageSize: page_size,
            pageToken: page_token,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );
}
