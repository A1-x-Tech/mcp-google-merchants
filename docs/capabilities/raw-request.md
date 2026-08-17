# Google Merchant Center: Raw Merchant API call — MCP tool

**Google Merchant Center MCP tool:** Escape hatch to call any Merchant API v1 path directly, for endpoints without a dedicated tool (e.g.

Technical name: `raw_request`

## What task it solves

> I want to raw Merchant API call.

Escape hatch to call any Merchant API v1 path directly, for endpoints without a dedicated tool (e.g.

## When to use it

Use this capability when you need “Raw Merchant API call” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `path` — **required**. Relative API path incl. the sub-API prefix, e.g. "accounts/v1/accounts/123/issues".
- `method` — **optional**. HTTP method. Defaults to GET.
- `query` — **optional**. URL query parameters, e.g. {"dataSource": "accounts/1/dataSources/2"}.
- `body` — **optional**. JSON request body (POST/PATCH).

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The source marks the entire “Raw Merchant API call” call as destructive. The exact effect depends on the selected action and is described below; review the parameters and reversibility before calling it.

## Example request

> Raw Merchant API call in Google Merchant Center. Ask for any required identifiers that are missing. Show me the exact change and wait for confirmation first.

## Errors and limitations

"accounts/v1/accounts/123/issues" or the one-time "accounts/v1/accounts/123/developerRegistration:registerGcp"). The path must include the sub-API prefix (accounts/v1, products/v1, datasources/v1, promotions/v1, reports/v1, issueresolution/v1, quota/v1, inventories/v1, ...). `query` adds URL query parameters (e.g. dataSource for productInputs writes, updateMask for PATCH); `body` is sent as JSON. Can create, modify and delete data — use the dedicated tools when one exists.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

There are no other dedicated tools in this group.

## Technical details

- **Impact:** destructive operation
- **Group:** Additional API methods
- **Description source:** `raw_request` registration in `src/tools/raw.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
