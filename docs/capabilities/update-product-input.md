# Google Merchant Center: Update a product input — MCP tool

**Google Merchant Center MCP tool:** Sparse-updates an existing product input — the cheap way to change price or availability without re-sending the whole product.

Technical name: `update_product_input`

## What task it solves

> I want to update a product input.

Sparse-updates an existing product input — the cheap way to change price or availability without re-sending the whole product.

## When to use it

Use this capability when you need “Update a product input” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `product_input` — **required**. Product input ID: "contentLanguage~feedLabel~offerId" or the base64url name.
- `data_source` — **required**. Data source: numeric ID (e.g. "104628") or full name "accounts/{account}/dataSources/{id}". Product/promotion writes require an API-type data source (input: API), not a file feed.
- `update_mask` — **optional**. Comma-separated attribute paths to update, e.g. "productAttributes.price". Omit to apply every populated field of this request.
- `product_attributes` — **optional**. Product attributes to change (camelCase), e.g. {"price": {"amountMicros": "8990000", "currencyCode": "USD"}, "availability": "out_of_stock"}.
- `custom_attributes` — **optional**. Custom (non-standard) attributes as {name, value} pairs.
- `version_number` — **optional**. Optional int64 freshness guard (as a string).

## What it returns

Returns the updated ProductInput; the processed product refreshes after async processing (minutes).

## What changes in Google Merchant Center

The tool changes real Google Merchant Center data as described above. The server does not promise an automatic rollback.

## Example request

> Update a product input in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

data_source must be the source holding the input. update_mask is a comma-separated list of attribute paths (e.g. "productAttributes.price,productAttributes.availability"); when omitted, all populated fields of the request are applied. Every path listed in update_mask MUST carry a value in this request — a masked path with no value ERASES that attribute (the tool rejects such requests locally; to clear an attribute intentionally use raw_request). To create a product or replace it wholesale use insert_product_input.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Delete a product input](./delete-product-input.md) — `delete_product_input`
- [Get a processed product](./get-product.md) — `get_product`
- [Insert or replace a product](./insert-product-input.md) — `insert_product_input`
- [List processed products](./list-products.md) — `list_products`

## Technical details

- **Impact:** changes data
- **Group:** Products
- **Description source:** `update_product_input` registration in `src/tools/products.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
