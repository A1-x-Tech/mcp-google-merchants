# Google Merchant Center: API quota usage — MCP tool

**Google Merchant Center MCP tool:** Shows the account's Merchant API usage vs limits per method group (quota sub-API): quotaGroups[] with name, quotaUsage, quotaLimit (per day), quotaMinuteLimit and methodDetails[] listing the methods in each group.

Technical name: `list_method_quotas`

## What task it solves

> I want to aPI quota usage.

Shows the account's Merchant API usage vs limits per method group (quota sub-API): quotaGroups[] with name, quotaUsage, quotaLimit (per day), quotaMinuteLimit and methodDetails[] listing the methods in each group.

## When to use it

Use this capability when you need “API quota usage” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `page_size` — **optional**. Max quota groups per page.
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> API quota usage in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Daily counters reset at 12:00 UTC — midday, not midnight. Use it to diagnose HTTP 429 RESOURCE_EXHAUSTED errors and to see how much headroom is left.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

There are no other dedicated tools in this group.

## Technical details

- **Impact:** read-only
- **Group:** Quota
- **Description source:** `list_method_quotas` registration in `src/tools/quota.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
