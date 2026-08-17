# Google Merchant Center: Aggregated product issues — MCP tool

**Google Merchant Center MCP tool:** Lists aggregate product statuses per reporting context and country (issueresolution sub-API): stats {active, pending, disapproved, expiring counts} plus itemLevelIssues[] with how many products each issue affects — the fastest way to see what is wrong with a feed at a glance.

Technical name: `list_product_issues`

## What task it solves

> I want to aggregated product issues.

Lists aggregate product statuses per reporting context and country (issueresolution sub-API): stats {active, pending, disapproved, expiring counts} plus itemLevelIssues[] with how many products each issue affects — the fastest way to see what is wrong with a feed at a glance.

## When to use it

Use this capability when you need “Aggregated product issues” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `filter` — **optional**. Filter on reporting_context and/or country only, e.g. reporting_context = "SHOPPING_ADS" AND country = "US".
- `page_size` — **optional**. Max results per page (1..1000; API default 25).
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Aggregated product issues in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Works only for sub-accounts and standalone accounts, NOT for advanced (parent) accounts. The filter supports only reporting_context and country, e.g. reporting_context = "SHOPPING_ADS" AND country = "US". For a single product's issues use get_product (productStatus.itemLevelIssues).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

There are no other dedicated tools in this group.

## Technical details

- **Impact:** read-only
- **Group:** Issues
- **Description source:** `list_product_issues` registration in `src/tools/issues.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
