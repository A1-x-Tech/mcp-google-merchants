# Google Merchant Center: Create an API data source — MCP tool

**Google Merchant Center MCP tool:** Creates an API (generic) data source — the target that insert_product_input / update_product_input / insert_promotion need as data_source.

Technical name: `create_data_source`

## What task it solves

> I want to create an API data source.

Creates an API (generic) data source — the target that insert_product_input / update_product_input / insert_promotion need as data_source.

## When to use it

Use this capability when you need “Create an API data source” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `display_name` — **required**. Human-readable data source name shown in Merchant Center.
- `type` — **required**. Data source type: primary_products (main product feed), supplemental_products (overrides/extra attributes) or promotions.
- `content_language` — **optional**. Two-letter ISO 639-1 language, e.g. "en". Product sources: set together with feed_label or not at all. Required for promotions sources.
- `feed_label` — **optional**. Feed label, e.g. "US". Product sources only; set together with content_language.
- `countries` — **optional**. CLDR country codes the products target. Primary product sources only.
- `target_country` — **optional**. CLDR country code, e.g. "US". Required for (and only used by) promotions sources.

## What it returns

Returns the created DataSource with its dataSourceId.

## What changes in Google Merchant Center

The tool changes real Google Merchant Center data as described above. The server does not promise an automatic rollback.

## Example request

> Create an API data source in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Only API sources can be created through the API (file, UI and autofeed sources are set up in Merchant Center). For product sources content_language and feed_label must be both set or both omitted; countries applies to primary sources only. A promotions source requires target_country and content_language.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Re-fetch a file feed now](./fetch-data-source.md) — `fetch_data_source`
- [Get a data source](./get-data-source.md) — `get_data_source`
- [List data sources](./list-data-sources.md) — `list_data_sources`

## Technical details

- **Impact:** changes data
- **Group:** Data sources
- **Description source:** `create_data_source` registration in `src/tools/datasources.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
