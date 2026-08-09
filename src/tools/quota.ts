import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MerchantsClient } from "../client.js";
import { accountParam, fail, ok, pageTokenParam, READ_ONLY } from "./util.js";

export function registerQuotaTools(server: McpServer, client: MerchantsClient): void {
  server.registerTool(
    "list_method_quotas",
    {
      title: "API quota usage",
      annotations: READ_ONLY,
      description:
        "Shows the account's Merchant API usage vs limits per method group (quota sub-API): quotaGroups[] " +
        "with name, quotaUsage, quotaLimit (per day), quotaMinuteLimit and methodDetails[] listing the " +
        "methods in each group. Daily counters reset at 12:00 UTC — midday, not midnight. Use it to " +
        "diagnose HTTP 429 RESOURCE_EXHAUSTED errors and to see how much headroom is left.",
      inputSchema: {
        account: accountParam(),
        page_size: z.number().int().min(1).optional().describe("Max quota groups per page."),
        page_token: pageTokenParam(),
      },
    },
    async ({ account, page_size, page_token }) => {
      try {
        return ok(await client.listMethodQuotas({ account, pageSize: page_size, pageToken: page_token }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
