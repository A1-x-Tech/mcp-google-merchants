import { CredentialsError } from "./config.js";
import type { MerchantsConfig } from "./types.js";
import { MerchantsError } from "./types.js";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

/** Query-string parameters; undefined values are dropped. */
export type Query = Record<string, string | number | undefined>;

export interface ListAccountsParams {
  pageSize?: number;
  pageToken?: string;
  /** Account filter, e.g. `accountName = "*store*"`. */
  filter?: string;
}

export interface AccountScopedParams {
  /** Merchant Center account ID; falls back to the configured default. */
  account?: string;
}

export interface PageParams extends AccountScopedParams {
  pageSize?: number;
  pageToken?: string;
}

export interface GetProductParams extends AccountScopedParams {
  /** `contentLanguage~feedLabel~offerId` or the base64url `base64EncodedName`. */
  product: string;
}

export interface InsertProductInputParams extends AccountScopedParams {
  /** Target data source: numeric ID or full `accounts/{a}/dataSources/{ds}` name. */
  dataSource: string;
  offerId: string;
  contentLanguage: string;
  feedLabel: string;
  productAttributes?: Record<string, unknown>;
  customAttributes?: Array<{ name: string; value: string }>;
  versionNumber?: string;
}

export interface UpdateProductInputParams extends AccountScopedParams {
  /** `contentLanguage~feedLabel~offerId` or the base64url name. */
  productInput: string;
  /** Data source holding the input: numeric ID or full resource name. */
  dataSource: string;
  /** Comma-separated attribute paths; omitted = all populated fields. */
  updateMask?: string;
  productAttributes?: Record<string, unknown>;
  customAttributes?: Array<{ name: string; value: string }>;
  versionNumber?: string;
}

export interface DeleteProductInputParams extends AccountScopedParams {
  /** `contentLanguage~feedLabel~offerId` or the base64url name. */
  productInput: string;
  dataSource: string;
}

export interface DataSourceParams extends AccountScopedParams {
  /** Numeric data source ID or full resource name. */
  dataSource: string;
}

/** Only API (generic) data sources can be created through the Merchant API. */
export type DataSourceType = "primary_products" | "supplemental_products" | "promotions";

export interface CreateDataSourceParams extends AccountScopedParams {
  displayName: string;
  type: DataSourceType;
  /** ISO 639-1; product sources: set together with feedLabel or not at all. */
  contentLanguage?: string;
  feedLabel?: string;
  /** CLDR country codes; primary product sources only. */
  countries?: string[];
  /** CLDR country code; promotion sources only (the API requires it there). */
  targetCountry?: string;
}

export interface InsertPromotionParams extends AccountScopedParams {
  dataSource: string;
  promotion: Record<string, unknown>;
}

export interface GetPromotionParams extends AccountScopedParams {
  promotion: string;
}

export interface SearchReportsParams extends AccountScopedParams {
  /** Merchant Center Query Language (MCQL) query. */
  query: string;
  pageSize?: number;
  pageToken?: string;
}

export interface PriceCompetitivenessParams extends PageParams {
  /** CLDR country code to filter by (report_country_code), e.g. "US". */
  country?: string;
}

export interface PriceInsightsParams extends PageParams {}

export interface ListProductIssuesParams extends PageParams {
  /** Only `reporting_context` and `country` are supported by the API. */
  filter?: string;
}

/** Canned MCQL for the price-competitiveness view (requires Market Insights opt-in). */
const PRICE_COMPETITIVENESS_FIELDS =
  "id, offer_id, title, brand, price, benchmark_price, report_country_code";

/** Canned MCQL for the price-insights view (requires Market Insights opt-in). */
const PRICE_INSIGHTS_FIELDS =
  "id, offer_id, title, brand, price, suggested_price, effectiveness, " +
  "predicted_impressions_change_fraction, predicted_clicks_change_fraction, " +
  "predicted_conversions_change_fraction";

