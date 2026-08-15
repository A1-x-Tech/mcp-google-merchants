# <img src="./assets/a1-logo.svg" alt="A1" width="40"> Google Merchant Center MCP

**English** | [Русский](./README.ru.md)

[![npm](https://img.shields.io/npm/v/mcp-google-merchants)](https://www.npmjs.com/package/mcp-google-merchants)
[![CI](https://github.com/A1-x-Tech/mcp-google-merchants/actions/workflows/ci.yml/badge.svg)](https://github.com/A1-x-Tech/mcp-google-merchants/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-merchants/badges/score.svg)](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-merchants)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**A1 Google Merchant Center MCP** connects an AI app to your Google Merchant Center account. Find out why products are disapproved, inspect feeds and promotions, explore reports and market prices, then make deliberate changes to product data when you need to.

It works with the Merchant Center data behind Shopping listings: products, data sources, promotions and reports. Campaigns, budgets and bids belong to Google Ads and are outside this server.

Start with a read-only question:

> Which products are disapproved, and what issues does Google report for each?

[Connect the server](#quick-start) · [Explore use cases](#what-you-can-ask-it-to-do) · [Open technical documentation](#technical-documentation)

---

## See it work in a minute

**You:** Which products are disapproved, and what issues does Google report for each?

**Assistant:** Lists the affected products and explains the item-level issues that Merchant Center reports.

**You:** Show the current price and availability of product `SKU-123`, then prepare an availability update to `in_stock`.

**Assistant:** Shows the current product input, the API data source it belongs to and the exact change to make. It asks for confirmation before updating the live product input.

**You:** Confirm the update.

**Assistant:** Sends the update and explains that Merchant Center processes product data asynchronously. The processed product and its quality status can take several minutes to refresh.

## Contents

- [Quick start](#quick-start)
- [What you can ask it to do](#what-you-can-ask-it-to-do)
- [How Merchant Center data is connected](#how-merchant-center-data-is-connected)
- [What can change](#what-can-change)
- [Getting access](#getting-access)
- [Configuration](#configuration)
- [Data and telemetry](#data-and-telemetry)
- [Limits and background work](#limits-and-background-work)
- [Technical documentation](#technical-documentation)
- [Support](#support)

## Quick start

You need Node.js 20+, a Google Merchant Center account, OAuth credentials from Google Cloud and a Google Cloud project registered with Merchant Center. The access setup is described in [Getting access](#getting-access).

1. Prepare the four values: OAuth client ID, OAuth client secret, OAuth refresh token and Merchant Center account ID.
2. Add the server to your AI app using one of the instructions below.
3. Ask the first read-only question above.

<details open>
<summary><strong>Codex</strong></summary>

<br>

**In the app:**

1. Open **Settings → Plugins → MCP servers**.
2. Select **Add server**.
3. Add the launch command `npx -y mcp-google-merchants@latest` and the four environment variables below.

| Variable | Value |
|---|---|
| `GOOGLE_MERCHANTS_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_MERCHANTS_CLIENT_SECRET` | Your Google OAuth client secret |
| `GOOGLE_MERCHANTS_REFRESH_TOKEN` | Your Google OAuth refresh token |
| `GOOGLE_MERCHANTS_ACCOUNT_ID` | Your Merchant Center account ID |

**From the command line:**

```bash
codex mcp add google-merchants \
  --env GOOGLE_MERCHANTS_CLIENT_ID=your_client_id \
  --env GOOGLE_MERCHANTS_CLIENT_SECRET=your_client_secret \
  --env GOOGLE_MERCHANTS_REFRESH_TOKEN=your_refresh_token \
  --env GOOGLE_MERCHANTS_ACCOUNT_ID=your_merchant_id \
  -- npx -y mcp-google-merchants@latest
```

Check the connection:

```bash
codex mcp list
```

[Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)

</details>

<details>
<summary><strong>Claude Code</strong></summary>

<br>

```bash
claude mcp add \
  --env GOOGLE_MERCHANTS_CLIENT_ID=your_client_id \
  --env GOOGLE_MERCHANTS_CLIENT_SECRET=your_client_secret \
  --env GOOGLE_MERCHANTS_REFRESH_TOKEN=your_refresh_token \
  --env GOOGLE_MERCHANTS_ACCOUNT_ID=your_merchant_id \
  --transport stdio \
  --scope user \
  google-merchants \
  -- npx -y mcp-google-merchants@latest
```

Check the connection:

```bash
claude mcp list
```

[Claude Code MCP documentation](https://code.claude.com/docs/en/mcp)

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

<br>

1. Open Claude Desktop and go to **Settings → Developer**.
2. Select **Edit Config**.
3. Add the server to `mcpServers`:

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

If **Edit Config** is unavailable, open the configuration file directly:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

[Claude Desktop MCP documentation](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

</details>

<details>
<summary><strong>Cursor</strong></summary>

<br>

Add a user-level server to `~/.cursor/mcp.json` on macOS/Linux or `%USERPROFILE%\.cursor\mcp.json` on Windows:

```json
{
  "mcpServers": {
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

[Cursor MCP documentation](https://cursor.com/docs/mcp)

</details>

<details>
<summary><strong>VS Code</strong></summary>

<br>

Run **MCP: Open User Configuration** from the Command Palette and add:

```json
{
  "servers": {
    "google-merchants": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-google-merchants@latest"],
      "env": {
        "GOOGLE_MERCHANTS_CLIENT_ID": "${input:google_merchants_client_id}",
        "GOOGLE_MERCHANTS_CLIENT_SECRET": "${input:google_merchants_client_secret}",
        "GOOGLE_MERCHANTS_REFRESH_TOKEN": "${input:google_merchants_refresh_token}",
        "GOOGLE_MERCHANTS_ACCOUNT_ID": "${input:google_merchants_account_id}"
      }
    }
  },
  "inputs": [
    {
      "type": "promptString",
      "id": "google_merchants_client_id",
      "description": "Google OAuth client ID"
    },
    {
      "type": "promptString",
      "id": "google_merchants_client_secret",
      "description": "Google OAuth client secret",
      "password": true
    },
    {
      "type": "promptString",
      "id": "google_merchants_refresh_token",
      "description": "Google OAuth refresh token",
      "password": true
    },
    {
      "type": "promptString",
      "id": "google_merchants_account_id",
      "description": "Merchant Center account ID"
    }
  ]
}
```

Check the server with **MCP: List Servers**.

[VS Code MCP documentation](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

</details>

## What you can ask it to do

### Find and understand catalog problems

- Which products are disapproved, and what does Google report for each of them?
- Show the title, price, availability and current status of product `SKU-123`.
- Which products are out of stock?
- Show the most frequent product issues for this Merchant Center account.

### Explore performance and prices

- Show clicks and impressions by product for July.
- Which products are priced above the market benchmark in the United States?
- What prices does Google suggest, and what impact does it predict?

Price comparisons and suggestions require the free Market Insights opt-in in Merchant Center. If the account has not opted in, the server explains why the report has no rows.

### Inspect the account and feeds

- List the Merchant Center accounts I can access.
- Is the store homepage claimed? Show the current shipping settings.
- List the product and promotion data sources, and identify an API data source.
- Re-fetch this scheduled file feed now.

### Make deliberate changes

- Update the price and availability of this product in its API data source.
- Create an API data source for a new product feed.
- Create or update a promotion and then check its approval status.

For any request that changes data, first ask the assistant to show the target account, data source and exact fields it plans to change.

## How Merchant Center data is connected

Merchant Center keeps the incoming data and the resulting product status separate:

1. An **account** contains product and promotion data sources.
2. A **data source** can be an API source, a file, a Google Sheet, the Merchant Center interface or an automatic feed.
3. A **product input** is the product data supplied by one source.
4. A **processed product** is what Merchant Center derives after processing that input. It includes eligibility and item-level issues.

The server can read every listed source type. It can create API data sources and update product inputs only in an API data source; it cannot write into a file, interface or automatic feed. To find products by condition, use a report query: `list_products` itself does not provide server-side filtering.

## What can change

| Operation | What happens | Confirmation boundary |
|---|---|---|
| Inspect accounts, products, feeds, promotions, reports, issues and quota use | Reads data from Merchant Center | Does not change Merchant Center |
| Create an API data source | Adds a source for product or promotion data | Changes the account |
| Update a product input | Changes selected product fields, such as price or availability | Changes live source data |
| Insert a product input | Replaces the complete input with the same ID in that API source; using a different source moves the product | Changes live source data |
| Re-fetch a file feed | Requests an out-of-schedule fetch of a file or Google Sheets feed | Starts asynchronous work at Google |
| Insert or update a promotion | Creates or changes a promotion | Changes live source data |
| Delete a product input | Removes the input from the selected data source | Destructive |
| Raw Merchant API request | Can access API methods without a dedicated tool | Potentially destructive |

The MCP client decides how it asks you to confirm write and destructive tools. The server marks its read-only, write and destructive operations so the client can present the right boundary.

## Getting access

The server uses the [Google Merchant API](https://developers.google.com/merchant/api/overview) and the OAuth scope `https://www.googleapis.com/auth/content`.

1. Create or select a **Google Cloud project**, enable **Merchant API**, and configure the OAuth consent screen.
2. In Google Cloud, create an OAuth client of type **Desktop app**. Save its client ID and client secret.
3. Authorize the Google account that has access to your Merchant Center and obtain a refresh token for the scope above. The [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) can help with this step: enable **Use your own OAuth credentials**, enter the scope, authorize, then exchange the code for tokens.
4. Find your Merchant Center account ID in Merchant Center and use it as `GOOGLE_MERCHANTS_ACCOUNT_ID`.
5. Register the Google Cloud project with Merchant Center once. Google requires a production Merchant Center account with a verified website and an account administrator for this operation. The registration links one Cloud project to the Merchant Center account; until it is complete, Merchant API calls from that project are blocked. Follow Google’s [developer registration guide](https://developers.google.com/merchant/api/guides/quickstart/registration).

The one-time registration is available through the technical `raw_request` tool, but it is safer to follow Google’s guide if this is your first Merchant API setup. Google may take up to five minutes to accept calls after registration.

Treat the OAuth client secret and refresh token as passwords. They are kept in the MCP client configuration and can grant access to the Merchant Center account.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_MERCHANTS_CLIENT_ID` | Yes* | OAuth 2.0 client ID. |
| `GOOGLE_MERCHANTS_CLIENT_SECRET` | Yes* | OAuth 2.0 client secret. |
| `GOOGLE_MERCHANTS_REFRESH_TOKEN` | Yes* | OAuth refresh token with the Merchant API scope. |
| `GOOGLE_MERCHANTS_ACCESS_TOKEN` | Yes* | Short-lived access-token alternative to the three OAuth values above. |
| `GOOGLE_MERCHANTS_ACCOUNT_ID` | No | Default Merchant Center account ID. Individual requests can select another accessible account. |
| `GOOGLE_MERCHANTS_API_BASE` | No | Merchant API base URL override. |
| `GOOGLE_MERCHANTS_TOKEN_URL` | No | OAuth token endpoint override. |
| `GOOGLE_MERCHANTS_TIMEOUT_MS` | No | Per-request timeout in milliseconds; default is `60000`. |
| `GOOGLE_MERCHANTS_MAX_RETRIES` | No | Maximum retry count for temporary failures; default is `3`. |

\* Use either the client ID, client secret and refresh token together, or a pre-minted access token. An access token usually expires in about one hour; a refresh token lets the server obtain a new access token when needed.

## Data and telemetry

The server runs locally as a process started by your AI app. It sends Merchant Center requests to Google and refreshes OAuth access tokens through Google’s OAuth endpoint.

It sends anonymous usage telemetry to count active installations and tool demand: a random installation ID, package version, AI client and Node.js/operating-system versions, and the tool name. It never sends or stores OAuth tokens, Merchant Center data, tool arguments or prompts. Disable this telemetry for A1 MCP servers with:

```bash
ASKADS_TELEMETRY=0
```

## Limits and background work

- **Merchant Center processing is asynchronous.** A newly inserted, updated or deleted product input can take several minutes to appear in processed products. Product and promotion approval issues appear later, not as an immediate API error.
- **Market Insights is optional.** Price competitiveness and suggested-price reports return data only after the account opts into the free Market Insights program.
- **Quotas depend on the account and API method.** Check current consumption with `list_method_quotas`; Google’s daily counters reset at 12:00 UTC.
- **Temporary limits are handled cautiously.** When Google returns `429`, the server follows `Retry-After` when provided and makes a limited number of retries. It does not replay a write after an uncertain network or server failure.
- **There is no background monitoring.** The server works only while an AI app calls it. If your AI app supports scheduled tasks, you can ask it to check product issues or quota use periodically.
- **Aggregated product issues have an account limitation.** `list_product_issues` works for standalone and sub-accounts, not advanced parent accounts.

## Technical documentation

- [All tools and their inputs](./docs/TOOLS.md)
- [Development documentation](./docs/DEVELOPMENT.md)
- [Publishing documentation](./docs/PUBLISHING.md)
- [Google Merchant API overview](https://developers.google.com/merchant/api/overview)
- [Google Merchant API authentication](https://developers.google.com/merchant/api/guides/quickstart/authentication)
- [Google developer registration](https://developers.google.com/merchant/api/guides/quickstart/registration)

## Support

Found a bug or need a scenario? [Create an issue](https://github.com/A1-x-Tech/mcp-google-merchants/issues) or write in [Telegram](https://t.me/a1_mcp).
