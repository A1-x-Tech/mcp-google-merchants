# Google Merchant Center MCP capabilities

This catalog contains 22 public pages—one for every registered MCP tool in `mcp-google-merchants`. Each page starts with the user's task, explains the result, and states whether the call changes real data.

Use this catalog to choose a ready-made capability. Full parameter schemas and API response details remain in the [technical reference](../TOOLS.md).

## Data sources

- [Create an API data source](./create-data-source.md) — Creates an API (generic) data source — the target that insert_product_input / update_product_input / insert_promotion need as data_source. **Impact:** changes data.
- [Re-fetch a file feed now](./fetch-data-source.md) — Triggers an immediate re-fetch (re-read) of a file-based feed outside its regular schedule. **Impact:** changes data.
- [Get a data source](./get-data-source.md) — Returns one data source by its numeric ID (or full resource name): type, input (API/FILE/UI/AUTOFEED), feed configuration and fetch settings. **Impact:** read-only.
- [List data sources](./list-data-sources.md) — Lists the data sources of an account. **Impact:** read-only.

## Products

- [Delete a product input](./delete-product-input.md) — Deletes a product input from a specific data source (data_source is required — the same product can exist in several sources, and only the targeted input is removed). **Impact:** destructive operation.
- [Get a processed product](./get-product.md) — Returns one processed product including productStatus.itemLevelIssues (code, severity, resolution, description) — the place to see why a product is disapproved. **Impact:** read-only.
- [Insert or replace a product](./insert-product-input.md) — Uploads (upserts) a product into an API data source: an existing input with the same contentLanguage~feedLabel~offerId in that data source is fully replaced. **Impact:** destructive operation.
- [List processed products](./list-products.md) — Lists the processed products of an account, as shown in Merchant Center. **Impact:** read-only.
- [Update a product input](./update-product-input.md) — Sparse-updates an existing product input — the cheap way to change price or availability without re-sending the whole product. **Impact:** changes data.

## Accounts

- [Get a Merchant Center account](./get-account.md) — Returns a single Merchant Center account: name (accounts/{id}), accountId, accountName, languageCode, timeZone, adultContent and testAccount. **Impact:** read-only.
- [Get the store homepage](./get-homepage.md) — Returns the store homepage of an account: uri and claimed (whether the homepage is verified and claimed by the merchant — a prerequisite for serving offers). **Impact:** read-only.
- [Get shipping settings](./get-shipping-settings.md) — Returns the account-level shipping settings: services[] (delivery countries, delivery times, rate tables and carrier rates), warehouses[] and an etag. **Impact:** read-only.
- [List Merchant Center accounts](./list-accounts.md) — Lists the Merchant Center accounts the authenticated user can access. **Impact:** read-only.

## Promotions

- [Get a promotion](./get-promotion.md) — Returns one promotion including promotionStatus (per-destination approval and itemLevelIssues) — the place to check whether a freshly inserted promotion was approved. **Impact:** read-only.
- [Insert or update a promotion](./insert-promotion.md) — Creates or updates a promotion. **Impact:** changes data.
- [List promotions](./list-promotions.md) — Lists the promotions of an account: promotions[] (name, promotionId, contentLanguage, targetCountry, redemptionChannel, attributes, promotionStatus with destination statuses and itemLevelIssues) and nextPageToken. **Impact:** read-only.

## Quota

- [API quota usage](./list-method-quotas.md) — Shows the account's Merchant API usage vs limits per method group (quota sub-API): quotaGroups[] with name, quotaUsage, quotaLimit (per day), quotaMinuteLimit and methodDetails[] listing the methods in each group. **Impact:** read-only.

## Issues

- [Aggregated product issues](./list-product-issues.md) — Lists aggregate product statuses per reporting context and country (issueresolution sub-API): stats {active, pending, disapproved, expiring counts} plus itemLevelIssues[] with how many products each issue affects — the fastest way to see what is wrong with a feed at a glance. **Impact:** read-only.

## Reports

- [Price competitiveness vs the market](./price-competitiveness.md) — Convenience wrapper over a canned MCQL query on price_competitiveness_product_view: for each product, your price vs the market benchmark_price (aggregated from comparable offers across merchants) with report_country_code. **Impact:** read-only.
- [Suggested prices & predicted impact](./price-insights.md) — Convenience wrapper over a canned MCQL query on price_insights_product_view: Google's suggested_price per product with the predicted change in impressions, clicks and conversions if you adopt it (predicted_*_change_fraction, e.g. **Impact:** read-only.
- [Run an MCQL report query](./search-reports.md) — Runs a Merchant Center Query Language (MCQL) query via reports:search. **Impact:** read-only.

## Additional API methods

- [Raw Merchant API call](./raw-request.md) — Escape hatch to call any Merchant API v1 path directly, for endpoints without a dedicated tool (e.g. **Impact:** destructive operation.

## For maintainers and publishers

- [MCP capability documentation contract](../CAPABILITY-DOCUMENTATION.md)
- [Technical tool reference](../TOOLS.md)
- [GitHub repository](https://github.com/A1-x-Tech/mcp-google-merchants)
