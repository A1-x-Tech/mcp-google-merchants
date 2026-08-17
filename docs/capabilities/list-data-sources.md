# Google Merchant Center: List data sources — MCP tool

**Google Merchant Center MCP tool:** Lists the data sources of an account.

Technical name: `list_data_sources`

## What task it solves

> I want to list data sources.

Lists the data sources of an account.

## When to use it

Use this capability when you need “List data sources” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `page_size` — **optional**. Max results per page (1..1000; API default 25).
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> List data sources in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Each has name (accounts/{a}/dataSources/{id}), dataSourceId, displayName, input (API | FILE | UI | AUTOFEED), exactly one type object (primaryProductDataSource, supplementalProductDataSource, promotionDataSource, ...) and fileInput for file feeds. Use it to find the API-type data source that insert_product_input / insert_promotion require as data_source.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Create an API data source](./create-data-source.md) — `create_data_source`
- [Re-fetch a file feed now](./fetch-data-source.md) — `fetch_data_source`
- [Get a data source](./get-data-source.md) — `get_data_source`

## Technical details

- **Impact:** read-only
- **Group:** Data sources
- **Description source:** `list_data_sources` registration in `src/tools/datasources.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