export class MerchantsClient {
  private readonly base: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseMs: number;
  /** Access token minted from the refresh token, with its expiry (epoch ms). */
  private token?: { value: string; expiresAt: number };
  /** In-flight refresh, shared so concurrent requests refresh only once. */
  private tokenRefresh?: Promise<string>;

  constructor(private readonly config: MerchantsConfig) {
    this.base = config.apiBase.endsWith("/") ? config.apiBase : config.apiBase + "/";
    this.timeoutMs = config.timeoutMs ?? 60_000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryBaseMs = config.retryBaseMs ?? 500;
  }

  /**
   * Resolves the account for a call: the tool's explicit `account` wins, else
   * the configured GOOGLE_MERCHANTS_ACCOUNT_ID. Accepts a bare ID or a pasted
   * `accounts/{id}` resource name.
   */
  accountPath(account?: string): string {
    const id = (account ?? this.config.accountId)?.replace(/^accounts\//, "");
    if (!id) {
      throw new Error(
        "No Merchant Center account: pass the `account` parameter or set GOOGLE_MERCHANTS_ACCOUNT_ID.",
      );
    }
    return `accounts/${id}`;
  }

  /** Expands a numeric data source ID into a full resource name (full names pass through). */
  private dataSourceName(accountPath: string, dataSource: string): string {
    if (dataSource.includes("/")) return dataSource.replace(/^\//, "");
    return `${accountPath}/dataSources/${dataSource}`;
  }

  /** Backoff before a retry: honors Retry-After when present, else exponential (capped at 30s). */
  private backoffMs(attempt: number, res?: Response): number {
    const retryAfter = res ? Number(res.headers.get("Retry-After")) : NaN;
    if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter, 30) * 1000;
    return Math.min(this.retryBaseMs * 2 ** attempt, 30_000);
  }

  /**
   * fetch with an AbortController timeout. Reads the response body inside the
   * guarded zone so the timeout also covers a slow or drip-feeding body, not
   * just the initial headers, and returns the text alongside the response.
   */
  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    label: string,
  ): Promise<{ res: Response; text: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      const text = await res.text();
      return { res, text };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request to "${label}" timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Returns a Bearer token: the static GOOGLE_MERCHANTS_ACCESS_TOKEN when set,
   * else an access token minted from the refresh token and cached until ~1
   * minute before expiry. With neither configured, throws
   * {@link CredentialsError} BEFORE any fetch — a missing setup must never
   * enter the retry/backoff loop or trigger the 401 re-mint, because no amount
   * of retrying mints credentials. Concurrent callers share one in-flight
   * refresh; a failed refresh is not cached.
   */
  private async bearerToken(): Promise<string> {
    if (this.config.accessToken) return this.config.accessToken;
    const { clientId, clientSecret, refreshToken } = this.config;
    if (!clientId || !clientSecret || !refreshToken) throw new CredentialsError();
    if (this.token && Date.now() < this.token.expiresAt) return this.token.value;
    if (!this.tokenRefresh) {
      this.tokenRefresh = this.refreshAccessToken().finally(() => {
        this.tokenRefresh = undefined;
      });
    }
    return this.tokenRefresh;
  }

  /** Drops the cached access token (e.g. after an unexpected 401). */
  private invalidateToken(): void {
    this.token = undefined;
  }

  /** Exchanges the refresh token for a fresh access token at the OAuth token endpoint. */
  private async refreshAccessToken(): Promise<string> {
    const { clientId, clientSecret, refreshToken } = this.config;
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        "OAuth refresh credentials are not configured (GOOGLE_MERCHANTS_CLIENT_ID / " +
          "GOOGLE_MERCHANTS_CLIENT_SECRET / GOOGLE_MERCHANTS_REFRESH_TOKEN).",
      );
    }
    const form = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });
    const { res, text } = await this.fetchWithTimeout(
      this.config.tokenUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      },
      "oauth token refresh",
    );
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!res.ok) {
      const err = new MerchantsError(res.status, data);
      throw new Error(`OAuth token refresh failed: ${err.message}`);
    }
    const parsed = data as { access_token?: unknown; expires_in?: unknown };
    if (typeof parsed?.access_token !== "string" || !parsed.access_token) {
      throw new Error("OAuth token refresh failed: no access_token in the token endpoint response.");
    }
    const expiresIn = typeof parsed.expires_in === "number" ? parsed.expires_in : 3600;
    // Refresh a minute early so a token never expires mid-request.
    this.token = {
      value: parsed.access_token,
      expiresAt: Date.now() + Math.max(0, expiresIn - 60) * 1000,
    };
    return parsed.access_token;
  }

  /**
   * Low-level request to a Merchant API path (e.g. "products/v1/accounts/1/products").
   * Sends `Authorization: Bearer <token>`; query params are appended with
   * undefined values dropped. Retries 429 always; 5xx and network errors only
   * for GET (a 502 after a committed write would otherwise duplicate it). A 401
   * on the refresh flow invalidates the cached token and retries once. Any
   * other non-2xx throws a {@link MerchantsError}.
   */
  async request<T = unknown>(
    method: HttpMethod,
    path: string,
    body?: Record<string, unknown>,
    query?: Query,
  ): Promise<T> {
    // Guard method !== "GET" keeps undici from crashing on a GET-with-body.
    const hasBody = body !== undefined && method !== "GET";

    // Resolve the path against the API base, then reject anything that escaped
    // to a foreign origin (an absolute "https://evil/x" or a "\\evil/x" slipped
    // through raw_request) so the Bearer token can never leak to another host.
    const url = new URL(path.replace(/^\//, ""), this.base);
    if (url.origin !== new URL(this.base).origin) {
      throw new Error(`raw_request path must be a relative API path (resolved to foreign origin ${url.origin})`);
    }
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    const target = url.toString();

    // The Merchant API has real writes: only GET is safe to retry on 5xx and
    // network errors. 429 is always retryable — the request was not processed.
    const idempotent = method === "GET";
    let retried401 = false;

    for (let attempt = 0; ; attempt++) {
      const token = await this.bearerToken();
      let res: Response;
      let text: string;
      try {
        ({ res, text } = await this.fetchWithTimeout(
          target,
          {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              ...(hasBody ? { "Content-Type": "application/json" } : {}),
            },
            body: hasBody ? JSON.stringify(body) : undefined,
          },
          path,
        ));
      } catch (err) {
        // Network error or timeout: retry idempotent requests with backoff; on
        // the last attempt (or a non-idempotent method) rethrow the original error.
        if (idempotent && attempt < this.maxRetries) {
          await delay(this.backoffMs(attempt));
          continue;
        }
        throw err;
      }

      // A cached token can be revoked or expire early; mint a new one and retry
      // once. Safe for writes too: a 401 request was rejected before processing.
      if (res.status === 401 && !retried401 && !this.config.accessToken) {
        retried401 = true;
        this.invalidateToken();
        continue;
      }

      const transient = res.status === 429 || (idempotent && res.status >= 500 && res.status < 600);
      if (transient && attempt < this.maxRetries) {
        await delay(this.backoffMs(attempt, res));
        continue;
      }

      let data: unknown = undefined;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!res.ok) throw new MerchantsError(res.status, data);
      return data as T;
    }
  }

  // --- Accounts ---

  /** Merchant Center accounts accessible to the authenticated user. */
  async listAccounts(p: ListAccountsParams = {}): Promise<unknown> {
    return this.request("GET", "accounts/v1/accounts", undefined, {
      pageSize: p.pageSize,
      pageToken: p.pageToken,
      filter: p.filter,
    });
  }

  /** A single Merchant Center account. */
  async getAccount(p: AccountScopedParams = {}): Promise<unknown> {
    return this.request("GET", `accounts/v1/${this.accountPath(p.account)}`);
  }

  /** The store homepage and its claim status. */
  async getHomepage(p: AccountScopedParams = {}): Promise<unknown> {
    return this.request("GET", `accounts/v1/${this.accountPath(p.account)}/homepage`);
  }

  /** Account-level shipping settings (kept read-only: the only write is a full replace). */
  async getShippingSettings(p: AccountScopedParams = {}): Promise<unknown> {
    return this.request("GET", `accounts/v1/${this.accountPath(p.account)}/shippingSettings`);
  }

  // --- Products ---

  /** Processed products, as shown in Merchant Center. */
  async listProducts(p: PageParams = {}): Promise<unknown> {
    return this.request("GET", `products/v1/${this.accountPath(p.account)}/products`, undefined, {
      pageSize: p.pageSize,
      pageToken: p.pageToken,
    });
  }

  /** One processed product, including status and item-level issues. */
  async getProduct(p: GetProductParams): Promise<unknown> {
    const path = `products/v1/${this.accountPath(p.account)}/products/${encodeURIComponent(p.product)}`;
    return this.request("GET", path);
  }

  /** Upserts a product input into an API data source (processing is async). */
  async insertProductInput(p: InsertProductInputParams): Promise<unknown> {
    const acct = this.accountPath(p.account);
    return this.request(
      "POST",
      `products/v1/${acct}/productInputs:insert`,
      compact({
        offerId: p.offerId,
        contentLanguage: p.contentLanguage,
        feedLabel: p.feedLabel,
        productAttributes: p.productAttributes,
        customAttributes: p.customAttributes,
        versionNumber: p.versionNumber,
      }),
      { dataSource: this.dataSourceName(acct, p.dataSource) },
    );
  }

  /** Sparse-updates an existing product input (price, availability, ...). */
  async updateProductInput(p: UpdateProductInputParams): Promise<unknown> {
    const acct = this.accountPath(p.account);
    return this.request(
      "PATCH",
      `products/v1/${acct}/productInputs/${encodeURIComponent(p.productInput)}`,
      compact({
        productAttributes: p.productAttributes,
        customAttributes: p.customAttributes,
        versionNumber: p.versionNumber,
      }),
      { dataSource: this.dataSourceName(acct, p.dataSource), updateMask: p.updateMask },
    );
  }

  /** Deletes a product input from a specific data source. */
  async deleteProductInput(p: DeleteProductInputParams): Promise<unknown> {
    const acct = this.accountPath(p.account);
    return this.request(
      "DELETE",
      `products/v1/${acct}/productInputs/${encodeURIComponent(p.productInput)}`,
      undefined,
      { dataSource: this.dataSourceName(acct, p.dataSource) },
    );
  }

  // --- Data sources ---

  /** Data sources configured for the account. */
  async listDataSources(p: PageParams = {}): Promise<unknown> {
    return this.request("GET", `datasources/v1/${this.accountPath(p.account)}/dataSources`, undefined, {
      pageSize: p.pageSize,
      pageToken: p.pageToken,
    });
  }

  /** One data source. */
  async getDataSource(p: DataSourceParams): Promise<unknown> {
    const acct = this.accountPath(p.account);
    const name = this.dataSourceName(acct, p.dataSource);
    return this.request("GET", `datasources/v1/${name}`);
  }

  /** Creates an API (generic) data source — the target for product/promotion writes. */
  async createDataSource(p: CreateDataSourceParams): Promise<unknown> {
    const body: Record<string, unknown> = { displayName: p.displayName };
    if (p.type === "primary_products") {
      body.primaryProductDataSource = compact({
        contentLanguage: p.contentLanguage,
        feedLabel: p.feedLabel,
        countries: p.countries,
      });
    } else if (p.type === "supplemental_products") {
      body.supplementalProductDataSource = compact({
        contentLanguage: p.contentLanguage,
        feedLabel: p.feedLabel,
      });
    } else {
      body.promotionDataSource = compact({
        targetCountry: p.targetCountry,
        contentLanguage: p.contentLanguage,
      });
    }
    return this.request("POST", `datasources/v1/${this.accountPath(p.account)}/dataSources`, body);
  }

  /** Triggers an immediate re-fetch of a file-based feed (fails for API sources). */
  async fetchDataSource(p: DataSourceParams): Promise<unknown> {
    const acct = this.accountPath(p.account);
    const name = this.dataSourceName(acct, p.dataSource);
    return this.request("POST", `datasources/v1/${name}:fetch`, {});
  }

  // --- Promotions ---

  /** Creates or updates a promotion (dataSource travels in the body here). */
  async insertPromotion(p: InsertPromotionParams): Promise<unknown> {
    const acct = this.accountPath(p.account);
    return this.request("POST", `promotions/v1/${acct}/promotions:insert`, {
      promotion: p.promotion,
      dataSource: this.dataSourceName(acct, p.dataSource),
    });
  }

  /** Promotions for the account. */
  async listPromotions(p: PageParams = {}): Promise<unknown> {
    return this.request("GET", `promotions/v1/${this.accountPath(p.account)}/promotions`, undefined, {
      pageSize: p.pageSize,
      pageToken: p.pageToken,
    });
  }

  /** One promotion, including its status. */
  async getPromotion(p: GetPromotionParams): Promise<unknown> {
    const path = `promotions/v1/${this.accountPath(p.account)}/promotions/${encodeURIComponent(p.promotion)}`;
    return this.request("GET", path);
  }

  // --- Reports ---

  /** Runs an MCQL query against reports:search (a POST, but a pure read). */
  async searchReports(p: SearchReportsParams): Promise<unknown> {
    return this.request(
      "POST",
      `reports/v1/${this.accountPath(p.account)}/reports:search`,
      compact({ query: p.query, pageSize: p.pageSize, pageToken: p.pageToken }),
    );
  }

  /** Canned price-competitiveness query (benchmark prices; needs Market Insights). */
  async priceCompetitiveness(p: PriceCompetitivenessParams = {}): Promise<unknown> {
    const where = p.country ? ` WHERE report_country_code = '${p.country}'` : "";
    return this.searchReports({
      account: p.account,
      query: `SELECT ${PRICE_COMPETITIVENESS_FIELDS} FROM price_competitiveness_product_view${where}`,
      pageSize: p.pageSize,
      pageToken: p.pageToken,
    });
  }

  /** Canned price-insights query (suggested prices; needs Market Insights). */
  async priceInsights(p: PriceInsightsParams = {}): Promise<unknown> {
    return this.searchReports({
      account: p.account,
      query: `SELECT ${PRICE_INSIGHTS_FIELDS} FROM price_insights_product_view`,
      pageSize: p.pageSize,
      pageToken: p.pageToken,
    });
  }

  // --- Issues ---

  /** Aggregated product issue statistics (sub-accounts / standalone accounts only). */
  async listAggregateProductStatuses(p: ListProductIssuesParams = {}): Promise<unknown> {
    return this.request(
      "GET",
      `issueresolution/v1/${this.accountPath(p.account)}/aggregateProductStatuses`,
      undefined,
      { filter: p.filter, pageSize: p.pageSize, pageToken: p.pageToken },
    );
  }

  // --- Quota ---

  /** Per-method-group API usage vs limits (daily counters reset at 12:00 UTC). */
  async listMethodQuotas(p: PageParams = {}): Promise<unknown> {
    return this.request("GET", `quota/v1/${this.accountPath(p.account)}/quotas`, undefined, {
      pageSize: p.pageSize,
      pageToken: p.pageToken,
    });
  }
}

/** Drops keys whose value is `undefined` so they are not sent to the API. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
