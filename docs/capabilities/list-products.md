# Google Merchant Center: List processed products — MCP tool

**Google Merchant Center MCP tool:** Lists the processed products of an account, as shown in Merchant Center.

Technical name: `list_products`

## What task it solves

> I want to list processed products.

Lists the processed products of an account, as shown in Merchant Center.

## When to use it

Use this capability when you need “List processed products” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `page_size` — **optional**. Max results per page (1..1000; API default 25).
- `page_token` — **optional**. nextPageToken from the previous response. All other parameters must be identical to the previous call.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> List processed products in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Each product has name (accounts/{a}/products/{contentLanguage~feedLabel~offerId} — NO channel segment in v1), offerId, contentLanguage, feedLabel, dataSource, productAttributes (title, price, availability, ...), productStatus with itemLevelIssues, and base64EncodedName (use it when offerId contains URL-hostile characters like '/'). The list has no server-side filter — filter via search_reports on product_view. Recently inserted products appear only after async processing (minutes).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Delete a product input](./delete-product-input.md) — `delete_product_input`
- [Get a processed product](./get-product.md) — `get_product`
- [Insert or replace a product](./insert-product-input.md) — `insert_product_input`
- [Update a product input](./update-product-input.md) — `update_product_input`

## Technical details

- **Impact:** read-only
- **Group:** Products
- **Description source:** `list_products` registration in `src/tools/products.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
