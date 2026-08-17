# Google Merchant Center: Get shipping settings — MCP tool

**Google Merchant Center MCP tool:** Returns the account-level shipping settings: services[] (delivery countries, delivery times, rate tables and carrier rates), warehouses[] and an etag.

Technical name: `get_shipping_settings`

## What task it solves

> I want to get shipping settings.

Returns the account-level shipping settings: services[] (delivery countries, delivery times, rate tables and carrier rates), warehouses[] and an etag.

## When to use it

Use this capability when you need “Get shipping settings” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.

## What it returns

Returns the account-level shipping settings: services[] (delivery countries, delivery times, rate tables and carrier rates), warehouses[] and an etag.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Get shipping settings in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Read-only by design: the API's only write is shippingSettings:insert, a FULL REPLACE of every service — too dangerous for a tool; use raw_request if you really need it.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a Merchant Center account](./get-account.md) — `get_account`
- [Get the store homepage](./get-homepage.md) — `get_homepage`
- [List Merchant Center accounts](./list-accounts.md) — `list_accounts`

## Technical details

- **Impact:** read-only
- **Group:** Accounts
- **Description source:** `get_shipping_settings` registration in `src/tools/accounts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
