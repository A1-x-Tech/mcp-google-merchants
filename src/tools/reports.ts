import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MerchantsClient } from "../client.js";
import { accountParam, fail, ok, pageSizeParam, pageTokenParam, READ_ONLY } from "./util.js";

export function registerReportTools(server: McpServer, client: MerchantsClient): void {
  server.registerTool(
    "search_reports",
    {
      title: "Run an MCQL report query",
      annotations: READ_ONLY,
      description:
        "Runs a Merchant Center Query Language (MCQL) query via reports:search. Tables: product_view, " +
        "product_performance_view, price_competitiveness_product_view, price_insights_product_view, " +
        "non_product_performance_view, best_sellers_product_cluster_view, best_sellers_brand_view, " +
        "competitive_visibility_top_merchant_view, competitive_visibility_competitor_view, " +
        "competitive_visibility_benchmark_view. Rules: field names are snake_case in the query but camelCase " +
        "in the JSON response; no SELECT *; performance views require a WHERE date range, e.g. " +
        "SELECT offer_id, clicks, impressions FROM product_performance_view WHERE date BETWEEN '2026-07-01' " +
        "AND '2026-07-31' ORDER BY clicks DESC. price_* views require the Market Insights opt-in. Each result " +
        "row has exactly one populated view object. This is also the way to FILTER products (product_view) — " +
        "list_products has no filter.",
      inputSchema: {
        account: accountParam(),
        query: z
          .string()
          .min(1)
          .describe(
            "MCQL query, e.g. SELECT offer_id, title, price FROM product_view WHERE availability = 'out of stock'.",
          ),
        page_size: pageSizeParam(100_000, 1000),
        page_token: pageTokenParam(),
      },
    },
    async ({ account, query, page_size, page_token }) => {
      try {
        return ok(
          await client.searchReports({ account, query, pageSize: page_size, pageToken: page_token }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "price_competitiveness",
    {
      title: "Price competitiveness vs the market",
      annotations: READ_ONLY,
      description:
        "Convenience wrapper over a canned MCQL query on price_competitiveness_product_view: for each product, " +
        "your price vs the market benchmark_price (aggregated from comparable offers across merchants) with " +
        "report_country_code. A product priced above the benchmark is losing clicks to cheaper rivals. Requires " +
        "the account to be opted into Market Insights (free, in Merchant Center settings) — otherwise rows are " +
        "empty. Price amounts are micros (1,000,000 = 1 unit) and may arrive as strings (int64). Optional " +
        "country narrows to one report country.",
      inputSchema: {
        account: accountParam(),
        country: z
          .string()
          .regex(/^[A-Z]{2}$/, "two-letter CLDR country code")
          .optional()
          .describe('Two-letter CLDR country code to filter by, e.g. "US". Omit for all countries.'),
        page_size: pageSizeParam(100_000, 1000),
        page_token: pageTokenParam(),
      },
    },
    async ({ account, country, page_size, page_token }) => {
      try {
        return ok(
          await client.priceCompetitiveness({
            account,
            country,
            pageSize: page_size,
            pageToken: page_token,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "price_insights",
    {
      title: "Suggested prices & predicted impact",
      annotations: READ_ONLY,
      description:
        "Convenience wrapper over a canned MCQL query on price_insights_product_view: Google's suggested_price " +
        "per product with the predicted change in impressions, clicks and conversions if you adopt it " +
        "(predicted_*_change_fraction, e.g. 0.05 = +5%), plus an overall `effectiveness` bucket (LOW/MEDIUM/HIGH). " +
        "Requires the Market Insights opt-in — otherwise rows are empty. Price amounts are micros and may arrive " +
        "as strings (int64).",
      inputSchema: {
        account: accountParam(),
        page_size: pageSizeParam(100_000, 1000),
        page_token: pageTokenParam(),
      },
    },
    async ({ account, page_size, page_token }) => {
      try {
        return ok(await client.priceInsights({ account, pageSize: page_size, pageToken: page_token }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
