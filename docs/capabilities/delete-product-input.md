# Google Merchant Center: Delete a product input — MCP tool

**Google Merchant Center MCP tool:** Deletes a product input from a specific data source (data_source is required — the same product can exist in several sources, and only the targeted input is removed).

Technical name: `delete_product_input`

## What task it solves

> I want to delete a product input.

Deletes a product input from a specific data source (data_source is required — the same product can exist in several sources, and only the targeted input is removed).

## When to use it

Use this capability when you need “Delete a product input” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `product_input` — **required**. Product input ID: "contentLanguage~feedLabel~offerId" or the base64url name.
- `data_source` — **required**. Data source: numeric ID (e.g. "104628") or full name "accounts/{account}/dataSources/{id}". Product/promotion writes require an API-type data source (input: API), not a file feed.

## What it returns

Returns an empty object on success; the processed product disappears after async processing (minutes).

## What changes in Google Merchant Center

The source marks the entire “Delete a product input” call as destructive. The exact effect depends on the selected action and is described below; review the parameters and reversibility before calling it.

## Example request

> Delete a product input in Google Merchant Center. Ask for any required identifiers that are missing. Show me the exact change and wait for confirmation first.

## Errors and limitations

product_input is "contentLanguage~feedLabel~offerId" or the base64url name.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a processed product](./get-product.md) — `get_product`
- [Insert or replace a product](./insert-product-input.md) — `insert_product_input`
- [List processed products](./list-products.md) — `list_products`
- [Update a product input](./update-product-input.md) — `update_product_input`

## Technical details

- **Impact:** destructive operation
- **Group:** Products
- **Description source:** `delete_product_input` registration in `src/tools/products.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
