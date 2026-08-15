# Google Merchant Center MCP

[![npm](https://img.shields.io/npm/v/mcp-google-merchants)](https://www.npmjs.com/package/mcp-google-merchants)
[![CI](https://github.com/A1-x-Tech/mcp-google-merchants/actions/workflows/ci.yml/badge.svg)](https://github.com/A1-x-Tech/mcp-google-merchants/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-merchants/badges/score.svg)](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-merchants)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

MCP server for **Google Merchant Center** via the **Merchant API v1**: manage your product
feed, promotions and data sources, run MCQL reports, check price competitiveness and product
issues — from Claude, Cursor, Codex and other AI clients in natural language.

Unlike read-only integrations, this server authenticates with your own OAuth credentials and
supports **write operations**: upload and delete products, insert promotions and trigger feed
re-fetches — with destructive tools clearly annotated so MCP hosts can gate them.

## Quick start

1. [Get OAuth credentials](#getting-access) for the Merchant API.
2. Add the server — for example in Claude Code ([other clients](#installation)):

   ```bash
   claude mcp add google-merchants \
     -e GOOGLE_MERCHANTS_CLIENT_ID=your_client_id \
     -e GOOGLE_MERCHANTS_CLIENT_SECRET=your_client_secret \
     -e GOOGLE_MERCHANTS_REFRESH_TOKEN=your_refresh_token \
     -e GOOGLE_MERCHANTS_ACCOUNT_ID=your_merchant_id \
     -- npx -y mcp-google-merchants@latest
   ```

3. Ask the assistant: *"Which of my products are disapproved, and why?"*

## What it can do

| Tool | Description |
|---|---|
| `list_accounts` | Merchant Center accounts you can access (with optional filter). |
| `get_account` | One account's settings (name, language, time zone, ...). |
| `get_homepage` | The store homepage and whether it is claimed. |
| `get_shipping_settings` | Account-level shipping services and warehouses. |
| `list_products` | Processed products as shown in Merchant Center, incl. statuses. |
| `get_product` | One product with `itemLevelIssues` — why it is disapproved. |
| `insert_product_input` | Upload (upsert) a product into an API data source. |
| `update_product_input` | Sparse-update a product (price, availability, ...). |
| `delete_product_input` | Delete a product input from a data source. |
| `list_data_sources` | Feeds/data sources of the account (API, file, UI, autofeed). |
| `get_data_source` | One data source with its feed and fetch configuration. |
| `create_data_source` | Create an API data source for product/promotion writes. |
| `fetch_data_source` | Trigger an immediate re-fetch of a file feed. |
| `insert_promotion` | Create or update a promotion. |
| `list_promotions` | Promotions with their approval statuses. |
| `get_promotion` | One promotion incl. per-destination status. |
| `search_reports` | Run any MCQL query (`reports:search`). |
| `price_competitiveness` | Your prices vs market benchmarks (canned MCQL). |
| `price_insights` | Google's suggested prices + predicted impact (canned MCQL). |
| `list_product_issues` | Aggregated product issues per reporting context/country. |
| `list_method_quotas` | API usage vs quota limits per method group. |
| `raw_request` | Escape hatch to any Merchant API v1 path (SSRF-guarded). |

Resilience: retries with backoff on 429 and on 5xx/network errors for reads (writes are never
replayed), `Retry-After` support, request timeouts, automatic access-token refresh.

## Example prompts

- *"List my Merchant Center products that are out of stock"*
- *"Why is product sku-123 disapproved in Shopping ads?"*
- *"Upload a test product 'Blue Widget' for $9.99 to my API feed"*
- *"Which of my products are priced above the market benchmark in the US?"*
- *"Show clicks and impressions per product for July"*

## MCQL examples

`search_reports` accepts raw Merchant Center Query Language. Field names are snake_case in
queries and camelCase in responses; `SELECT *` is not supported; performance views require a
date range.

```sql
-- Filter products (list_products has no filter — this is the way)
SELECT offer_id, title, price, aggregated_reporting_context_status
FROM product_view
WHERE aggregated_reporting_context_status = 'NOT_ELIGIBLE_OR_DISAPPROVED'
```

```sql
-- Performance over a date range
SELECT offer_id, title, clicks, impressions, click_through_rate
FROM product_performance_view
WHERE date BETWEEN '2026-07-01' AND '2026-07-31'
ORDER BY clicks DESC
```

```sql
-- Price competitiveness (requires the free Market Insights opt-in)
SELECT offer_id, title, price, benchmark_price
FROM price_competitiveness_product_view
WHERE report_country_code = 'US'
```

## API access

The server talks to the **Merchant API v1** (`merchantapi.googleapis.com`) — the successor of
the Content API for Shopping (sunset in August 2026). Auth is standard Google OAuth 2.0 with
the scope `https://www.googleapis.com/auth/content`; the server exchanges your refresh token
for access tokens automatically.

> **One-time registration required.** Before any Merchant API call works, your Google Cloud
> project must be registered with the Merchant Center account once (needs Admin access):
>
> ```
> raw_request POST accounts/v1/accounts/{account}/developerRegistration:registerGcp
> body: {"developerEmail": "you@example.com"}
> ```
>
> You can do it right from the assistant with the `raw_request` tool, or with any HTTP client.
> Until then every call fails with a permission error.

## Installation

<details open>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add google-merchants \
  -e GOOGLE_MERCHANTS_CLIENT_ID=your_client_id \
  -e GOOGLE_MERCHANTS_CLIENT_SECRET=your_client_secret \
  -e GOOGLE_MERCHANTS_REFRESH_TOKEN=your_refresh_token \
  -e GOOGLE_MERCHANTS_ACCOUNT_ID=your_merchant_id \
  -- npx -y mcp-google-merchants@latest
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

`claude_desktop_config.json` — macOS `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\`

```json
{
  "mcpServers": {
    "google-merchants": {
      "command": "npx",
      "args": ["-y", "mcp-google-merchants@latest"],
      "env": {
        "GOOGLE_MERCHANTS_CLIENT_ID": "your_client_id",
        "GOOGLE_MERCHANTS_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_MERCHANTS_REFRESH_TOKEN": "your_refresh_token",
        "GOOGLE_MERCHANTS_ACCOUNT_ID": "your_merchant_id"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

`~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project)

```json
{
  "mcpServers": {
    "google-merchants": {
      "command": "npx",
      "args": ["-y", "mcp-google-merchants@latest"],
      "env": {
        "GOOGLE_MERCHANTS_CLIENT_ID": "your_client_id",
        "GOOGLE_MERCHANTS_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_MERCHANTS_REFRESH_TOKEN": "your_refresh_token",
        "GOOGLE_MERCHANTS_ACCOUNT_ID": "your_merchant_id"
      }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code</b></summary>

`.vscode/mcp.json` — note the `servers` key (not `mcpServers`)

```json
{
  "servers": {
    "google-merchants": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-google-merchants@latest"],
      "env": {
        "GOOGLE_MERCHANTS_CLIENT_ID": "your_client_id",
        "GOOGLE_MERCHANTS_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_MERCHANTS_REFRESH_TOKEN": "your_refresh_token",
        "GOOGLE_MERCHANTS_ACCOUNT_ID": "your_merchant_id"
      }
    }
  }
}
```

</details>

## Getting access

1. **Create (or pick) a Google Cloud project** at [console.cloud.google.com](https://console.cloud.google.com/)
   and enable the **Merchant API** (APIs & Services → Library → "Merchant API" → Enable).
2. **Configure the OAuth consent screen** (APIs & Services → OAuth consent screen): External,
   fill in the app name and your email, and add yourself as a test user (Testing mode is fine
   for personal use).
3. **Create an OAuth client** (APIs & Services → Credentials → Create credentials →
   OAuth client ID → *Desktop app*). Save the **client ID** and **client secret**.
4. **Mint a refresh token** for the scope `https://www.googleapis.com/auth/content`. The
   quickest way is the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
   - click the gear icon → check **Use your own OAuth credentials** → paste your client ID/secret;
   - in Step 1 enter the scope `https://www.googleapis.com/auth/content` and authorize with the
     Google account that has access to your Merchant Center;
   - in Step 2 click **Exchange authorization code for tokens** and copy the **refresh token**.

   (Any other flow works too — the server only needs the resulting refresh token. For quick
   experiments you can instead pass a short-lived access token as
   `GOOGLE_MERCHANTS_ACCESS_TOKEN`, e.g. from `gcloud auth print-access-token`.)
5. **Find your Merchant Center ID** — the number in the top-right corner of
   [merchants.google.com](https://merchants.google.com/) — and put it in
   `GOOGLE_MERCHANTS_ACCOUNT_ID` (or pass `account` per tool call, or discover it with
   `list_accounts`).
6. **Register your GCP project** with the Merchant Center account (one-time, Admin access
   required) — see [API access](#api-access).

⚠️ Credentials are stored **in plain text** in your MCP client config — treat them like
passwords. The refresh token grants full read/write access to your Merchant Center.

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_MERCHANTS_CLIENT_ID` | yes* | — | OAuth 2.0 client ID. |
| `GOOGLE_MERCHANTS_CLIENT_SECRET` | yes* | — | OAuth 2.0 client secret. |
| `GOOGLE_MERCHANTS_REFRESH_TOKEN` | yes* | — | OAuth refresh token (scope `.../auth/content`). |
| `GOOGLE_MERCHANTS_ACCESS_TOKEN` | yes* | — | Pre-minted access token (~1h) — alternative to the three above. |
| `GOOGLE_MERCHANTS_ACCOUNT_ID` | no | — | Default Merchant Center account ID; tools can override per call. |
| `GOOGLE_MERCHANTS_API_BASE` | no | `https://merchantapi.googleapis.com` | API root override. |
| `GOOGLE_MERCHANTS_TOKEN_URL` | no | `https://oauth2.googleapis.com/token` | OAuth token endpoint override. |
| `GOOGLE_MERCHANTS_TIMEOUT_MS` | no | `60000` | Per-request timeout, ms. |
| `GOOGLE_MERCHANTS_MAX_RETRIES` | no | `3` | Retries on transient errors. |

\* Either the client ID + secret + refresh token trio, **or** a bare access token.

## Data & telemetry

### Requests to Google

The server runs on your machine and talks to `merchantapi.googleapis.com` directly. Your OAuth
credentials are sent only to Google's token endpoint and the Merchant API — never anywhere
else. Even `raw_request` takes a relative path: anything that resolves to a foreign origin is
rejected.

### Anonymous telemetry

By default the server sends three kinds of technical events to `usage.gistrec.cloud`: a server
start, the name of an invoked tool, and the reason code of a failed startup.

An event carries a random installation ID, the package version, the AI client's name and
version, the Node.js version and the operating system. **OAuth credentials, account data,
product data, tool arguments and query texts are never read or sent.** Sends run in the
background with a 2-second timeout and never affect the server's operation.

To disable telemetry for all Ask Ads MCP servers, add:

```text
ASKADS_TELEMETRY=0
```

The implementation lives in [`src/telemetry.ts`](./src/telemetry.ts).

## Requirements

- Node.js 20+ (runs via `npx`, no separate install needed).
- A Merchant Center account and a registered Google Cloud project — see
  [Getting access](#getting-access).

## Limitations

- **Product writes are asynchronous.** After `insert_product_input` /
  `delete_product_input` the processed product updates within minutes — an immediate
  `get_product` may 404 or show stale data. Data-quality problems appear later in
  `productStatus.itemLevelIssues`, not as API errors.
- **`price_competitiveness` / `price_insights`** return rows only for accounts opted into
  Market Insights (free, in Merchant Center settings).
- **`list_product_issues`** works for sub-accounts and standalone accounts only, not for
  advanced (parent) accounts.
- **Quotas are per-account** with daily counters resetting at 12:00 UTC (midday). Check your
  current usage with `list_method_quotas`.

## Documentation

- [All tools](https://github.com/A1-x-Tech/mcp-google-merchants/blob/main/docs/TOOLS.md) — full list with details.
- [Development](https://github.com/A1-x-Tech/mcp-google-merchants/blob/main/docs/DEVELOPMENT.md) — build, tests, smoke check.
- [Publishing](https://github.com/A1-x-Tech/mcp-google-merchants/blob/main/docs/PUBLISHING.md) — releases and MCP registry listing.

## Support

Questions, ideas and contributions — Telegram: [@gistrec](http://t.me/gistrec) or
[GitHub issues](https://github.com/A1-x-Tech/mcp-google-merchants/issues).

## License

MIT — see [LICENSE](./LICENSE).
