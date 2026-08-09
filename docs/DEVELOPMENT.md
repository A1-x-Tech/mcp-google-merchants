# Development

## Requirements

- Node.js 20+ (the published package ships compiled `dist/`; `npx` needs no separate
  install). CI runs the suite on Node 20 and 22.

## Commands

```bash
npm install
npm run dev        # run from source with tsx watch
npm test           # unit tests (node:test) + dist smoke, no network
npm run typecheck  # type-check src + tests (no emit)
npm run build      # clean dist/ and compile with tsc
npm run smoke      # live READ-ONLY call: lists accessible accounts
```

## Local run

```bash
npm run build
GOOGLE_MERCHANTS_CLIENT_ID=... \
GOOGLE_MERCHANTS_CLIENT_SECRET=... \
GOOGLE_MERCHANTS_REFRESH_TOKEN=... \
GOOGLE_MERCHANTS_ACCOUNT_ID=... \
node dist/index.js
# optional: GOOGLE_MERCHANTS_API_BASE, GOOGLE_MERCHANTS_TOKEN_URL,
#           GOOGLE_MERCHANTS_TIMEOUT_MS, GOOGLE_MERCHANTS_MAX_RETRIES
# alternative auth: GOOGLE_MERCHANTS_ACCESS_TOKEN (expires in ~1 hour)
```

`npm run smoke` needs the same credentials and makes one live read
(`accounts.list` — no writes).

## Tests

Unit tests mock `globalThis.fetch` — both the OAuth token endpoint and the API host —
so the whole suite runs offline. Tool tests register the real tool handlers against a
real client with the recording fetch stub, asserting the exact URL, method, query
params and wire body per tool. `test/dist-smoke.test.js` additionally spawns the
**built** `dist/index.js` binary and performs a real MCP handshake over stdio through
the official SDK client, pinning the full tool list.

Put a `*.test.ts` next to the code it covers; `npm run typecheck && npm test` is the
gate (also run by `prepublishOnly`).

## Usage telemetry

The server sends anonymous events to `usage.gistrec.cloud` (`server_start` when a
client connects, `tool_call` with the tool **name**, and `startup_failed` with a
fixed-vocabulary reason code when credentials are missing) to count active installs
and tool demand. An event carries only impersonal technical fields: a random
installation id (`~/.config/mcp-google-merchants/instance-id`), the package version,
the AI client name/version from the MCP handshake, the Node.js version and the OS.

Tokens, account data, tool arguments and prompts are never sent or stored
(implementation: `src/telemetry.ts`). Sends run in the background with a 2 s timeout
and are silently skipped on any error. Opt out for all Ask Ads MCP servers at once:
`ASKADS_TELEMETRY=0`.
