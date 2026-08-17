# Google Merchant Center: Suggested prices & predicted impact — MCP tool

**Google Merchant Center MCP tool:** Convenience wrapper over a canned MCQL query on price_insights_product_view: Google's suggested_price per product with the predicted change in impressions, clicks and conversions if you adopt it (predicted_*_change_fraction, e.g.

Technical name: `price_insights`

## What task it solves

> I want to suggested prices & predicted impact.

Convenience wrapper over a canned MCQL query on price_insights_product_view: Google's suggested_price per product with the predicted change in impressions, clicks and conversions if you adopt it (predicted_*_change_fraction, e.g.

## When to use it

Use this capability when you need “Suggested prices & predicted impact” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `page_size` — **optional**. Max results per page (1..5000; API default 1000).
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Suggested prices & predicted impact in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

0.05 = +5%), plus an overall `effectiveness` bucket (LOW/MEDIUM/HIGH). Requires the Market Insights opt-in — otherwise rows are empty. Price amounts are micros and may arrive as strings (int64).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Price competitiveness vs the market](./price-competitiveness.md) — `price_competitiveness`
- [Run an MCQL report query](./search-reports.md) — `search_reports`

## Technical details

- **Impact:** read-only
- **Group:** Reports
- **Description source:** `price_insights` registration in `src/tools/reports.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
