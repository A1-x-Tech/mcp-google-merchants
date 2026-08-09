import type { MerchantsConfig } from "./types.js";

/** Default Google Merchant API host (single host, per-sub-API path prefixes). */
const DEFAULT_BASE = "https://merchantapi.googleapis.com";

/** Default Google OAuth 2.0 token endpoint (refresh-token exchange). */
const DEFAULT_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * A missing or malformed environment variable. Thrown instead of exiting on the
 * spot so index.ts can report the drop-off before the process dies; `reason` is
 * the machine-readable code that ships with that ping (never a variable's value).
 */
export class ConfigError extends Error {
  readonly reason: string;

  constructor(message: string, reason: string) {
    super(message);
    this.name = "ConfigError";
    this.reason = reason;
  }
}

function die(message: string, reason: string): never {
  throw new ConfigError(message, reason);
}

/**
 * Builds the client config from environment variables, throwing ConfigError if
 * the credentials are missing or incomplete.
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
  const clientId = process.env.GOOGLE_MERCHANTS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_MERCHANTS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_MERCHANTS_REFRESH_TOKEN;
  const accessToken = process.env.GOOGLE_MERCHANTS_ACCESS_TOKEN;

  if (!accessToken) {
    const missing = [
      clientId ? undefined : "GOOGLE_MERCHANTS_CLIENT_ID",
      clientSecret ? undefined : "GOOGLE_MERCHANTS_CLIENT_SECRET",
      refreshToken ? undefined : "GOOGLE_MERCHANTS_REFRESH_TOKEN",
    ].filter((v): v is string => v !== undefined);

    if (missing.length === 3) {
      die(
        "Google Merchants credentials are required: either GOOGLE_MERCHANTS_CLIENT_ID + " +
          "GOOGLE_MERCHANTS_CLIENT_SECRET + GOOGLE_MERCHANTS_REFRESH_TOKEN (OAuth refresh flow) " +
          "or GOOGLE_MERCHANTS_ACCESS_TOKEN (pre-minted token, expires in ~1 hour).",
        "missing_credentials",
      );
    }
    if (missing.length > 0) {
      die(
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
