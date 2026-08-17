# Google Merchant Center: List Merchant Center accounts — MCP tool

**Google Merchant Center MCP tool:** Lists the Merchant Center accounts the authenticated user can access.

Technical name: `list_accounts`

## What task it solves

> I want to list Merchant Center accounts.

Lists the Merchant Center accounts the authenticated user can access.

## When to use it

Use this capability when you need “List Merchant Center accounts” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `page_size` — **optional**. Max results per page (1..500; API default 250).
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.
- `filter` — **optional**. Account filter, e.g. accountName = "*store*" or relationship(providerId = 123).

## What it returns

Returns accounts[] (name, accountId, accountName, languageCode, timeZone, adultContent, testAccount) and nextPageToken.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> List Merchant Center accounts in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Use it first to discover the account ID the other tools need (or set GOOGLE_MERCHANTS_ACCOUNT_ID once). Optional filter uses the account filter syntax, e.g. accountName = "*store*".

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a Merchant Center account](./get-account.md) — `get_account`
- [Get the store homepage](./get-homepage.md) — `get_homepage`
- [Get shipping settings](./get-shipping-settings.md) — `get_shipping_settings`

## Technical details

- **Impact:** read-only
- **Group:** Accounts
- **Description source:** `list_accounts` registration in `src/tools/accounts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
