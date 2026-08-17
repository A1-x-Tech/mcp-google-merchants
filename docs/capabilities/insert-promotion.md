# Google Merchant Center: Insert or update a promotion — MCP tool

**Google Merchant Center MCP tool:** Creates or updates a promotion.

Technical name: `insert_promotion`

## What task it solves

> I want to synchronize a promotion.

Creates or updates a promotion.

## When to use it

Use this capability when you need “Insert or update a promotion” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `data_source` — **required**. Data source: numeric ID (e.g. "104628") or full name "accounts/{account}/dataSources/{id}". Product/promotion writes require an API-type data source (input: API), not a file feed.
- `promotion` — **required**. Promotion object. Required: promotionId, contentLanguage, targetCountry, redemptionChannel (["ONLINE"] and/or ["IN_STORE"]). Optional: attributes {longTitle, couponValueType, offerType, genericRedemptionCode, promotionEffectiveTimePeriod {startTime, endTime}, productApplicability, moneyOffAmount, percentOff, ...}, customAttributes, versionNumber.

## What it returns

Returns the Promotion incl.

## What changes in Google Merchant Center

The tool changes real Google Merchant Center data as described above. The server does not promise an automatic rollback.

## Example request

> Insert or update a promotion in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Unlike product writes, the data source travels in the request BODY (the server assembles it). The promotion object requires promotionId, contentLanguage (ISO 639-1), targetCountry (CLDR, e.g. "US") and redemptionChannel (array with ONLINE and/or IN_STORE — at least one). Optional `attributes` carry longTitle, couponValueType, offerType, genericRedemptionCode, promotionEffectiveTimePeriod {startTime, endTime}, productApplicability, moneyOffAmount, percentOff, etc. promotionStatus; approval happens asynchronously (check get_promotion later).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a promotion](./get-promotion.md) — `get_promotion`
- [List promotions](./list-promotions.md) — `list_promotions`

## Technical details

- **Impact:** changes data
- **Group:** Promotions
- **Description source:** `insert_promotion` registration in `src/tools/promotions.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
