# Google Merchant Center: Price competitiveness vs the market — MCP tool

**Google Merchant Center MCP tool:** Convenience wrapper over a canned MCQL query on price_competitiveness_product_view: for each product, your price vs the market benchmark_price (aggregated from comparable offers across merchants) with report_country_code.

Technical name: `price_competitiveness`

## What task it solves

> I want to price competitiveness vs the market.

Convenience wrapper over a canned MCQL query on price_competitiveness_product_view: for each product, your price vs the market benchmark_price (aggregated from comparable offers across merchants) with report_country_code.

## When to use it

Use this capability when you need “Price competitiveness vs the market” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `country` — **optional**. Two-letter CLDR country code to filter by, e.g. "US". Omit for all countries.
- `page_size` — **optional**. Max results per page (1..5000; API default 1000).
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Price competitiveness vs the market in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

A product priced above the benchmark is losing clicks to cheaper rivals. Requires the account to be opted into Market Insights (free, in Merchant Center settings) — otherwise rows are empty. Price amounts are micros (1,000,000 = 1 unit) and may arrive as strings (int64). Optional country narrows to one report country.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Suggested prices & predicted impact](./price-insights.md) — `price_insights`
- [Run an MCQL report query](./search-reports.md) — `search_reports`

## Technical details

- **Impact:** read-only
- **Group:** Reports
- **Description source:** `price_competitiveness` registration in `src/tools/reports.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
