import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HttpMethod, MerchantsClient } from "../client.js";
import { DESTRUCTIVE, fail, ok } from "./util.js";

export function registerRawTool(server: McpServer, client: MerchantsClient): void {
  server.registerTool(
    "raw_request",
    {
      title: "Raw Merchant API call",
      // The Merchant API has write and delete endpoints, and this tool can reach
      // all of them — annotate accordingly so hosts gate it properly.
      annotations: DESTRUCTIVE,
      description:
        "Escape hatch to call any Merchant API v1 path directly, for endpoints without a dedicated tool " +
        '(e.g. "accounts/v1/accounts/123/issues" or the one-time ' +
        '"accounts/v1/accounts/123/developerRegistration:registerGcp"). The path must include ' +
        "the sub-API prefix (accounts/v1, products/v1, datasources/v1, promotions/v1, reports/v1, " +
        "issueresolution/v1, quota/v1, inventories/v1, ...). `query` adds URL query parameters (e.g. " +
        "dataSource for productInputs writes, updateMask for PATCH); `body` is sent as JSON. Can create, " +
        "modify and delete data — use the dedicated tools when one exists.",
      inputSchema: {
        path: z
          .string()
          .min(1)
          .describe('Relative API path incl. the sub-API prefix, e.g. "accounts/v1/accounts/123/issues".'),
        method: z
          .enum(["GET", "POST", "PATCH", "DELETE"])
          .optional()
          .describe("HTTP method. Defaults to GET."),
        query: z
          .record(z.string())
          .optional()
          .describe("URL query parameters, e.g. {\"dataSource\": \"accounts/1/dataSources/2\"}."),
        body: z.record(z.any()).optional().describe("JSON request body (POST/PATCH)."),
      },
    },
    async ({ path, method, query, body }) => {
      try {
        const m = (method ?? "GET") as HttpMethod;
        return ok(await client.request(m, path, body, query));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
