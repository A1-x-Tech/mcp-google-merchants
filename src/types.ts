/**
 * The server talks to the Google Merchant API v1 — a single host
 * (https://merchantapi.googleapis.com) with per-sub-API path prefixes
 * (accounts/v1, products/v1, datasources/v1, promotions/v1, reports/v1,
 * issueresolution/v1). Auth is standard Google OAuth 2.0 (scope
 * https://www.googleapis.com/auth/content) — a refresh-token flow against
 * https://oauth2.googleapis.com/token, or a pre-minted access token.
 *
 * Do NOT confuse this with the legacy Content API for Shopping (content/v2.1,
 * sunset 2026-08-18) or the v1beta sub-APIs (shut down 2026-02-28): paths and
 * product ID formats differ (v1 product IDs have no channel segment).
 */

export interface MerchantsConfig {
  /** OAuth client ID (from Google Cloud Console). */
  clientId?: string;
  /** OAuth client secret. Treated as a secret. */
  clientSecret?: string;
  /** Long-lived OAuth refresh token (scope https://www.googleapis.com/auth/content). Treated as a secret. */
  refreshToken?: string;
  /**
   * Pre-minted OAuth access token — an alternative to the refresh flow.
   * Expires in ~1 hour and is used as-is (no refresh). Treated as a secret.
   */
  accessToken?: string;
  /** Default Merchant Center account ID (digits). Tools can override it per call. */
  accountId?: string;
  /** API root host. Defaults to https://merchantapi.googleapis.com. */
  apiBase: string;
  /** OAuth token endpoint. Defaults to https://oauth2.googleapis.com/token. */
  tokenUrl: string;
  /** Per-request timeout in milliseconds. Defaults to 60_000. */
  timeoutMs?: number;
  /** Max retries for transient errors (429 always; 5xx/network for GET only). Defaults to 3. */
  maxRetries?: number;
  /** Base backoff in milliseconds, doubled each retry. Defaults to 500. */
  retryBaseMs?: number;
}

/**
 * Google APIs report failures as a non-2xx HTTP status with a JSON envelope
 * ({ error: { code, message, status, details } }); the OAuth token endpoint
 * uses { error: "invalid_grant", error_description }. The parsed body is kept
 * alongside the status and a short readable message is derived.
 */
export class MerchantsError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}: ${formatErrorBody(body)}`);
    this.name = "MerchantsError";
    this.status = status;
    this.body = body;
  }
}

/** Turns a parsed Google error body into a short, readable message. */
function formatErrorBody(body: unknown): string {
  if (body == null) return "(no body)";
  if (typeof body === "string") return body.slice(0, 500);
  if (typeof body !== "object") return String(body);
  const obj = body as Record<string, unknown>;
  const err = obj.error;

  // Google Cloud envelope: { error: { code, message, status, details } }
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") {
      const status = typeof e.status === "string" ? `[${e.status}] ` : "";
      return `${status}${e.message}`.slice(0, 500);
    }
  }

  // OAuth token endpoint: { error: "invalid_grant", error_description: "..." }
  if (typeof err === "string") {
    const desc = typeof obj.error_description === "string" ? `: ${obj.error_description}` : "";
    return `${err}${desc}`.slice(0, 500);
  }

  return JSON.stringify(obj).slice(0, 500);
}
