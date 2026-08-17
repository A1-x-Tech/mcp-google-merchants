# Google Merchant Center: Get a processed product — MCP tool

**Google Merchant Center MCP tool:** Returns one processed product including productStatus.itemLevelIssues (code, severity, resolution, description) — the place to see why a product is disapproved.

Technical name: `get_product`

## What task it solves

> I want to get a processed product.

Returns one processed product including productStatus.itemLevelIssues (code, severity, resolution, description) — the place to see why a product is disapproved.

## When to use it

Use this capability when you need “Get a processed product” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `product` — **optional**. Product ID: "contentLanguage~feedLabel~offerId" (e.g. "en~US~sku123") or the base64url base64EncodedName. Omit when passing the three components separately.
- `content_language` — **optional**. Two-letter ISO 639-1 content language, e.g. "en". Used with feed_label + offer_id.
- `feed_label` — **optional**. Feed label, e.g. "US". Used with content_language + offer_id.
- `offer_id` — **optional**. The merchant's offer ID (SKU). Used with content_language + feed_label.

## What it returns

Returns one processed product including productStatus.itemLevelIssues (code, severity, resolution, description) — the place to see why a product is disapproved.

## What changes in Google Merchant Center

The tool reads Google Merchant Center data and does not change it.

## Example request

> Get a processed product in Google Merchant Center. Ask for any required identifiers that are missing.

## Errors and limitations

Identify the product either with `product` ("contentLanguage~feedLabel~offerId", e.g. "en~US~sku123", or the base64url base64EncodedName; legacy local products use a local~ prefix) or with the three components content_language + feed_label + offer_id. A product inserted moments ago may 404 until async processing finishes (minutes).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Delete a product input](./delete-product-input.md) — `delete_product_input`
- [Insert or replace a product](./insert-product-input.md) — `insert_product_input`
- [List processed products](./list-products.md) — `list_products`
- [Update a product input](./update-product-input.md) — `update_product_input`

## Technical details

- **Impact:** read-only
- **Group:** Products
- **Description source:** `get_product` registration in `src/tools/products.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
