# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- `insert_product_input` is now annotated **DESTRUCTIVE** (was WRITE): it wholesale-replaces an
  existing input with the same ID and moves the product when given a different data source. Hosts
  that gate destructive tools will now ask before it runs.
- `update_product_input` now rejects, locally and before any API call, an `update_mask` path that
  has no matching value in the request — the API treats such a path as "erase this attribute" and
  answers with a successful ProductInput, so a copied mask could silently drop a price. Clearing
  an attribute intentionally is still possible via `raw_request`.

### Fixed

- Report tools (`search_reports`, `price_competitiveness`, `price_insights`): the `page_size`
  schema claimed a maximum of 100 000 while the API caps the page at 5000 — the schema now says
  5000.

### Added

- README now discloses the anonymous telemetry (`usage.gistrec.cloud`) in a Data & telemetry
  section and lists `ASKADS_TELEMETRY` in the Configuration table (previously documented only in
  docs/DEVELOPMENT.md, which is not shipped in the npm tarball).

## [1.0.1] — 2026-08-12

### Added

- Server instructions. The MCP `initialize` response now carries a short briefing for the calling
  model: what this API is and is not, what it cannot do, and the quotas, retry rules and misleading
  failures that should change how it is used. That knowledge previously lived only in the README,
  which a model never reads.

## [1.0.0] — 2026-08-11

### Changed

- Declared stable. The tool surface, input schemas and environment variables of 0.1.x carry over
  unchanged — this release marks API stability, not new behaviour.

## [0.1.0] — 2026-08-09

### Added
- First working release: MCP server for **Google Merchant Center (Merchant API v1)**
  over stdio, with OAuth 2.0 refresh-token auth (`GOOGLE_MERCHANTS_CLIENT_ID` /
  `GOOGLE_MERCHANTS_CLIENT_SECRET` / `GOOGLE_MERCHANTS_REFRESH_TOKEN`, scope
  `https://www.googleapis.com/auth/content`) or a pre-minted
  `GOOGLE_MERCHANTS_ACCESS_TOKEN`, plus an optional default account
  (`GOOGLE_MERCHANTS_ACCOUNT_ID`, overridable per tool call).
- 22 tools:
  - Accounts: `list_accounts`, `get_account`, `get_homepage`,
    `get_shipping_settings`;
  - Products: `list_products`, `get_product`, `insert_product_input`,
    `update_product_input`, `delete_product_input` (v1 product IDs
    `contentLanguage~feedLabel~offerId`, `dataSource` enforced on every write);
  - Data sources: `list_data_sources`, `get_data_source`, `create_data_source`,
    `fetch_data_source`;
  - Promotions: `insert_promotion`, `list_promotions`, `get_promotion`;
  - Reports: `search_reports` (raw MCQL) and the canned wrappers
    `price_competitiveness`, `price_insights` (Market Insights views);
  - Issues & quota: `list_product_issues` (aggregate product statuses),
    `list_method_quotas` (API usage vs limits);
  - `raw_request` escape hatch to any Merchant API v1 path (SSRF-guarded).
- Resilience: retries with backoff on 429 (any method) and on 5xx/network
  errors (GET only — writes are never replayed), `Retry-After` support,
  request timeout covering body reads, automatic access-token refresh with
  caching and a single retry on 401.
- Anonymous usage telemetry (`server_start`, `tool_call`, `startup_failed`;
  names/versions only, never data or arguments; opt out with `ASKADS_TELEMETRY=0`).
- Offline test suite (node:test + mocked `fetch`) covering every tool, plus a
  dist smoke test performing a real MCP handshake with the built binary over stdio.
- CI (Node 20/22/24) and a daily read-only live health check (skipped when
  secrets are not configured).

[Unreleased]: https://github.com/A1-x-Tech/mcp-google-merchants/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/A1-x-Tech/mcp-google-merchants/releases/tag/v1.0.1
[1.0.0]: https://github.com/A1-x-Tech/mcp-google-merchants/releases/tag/v1.0.0
[0.1.0]: https://github.com/A1-x-Tech/mcp-google-merchants/releases/tag/v0.1.0
