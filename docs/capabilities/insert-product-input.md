# Google Merchant Center: Insert or replace a product — MCP tool

**Google Merchant Center MCP tool:** Uploads (upserts) a product into an API data source: an existing input with the same contentLanguage~feedLabel~offerId in that data source is fully replaced.

Technical name: `insert_product_input`

## What task it solves

> I want to synchronize a product input.

Uploads (upserts) a product into an API data source: an existing input with the same contentLanguage~feedLabel~offerId in that data source is fully replaced.

## When to use it

Use this capability when you need “Insert or replace a product” without doing the same work manually in the Google Merchant Center interface. It runs only when an AI client calls it.

## What to provide

- `account` — **optional**. Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.
- `data_source` — **required**. Data source: numeric ID (e.g. "104628") or full name "accounts/{account}/dataSources/{id}". Product/promotion writes require an API-type data source (input: API), not a file feed.
- `offer_id` — **required**. The merchant's unique offer ID (SKU).
- `content_language` — **required**. Two-letter ISO 639-1 language of the listing, e.g. "en".
- `feed_label` — **required**. Feed label, usually the target country CLDR code, e.g. "US" (≤20 chars, no spaces).
- `product_attributes` — **optional**. Product attributes object: title, description, link, imageLink, price {amountMicros, currencyCode}, availability (in_stock/out_of_stock/preorder/backorder), condition (new/refurbished/used), gtin (array), brand, color, sizes, etc. Attribute names are camelCase.
- `custom_attributes` — **optional**. Custom (non-standard) attributes as {name, value} pairs.
- `version_number` — **optional**. Optional int64 freshness guard (as a string): an insert with a lower version than the stored one is rejected.

## What it returns

Returns the ProductInput (name, product = the future processed name, base64EncodedProduct).

## What changes in Google Merchant Center

The source marks the entire “Insert or replace a product” call as destructive. The exact effect depends on the selected action and is described below; review the parameters and reversibility before calling it.

## Example request

> Insert or replace a product in Google Merchant Center. Ask for any required identifiers that are missing. Show me the exact change and wait for confirmation first.

## Errors and limitations

Requires data_source (an API-type source — create one with create_data_source or in Merchant Center; file feeds cannot be written). Inserting with a different data source MOVES the product to it. Processing is async: the processed product shows up in get_product/list_products after several minutes, and data-quality problems surface later in productStatus.itemLevelIssues, not as API errors. Prices go in product_attributes as {"price": {"amountMicros": "9990000", "currencyCode": "USD"}} (1 unit = 1,000,000 micros).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Delete a product input](./delete-product-input.md) — `delete_product_input`
- [Get a processed product](./get-product.md) — `get_product`
- [List processed products](./list-products.md) — `list_products`
- [Update a product input](./update-product-input.md) — `update_product_input`

## Technical details

- **Impact:** destructive operation
- **Group:** Products
- **Description source:** `insert_product_input` registration in `src/tools/products.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
