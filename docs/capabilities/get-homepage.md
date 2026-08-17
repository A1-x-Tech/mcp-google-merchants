# Google Merchant Center: Get the store homepage — MCP tool

**Google Merchant Center MCP tool:** Returns the store homepage of an account: uri and claimed (whether the homepage is verified and claimed by the merchant — a prerequisite for serving offers).

Technical name: `get_homepage`

## What task it solves

> I want to get the store homepage.

Returns the store homepage of an account: uri and claimed (whether the homepage is verified and claimed by the merchant — a prerequisite for serving offers).

## When to use it

Use this capability when you need “Get the store homepage” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.

## What it returns

Returns the store homepage of an account: uri and claimed (whether the homepage is verified and claimed by the merchant — a prerequisite for serving offers).

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Get the store homepage in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

An unclaimed homepage is a common reason for account-level problems; claiming/unclaiming is not exposed as a tool (use raw_request POST accounts/v1/accounts/{a}/homepage:claim if you really need it).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a Merchant Center account](./get-account.md) — `get_account`
- [Get shipping settings](./get-shipping-settings.md) — `get_shipping_settings`
- [List Merchant Center accounts](./list-accounts.md) — `list_accounts`

## Technical details

- **Impact:** read-only
- **Group:** Accounts
- **Description source:** `get_homepage` registration in `src/tools/accounts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
