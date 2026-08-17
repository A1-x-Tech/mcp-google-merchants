# Google Merchant Center: Get a promotion — MCP tool

**Google Merchant Center MCP tool:** Returns one promotion including promotionStatus (per-destination approval and itemLevelIssues) — the place to check whether a freshly inserted promotion was approved.

Technical name: `get_promotion`

## What task it solves

> I want to get a promotion.

Returns one promotion including promotionStatus (per-destination approval and itemLevelIssues) — the place to check whether a freshly inserted promotion was approved.

## When to use it

Use this capability when you need “Get a promotion” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `promotion` — **required**. Promotion ID (the {promotion} segment of the resource name).

## What it returns

Returns one promotion including promotionStatus (per-destination approval and itemLevelIssues) — the place to check whether a freshly inserted promotion was approved.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Get a promotion in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Check required parameters, token permissions, and current upstream API limits.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Insert or update a promotion](./insert-promotion.md) — `insert_promotion`
- [List promotions](./list-promotions.md) — `list_promotions`

## Technical details

- **Impact:** read-only
- **Group:** Promotions
- **Description source:** `get_promotion` registration in `src/tools/promotions.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
