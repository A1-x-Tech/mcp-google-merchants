# Tools

For task-oriented guidance, open the [MCP capability catalog](./capabilities/index.md). This page remains the technical reference for schemas and API responses.

The server wraps the **Google Merchant API v1** (single host
`merchantapi.googleapis.com`, per-sub-API path prefixes). Inputs are snake_case;
the client maps them to the API's camelCase wire format, expands numeric
data-source IDs into full resource names and fills in the default account
(`GOOGLE_MERCHANTS_ACCOUNT_ID`) when a tool's `account` is omitted.

This is a **write-capable** server: tools are annotated `READ_ONLY`, `WRITE` or
`DESTRUCTIVE` so MCP hosts can gate them.

## Accounts

| Tool | Description |
|---|---|
| `list_accounts` | Merchant Center accounts the authenticated user can access. Optional `filter` (account filter syntax, e.g. `accountName = "*store*"`), paging up to 500. |
| `get_account` | One account: `name`, `accountId`, `accountName`, `languageCode`, `timeZone`, `adultContent`, `testAccount`. |
| `get_homepage` | The store homepage: `uri` and `claimed` (an unclaimed homepage is a common account-level problem). Claim/unclaim are not exposed — use `raw_request` `POST .../homepage:claim`. |
| `get_shipping_settings` | Account-level shipping settings: `services[]`, `warehouses[]`, `etag`. Read-only by design — the API's only write is a full replace (`shippingSettings:insert`). |

## Products

| Tool | Description |
|---|---|
| `list_products` | Processed products (as shown in Merchant Center) with `productStatus.itemLevelIssues`. No server-side filter — filter via `search_reports` on `product_view`. Paging up to 1000. |
| `get_product` | One processed product incl. issues. Accepts `product` = `contentLanguage~feedLabel~offerId` (or the base64url `base64EncodedName`), or the three components separately. |
| `insert_product_input` | **DESTRUCTIVE.** Upserts a product into an API data source (`data_source` required; same ID in the same source is fully replaced; a different source *moves* the product). Processing is async (minutes). |
| `update_product_input` | **WRITE.** Sparse update of an existing product input (price, availability, ...). `update_mask` is a comma-separated list of attribute paths; omitted = all populated fields are applied. Every masked path must carry a value in the request — a masked path without one **erases** that attribute (the tool rejects such requests locally). |
| `delete_product_input` | **DESTRUCTIVE.** Deletes a product input from a specific data source (`data_source` required). |

## Data sources

| Tool | Description |
|---|---|
| `list_data_sources` | Data sources with `input` type (API / FILE / UI / AUTOFEED) and feed configuration. Product/promotion writes need an **API-type** source. |
| `get_data_source` | One data source by numeric ID or full resource name. |
| `create_data_source` | **WRITE.** Creates an API (generic) data source — the `data_source` target product/promotion writes need. `content_language` + `feed_label` both set or both omitted; promotions sources need `target_country` + `content_language`. |
| `fetch_data_source` | **WRITE.** Immediate re-fetch of a **file-based** feed outside its schedule; errors on API-type sources. |

## Promotions

| Tool | Description |
|---|---|
| `insert_promotion` | **WRITE.** Creates/updates a promotion. `data_source` goes in the request **body** (unlike product writes). The promotion needs `promotionId`, `contentLanguage`, `targetCountry` and `redemptionChannel` (≥1 of ONLINE / IN_STORE). |
| `list_promotions` | Promotions with `promotionStatus`. Paging up to 250. |
| `get_promotion` | One promotion incl. per-destination status and issues. |

## Reports

| Tool | Description |
|---|---|
| `search_reports` | Runs a raw MCQL query via `reports:search` (POST, but a pure read). Tables: `product_view`, `product_performance_view`, `price_competitiveness_product_view`, `price_insights_product_view`, `non_product_performance_view`, `best_sellers_*`, `competitive_visibility_*`. |
| `price_competitiveness` | Canned MCQL on `price_competitiveness_product_view`: your `price` vs the market `benchmark_price` per product, optional `country` filter. Requires the Market Insights opt-in. |
| `price_insights` | Canned MCQL on `price_insights_product_view`: Google's `suggested_price` + predicted clicks/impressions/conversions change. Requires the Market Insights opt-in. |

MCQL rules: field names are snake_case in queries, camelCase in responses; no
`SELECT *`; performance views require a `WHERE date ...` range; each result row
has exactly one populated view object.

## Issues

| Tool | Description |
|---|---|
| `list_product_issues` | Aggregate product statuses per reporting context and country (`issueresolution/v1`): active/pending/disapproved/expiring counts + `itemLevelIssues[]` with affected-product counts. Sub-accounts and standalone accounts only. `filter` supports only `reporting_context` and `country`. |

## Quota

| Tool | Description |
|---|---|
| `list_method_quotas` | API usage vs limits per method group (`quota/v1`): `quotaUsage`, `quotaLimit` (per day), `quotaMinuteLimit`, `methodDetails[]`. Daily counters reset at 12:00 UTC (midday, not midnight). The go-to tool when you hit HTTP 429. |

Notes:
- **Product IDs (v1):** `contentLanguage~feedLabel~offerId` — **no channel segment**
  (that was v1beta). Legacy local-only products use a `local~` prefix. If `offerId`
  contains URL-hostile characters (e.g. `/`), use the server-returned
  `base64EncodedName`.
- **Async writes:** product/promotion inserts and deletes are reflected in the
  processed views after several minutes; data-quality problems surface later in
  `productStatus.itemLevelIssues`, not as API errors.
- **Int64 fields arrive as strings** (`amountMicros`, counts, `versionNumber`).
- **Prices are micros:** 1,000,000 micros = 1 currency unit.

## Escape hatch

| Tool | Description |
|---|---|
| `raw_request` | **DESTRUCTIVE.** Call any Merchant API v1 path directly (e.g. `accounts/v1/accounts/{a}/issues`, or the one-time `accounts/v1/accounts/{a}/developerRegistration:registerGcp`). Supports GET/POST/PATCH/DELETE, URL `query` params and a JSON `body`. A `path` that resolves to a foreign origin is rejected (SSRF guard). |

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_MERCHANTS_CLIENT_ID` | yes* | — | OAuth 2.0 client ID. |
| `GOOGLE_MERCHANTS_CLIENT_SECRET` | yes* | — | OAuth 2.0 client secret. Secret. |
| `GOOGLE_MERCHANTS_REFRESH_TOKEN` | yes* | — | OAuth refresh token, scope `https://www.googleapis.com/auth/content`. Secret. |
| `GOOGLE_MERCHANTS_ACCESS_TOKEN` | yes* | — | Pre-minted access token (~1h) — alternative to the trio above. Secret. |
| `GOOGLE_MERCHANTS_ACCOUNT_ID` | no | — | Default Merchant Center account ID; tools can override per call. |
| `GOOGLE_MERCHANTS_API_BASE` | no | `https://merchantapi.googleapis.com` | API root override. |
| `GOOGLE_MERCHANTS_TOKEN_URL` | no | `https://oauth2.googleapis.com/token` | OAuth token endpoint override. |
| `GOOGLE_MERCHANTS_TIMEOUT_MS` | no | `60000` | Per-request timeout, ms. |
| `GOOGLE_MERCHANTS_MAX_RETRIES` | no | `3` | Retries on transient errors (429 any method; 5xx/network GET only). |
| `ASKADS_TELEMETRY` | no | enabled | `0`, `false`, `off` or `no` disables anonymous telemetry (see [DEVELOPMENT.md](./DEVELOPMENT.md)). |

\* Either the refresh trio or a bare access token.
