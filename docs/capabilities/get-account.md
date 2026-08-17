# Google Merchant Center: Get a Merchant Center account — MCP tool

**Google Merchant Center MCP tool:** Returns a single Merchant Center account: name (accounts/{id}), accountId, accountName, languageCode, timeZone, adultContent and testAccount.

Technical name: `get_account`

## What task it solves

> I want to get a Merchant Center account.

Returns a single Merchant Center account: name (accounts/{id}), accountId, accountName, languageCode, timeZone, adultContent and testAccount.

## When to use it

Use this capability when you need “Get a Merchant Center account” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.

## What it returns

Returns a single Merchant Center account: name (accounts/{id}), accountId, accountName, languageCode, timeZone, adultContent and testAccount.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Get a Merchant Center account in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Useful to verify the configured account or inspect a sub-account.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get the store homepage](./get-homepage.md) — `get_homepage`
- [Get shipping settings](./get-shipping-settings.md) — `get_shipping_settings`
- [List Merchant Center accounts](./list-accounts.md) — `list_accounts`

## Technical details

- **Impact:** read-only
- **Group:** Accounts
- **Description source:** `get_account` registration in `src/tools/accounts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
