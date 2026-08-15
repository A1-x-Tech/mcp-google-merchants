import type { MerchantsConfig } from "./types.js";

/** Default Google Merchant API host (single host, per-sub-API path prefixes). */
export const DEFAULT_BASE = "https://merchantapi.googleapis.com";

/** Default Google OAuth 2.0 token endpoint (refresh-token exchange). */
export const DEFAULT_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * A malformed environment variable. Thrown instead of exiting on the spot so
 * index.ts can catch it, report the drop-off and start degraded instead of
 * dying; `reason` is the machine-readable code that ships with that ping
 * (never a variable's value).
 */
export class ConfigError extends Error {
  readonly reason: string;

  constructor(message: string, reason: string) {
    super(message);
    this.name = "ConfigError";
    this.reason = reason;
  }
}

/**
 * What a tool call without credentials reads. The first sentence is the
 * historical startup error, verbatim — the rest exists because credentials come
 * only from the environment, so the fix is an operator action plus a restart,
 * never a retry.
 */
export const MISSING_CREDENTIALS_MESSAGE =
  "Google Merchants credentials are required: either GOOGLE_MERCHANTS_CLIENT_ID + " +
  "GOOGLE_MERCHANTS_CLIENT_SECRET + GOOGLE_MERCHANTS_REFRESH_TOKEN (OAuth refresh flow) " +
  "or GOOGLE_MERCHANTS_ACCESS_TOKEN (pre-minted token, expires in ~1 hour). " +
  "This is not a network failure and retrying will not help: the operator must set these " +
  "environment variables in the MCP client's server config and restart the server — they are " +
  "read only at startup.";

/**
 * Raised when a tool call needs credentials and none were configured. The
 * message is the whole point of the class: it is the only text the calling
 * model reads about the missing setup, so it names the fix (which variables,
 * and that a restart is needed) instead of the failure.
 */
export class CredentialsError extends Error {
  constructor(message: string = MISSING_CREDENTIALS_MESSAGE) {
    super(message);
    this.name = "CredentialsError";
  }
}

/** True when the config carries usable credentials (the full refresh trio or a static token). */
export function hasCredentials(config: MerchantsConfig): boolean {
  return Boolean(config.accessToken || (config.clientId && config.clientSecret && config.refreshToken));
}

/**
 * Builds the client config from environment variables.
 *
 * Missing credentials are NOT an error here: the server starts anyway and the
 * client raises {@link CredentialsError} on the first tool call, so an
 * unconfigured install completes the MCP handshake and carries the fix into
 * the session instead of dying before it with nothing to read. A malformed
 * setup — the OAuth trio set only partially — still throws, because guessing
 * what the user meant is worse.
 *
 *   GOOGLE_MERCHANTS_CLIENT_ID      OAuth client ID     ┐ refresh-token flow
 *   GOOGLE_MERCHANTS_CLIENT_SECRET  OAuth client secret │ (all three required
 *   GOOGLE_MERCHANTS_REFRESH_TOKEN  OAuth refresh token ┘  together)
 *   GOOGLE_MERCHANTS_ACCESS_TOKEN   pre-minted access token (alternative; ~1h lifetime)
 *   GOOGLE_MERCHANTS_ACCOUNT_ID     default Merchant Center account (optional)
 *   GOOGLE_MERCHANTS_API_BASE       API root override
 *   GOOGLE_MERCHANTS_TOKEN_URL      OAuth token endpoint override
 *   GOOGLE_MERCHANTS_TIMEOUT_MS     per-request timeout
 *   GOOGLE_MERCHANTS_MAX_RETRIES    retries on transient errors
 */
export function loadConfig(): MerchantsConfig {
  // An empty string is treated as "not set" throughout — a blanked-out variable
  // in an MCP client config must not count as a provided credential.
  const clientId = process.env.GOOGLE_MERCHANTS_CLIENT_ID || undefined;
  const clientSecret = process.env.GOOGLE_MERCHANTS_CLIENT_SECRET || undefined;
  const refreshToken = process.env.GOOGLE_MERCHANTS_REFRESH_TOKEN || undefined;
  const accessToken = process.env.GOOGLE_MERCHANTS_ACCESS_TOKEN || undefined;

  if (!accessToken) {
    const missing = [
      clientId ? undefined : "GOOGLE_MERCHANTS_CLIENT_ID",
      clientSecret ? undefined : "GOOGLE_MERCHANTS_CLIENT_SECRET",
      refreshToken ? undefined : "GOOGLE_MERCHANTS_REFRESH_TOKEN",
    ].filter((v): v is string => v !== undefined);

    // All three missing (and no access token) is a degraded start, not an
    // error; a *partial* trio is a malformed setup and still throws.
    if (missing.length > 0 && missing.length < 3) {
      throw new ConfigError(
        `Incomplete OAuth refresh credentials: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} missing ` +
          "(the refresh flow needs GOOGLE_MERCHANTS_CLIENT_ID, GOOGLE_MERCHANTS_CLIENT_SECRET " +
          "and GOOGLE_MERCHANTS_REFRESH_TOKEN together).",
        "incomplete_oauth",
      );
    }
  }

  // Accept both "123456" and a pasted resource name "accounts/123456".
  const accountId = process.env.GOOGLE_MERCHANTS_ACCOUNT_ID?.replace(/^accounts\//, "");

  const timeoutMs = Number(process.env.GOOGLE_MERCHANTS_TIMEOUT_MS);
  const maxRetries = Number(process.env.GOOGLE_MERCHANTS_MAX_RETRIES);

  return {
    clientId,
    clientSecret,
    refreshToken,
    accessToken,
    accountId: accountId || undefined,
    apiBase: process.env.GOOGLE_MERCHANTS_API_BASE || DEFAULT_BASE,
    tokenUrl: process.env.GOOGLE_MERCHANTS_TOKEN_URL || DEFAULT_TOKEN_URL,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 60_000,
    maxRetries: Number.isFinite(maxRetries) && maxRetries >= 0 ? maxRetries : 3,
  };
}
