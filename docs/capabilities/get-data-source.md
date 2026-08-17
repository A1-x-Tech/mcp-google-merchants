# Google Merchant Center: Get a data source — MCP tool

**Google Merchant Center MCP tool:** Returns one data source by its numeric ID (or full resource name): type, input (API/FILE/UI/AUTOFEED), feed configuration and fetch settings.

Technical name: `get_data_source`

## What task it solves

> I want to get a data source.

Returns one data source by its numeric ID (or full resource name): type, input (API/FILE/UI/AUTOFEED), feed configuration and fetch settings.

## When to use it

Use this capability when you need “Get a data source” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `data_source` — **required**. Data source: numeric ID (e.g. "104628") or full name "accounts/{account}/dataSources/{id}". Product/promotion writes require an API-type data source (input: API), not a file feed.

## What it returns

Returns one data source by its numeric ID (or full resource name): type, input (API/FILE/UI/AUTOFEED), feed configuration and fetch settings.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Get a data source in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Check `input` before calling fetch_data_source — only file-based feeds with fetch settings can be re-fetched.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Create an API data source](./create-data-source.md) — `create_data_source`
- [Re-fetch a file feed now](./fetch-data-source.md) — `fetch_data_source`
- [List data sources](./list-data-sources.md) — `list_data_sources`

## Technical details

- **Impact:** read-only
- **Group:** Data sources
- **Description source:** `get_data_source` registration in `src/tools/datasources.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
