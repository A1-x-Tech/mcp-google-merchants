# CLAUDE.md — mcp-google-merchants

MCP server for Google Merchant Center via the **Merchant API v1** (TypeScript, stdio).
Single host `https://merchantapi.googleapis.com` with per-sub-API path prefixes
(`accounts/v1`, `products/v1`, `datasources/v1`, `promotions/v1`, `reports/v1`,
`issueresolution/v1`, `quota/v1`). Auth is Google OAuth 2.0 (scope
`https://www.googleapis.com/auth/content`): the client exchanges a refresh token at
`https://oauth2.googleapis.com/token` and caches the access token, or uses a static
`GOOGLE_MERCHANTS_ACCESS_TOKEN`. This is a **write-capable** server: products and
promotions can be created and deleted. Do NOT copy paths or product-ID formats from
Content API for Shopping (content/v2.1, sunset 2026-08-18) or v1beta (shut down
2026-02-28) — v1 product IDs are `contentLanguage~feedLabel~offerId`, no channel.

## Commands

```bash
npm run dev        # run from source (tsx watch)
npm test           # unit tests + dist smoke, no network
npm run typecheck  # types for src + tests
npm run build      # emit dist/
npm run smoke      # live READ-ONLY call (needs real credentials)
```

## Architecture

- `src/config.ts` — env → config. Credentials: the OAuth trio
  (`GOOGLE_MERCHANTS_CLIENT_ID`/`_CLIENT_SECRET`/`_REFRESH_TOKEN` — all three or
  `ConfigError` `incomplete_oauth`, whose message lists the missing variables) or
  `GOOGLE_MERCHANTS_ACCESS_TOKEN`; optional `GOOGLE_MERCHANTS_ACCOUNT_ID`, `_API_BASE`,
  `_TOKEN_URL`, `_TIMEOUT_MS`, `_MAX_RETRIES`. No credentials at all is NOT an error:
  the fields stay `undefined` (empty string = absent) and the server starts degraded.
  Also home to `CredentialsError` / `MISSING_CREDENTIALS_MESSAGE` (opens with the
  historical startup error verbatim, then names the variables and the restart) and
  `hasCredentials()`.
- `src/client.ts` — all HTTP and all wire mapping: token refresh (cached, shared across
  concurrent calls, one automatic retry on 401), `accountPath()` fallback to the
  configured default account, data-source name expansion, per-endpoint methods with
  camelCase wire bodies, query-param building. `request()` resolves the path against the
  base and rejects any path that escapes to a foreign origin (SSRF guard), retries 429
  on any method but 5xx/network errors on **GET only**, honors `Retry-After`, enforces
  an AbortController timeout that also covers reading the body, and throws
  `MerchantsError(status, body)` (decodes the Google error envelope).
- `src/tools/*.ts` — one register fn per domain (`accounts`, `products`, `datasources`,
  `promotions`, `reports`, `issues`, `quota`) + `raw.ts` (`raw_request`, full method enum,
  DESTRUCTIVE annotations). `util.ts` — `ok`/`fail`, the `READ_ONLY`/`WRITE`/`DESTRUCTIVE`
  annotation constants and shared zod schema factories.
- `src/index.ts` — wires every `register*` into the McpServer. `loadConfigOrDegraded()`
  catches `ConfigError`, pings `startup_failed` (fire-and-forget) and degrades the config
  to "no credentials"; an unconfigured start prepends `UNCONFIGURED_PREFIX` — plus
  `Configuration problem: <message>` when a ConfigError was caught — to the initialize
  `instructions`, and `oninitialized` sends `server_start` for a configured install or
  `unconfigured_start` (with the reason) otherwise.
- `src/telemetry.ts` — anonymous usage pings (ids/names/versions only, never data or
  arguments; fire-and-forget, must never block or throw; opt-out `ASKADS_TELEMETRY=0`).
  `server_start` means "a usable install started"; `unconfigured_start` is a degraded
  start and `startup_failed` a malformed config caught at load — both carry a `reason`
  from a closed vocabulary (`missing_credentials`, `incomplete_oauth`) — never a
  variable's name or value.

## Conventions (do not break)

