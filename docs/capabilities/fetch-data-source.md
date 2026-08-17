# Google Merchant Center: Re-fetch a file feed now — MCP tool

**Google Merchant Center MCP tool:** Triggers an immediate re-fetch (re-read) of a file-based feed outside its regular schedule.

Technical name: `fetch_data_source`

## What task it solves

> I want to re-fetch a file feed now.

Triggers an immediate re-fetch (re-read) of a file-based feed outside its regular schedule.

## When to use it

Use this capability when you need “Re-fetch a file feed now” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `data_source` — **required**. Data source: numeric ID (e.g. "104628") or full name "accounts/{account}/dataSources/{id}". Product/promotion writes require an API-type data source (input: API), not a file feed.

## What it returns

Returns an empty object on success — the fetch itself runs asynchronously on Google's side.

## What changes in Google Merchant Center

The tool changes real Google Merchant Center data as described above. The server does not promise an automatic rollback.

## Example request

> Re-fetch a file feed now in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Works only for data sources with a file input and fetch settings (scheduled fetch or Google Sheets); calling it on an API-type source is an error.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Create an API data source](./create-data-source.md) — `create_data_source`
- [Get a data source](./get-data-source.md) — `get_data_source`
- [List data sources](./list-data-sources.md) — `list_data_sources`

## Technical details

- **Impact:** changes data
- **Group:** Data sources
- **Description source:** `fetch_data_source` registration in `src/tools/datasources.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
