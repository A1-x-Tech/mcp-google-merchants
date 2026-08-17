# Google Merchant Center: List promotions — MCP tool

**Google Merchant Center MCP tool:** Lists the promotions of an account: promotions[] (name, promotionId, contentLanguage, targetCountry, redemptionChannel, attributes, promotionStatus with destination statuses and itemLevelIssues) and nextPageToken.

Technical name: `list_promotions`

## What task it solves

> I want to list promotions.

Lists the promotions of an account: promotions[] (name, promotionId, contentLanguage, targetCountry, redemptionChannel, attributes, promotionStatus with destination statuses and itemLevelIssues) and nextPageToken.

## When to use it

Use this capability when you need “List promotions” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `page_size` — **optional**. Max results per page (1..250; API default 50).
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> List promotions in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Check required parameters, token permissions, and current upstream API limits.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a promotion](./get-promotion.md) — `get_promotion`
- [Insert or update a promotion](./insert-promotion.md) — `insert_promotion`

## Technical details

- **Impact:** read-only
- **Group:** Promotions
- **Description source:** `list_promotions` registration in `src/tools/promotions.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