- **Never exit because of configuration.** A server that dies before the MCP handshake
  leaves the user with a red cross and no reason — telemetry across this line of servers
  showed that state accounted for nearly every unconfigured install, and almost none of
  them recovered. Missing credentials are a survivable state: start, answer initialize
  (with the unconfigured prefix in `instructions`) and tools/list, and let the first tool
  call fail with `CredentialsError` — its message names the variables to set and says to
  restart, because credentials come only from the environment. There are no login tools;
  the fix is the operator setting the variables and restarting the server.
  `config.test.ts`, `client.test.ts` and `test/dist-smoke.test.js` pin this.
- **Credential failures are not transport failures.** `CredentialsError` is thrown in
  `bearerToken()` before any fetch — before the retry/backoff loop and the 401 re-mint —
  because retrying it burns seconds of backoff before the user sees the one message that
  helps. Pinned by a "fetch must not be called" assertion in `client.test.ts`.
- **Annotations are pinned per tool** in `src/tools/annotations.test.ts`: reads are
  `READ_ONLY`; `insert_promotion`, `update_product_input`, `create_data_source` and
  `fetch_data_source` are `WRITE`; `insert_product_input` (wholesale-replaces an
  existing input), `delete_product_input` and `raw_request` are `DESTRUCTIVE`.
  A new tool must be added to the pinned map consciously.
- **Writes are never replayed.** Only GET retries 5xx/network errors — a 502 after a
  committed insert would otherwise duplicate it. 429 retries on any method.
- **Wire mapping lives in the client, not the tools.** Tools accept snake_case inputs
  (`data_source`, `offer_id`, ...); `client.ts` builds camelCase bodies, expands numeric
  data-source IDs into full resource names and injects the default account.
- **The default account is the client's job** (`accountPath()`); tools just pass the
  optional `account` through.
- **`dataSource` is mandatory on every product write** — insert, update and delete (query
  param) — and for promotions it goes in the **body**. Don't move it.
- **Validate inputs with zod** in `inputSchema`; use the schema **factories** in `util.ts`
  (a fresh schema per field avoids `$ref` dedup in the JSON schema).
- **Output compact JSON via `ok`** — the consumer is an LLM; pretty-printing burns tokens.
  Responses pass through verbatim (describe the fields in the tool `description`).
- **Int64 fields arrive as strings** (amountMicros, counts, versionNumber) — don't assume
  number.
- **MCQL is snake_case, responses are camelCase**; no `SELECT *`; performance views need a
  date range; the price_* views need the Market Insights opt-in.

## Adding a tool

Before changing the tool registry, read [the MCP capability documentation contract](docs/CAPABILITY-DOCUMENTATION.md). Every registered tool must have exactly one task-oriented page in `docs/capabilities/`; update that page, the index, and the coverage test in the same change.

1. Add (or extend) `src/tools/<domain>.ts` with `register<Domain>Tools(server, client)`.
2. If it hits a new endpoint, add a method to `src/client.ts` with the wire mapping.
3. Import and call the register fn in `src/index.ts`.
4. Pin its annotations in `annotations.test.ts` and the dist tool list in
   `test/dist-smoke.test.js`; add a `*.test.ts` with the mock-fetch harness — no network.
5. `npm run typecheck && npm test`.

## Releasing

Keep the version in sync across **all** channels in one go:

1. Bump `version` in **three places, identically**: `package.json`, and in `server.json`
   **both** the root `version` **and** `packages[0].version`. `mcpName` in `package.json`
   must match `name` in `server.json` (`io.github.A1-x-Tech/mcp-google-merchants`).
   Verify: `grep -n '"version"' package.json server.json`.
2. Update `CHANGELOG.md` (move Unreleased into a dated section).
3. `npm publish` (runs typecheck + tests + build via `prepublishOnly` / `prepare`).
4. `git commit`, `git tag -a vX.Y.Z -m vX.Y.Z`, `git push origin main --follow-tags`.
5. GitHub Release: `gh release create vX.Y.Z --title vX.Y.Z --generate-notes --verify-tag`.
6. Official MCP registry: `mcp-publisher publish` (see docs/PUBLISHING.md).
