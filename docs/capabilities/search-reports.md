# Google Merchant Center: Run an MCQL report query — MCP tool

**Google Merchant Center MCP tool:** Runs a Merchant Center Query Language (MCQL) query via reports:search.

Technical name: `search_reports`

## What task it solves

> I want to run an MCQL report query.

Runs a Merchant Center Query Language (MCQL) query via reports:search.

## When to use it

Use this capability when you need “Run an MCQL report query” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `query` — **required**. MCQL query, e.g. SELECT offer_id, title, price FROM product_view WHERE availability = 'out of stock'.
- `page_size` — **optional**. Max results per page (1..5000; API default 1000).
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Run an MCQL report query in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Tables: product_view, product_performance_view, price_competitiveness_product_view, price_insights_product_view, non_product_performance_view, best_sellers_product_cluster_view, best_sellers_brand_view, competitive_visibility_top_merchant_view, competitive_visibility_competitor_view, competitive_visibility_benchmark_view. Rules: field names are snake_case in the query but camelCase in the JSON response; no SELECT *; performance views require a WHERE date range, e.g. SELECT offer_id, clicks, impressions FROM product_performance_view WHERE date BETWEEN '2026-07-01' AND '2026-07-31' ORDER BY clicks DESC. price_* views require the Market Insights opt-in. Each result row has exactly one populated view object. This is also the way to FILTER products (product_view) — list_products has no filter.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Price competitiveness vs the market](./price-competitiveness.md) — `price_competitiveness`
- [Suggested prices & predicted impact](./price-insights.md) — `price_insights`

## Technical details

- **Impact:** read-only
- **Group:** Reports
- **Description source:** `search_reports` registration in `src/tools/reports.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
