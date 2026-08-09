import { test } from "node:test";
import assert from "node:assert/strict";
import { MerchantsClient } from "./client.js";
import type { MerchantsConfig } from "./types.js";

const BASE = "https://merchantapi.googleapis.com";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Config with a static access token — no token endpoint round-trip. */
function staticConfig(extra: Partial<MerchantsConfig> = {}): MerchantsConfig {
  return {
    accessToken: "STATIC",
    accountId: "111",
    apiBase: BASE,
    tokenUrl: TOKEN_URL,
    maxRetries: 0,
    retryBaseMs: 0,
    ...extra,
  };
}

/** Config with the OAuth refresh trio. */
function oauthConfig(extra: Partial<MerchantsConfig> = {}): MerchantsConfig {
  return {
    clientId: "CID",
    clientSecret: "CSECRET",
    refreshToken: "RTOKEN",
    accountId: "111",
    apiBase: BASE,
    tokenUrl: TOKEN_URL,
    maxRetries: 0,
    retryBaseMs: 0,
    ...extra,
  };
}

interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function mockFetch(handler: (url: string, init: RequestInit, call: number) => Response | Promise<Response>) {
  const original = globalThis.fetch;
  const calls: RecordedCall[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    const i = (init ?? {}) as RequestInit & { headers?: Record<string, string> };
    calls.push({
      url: String(url),
      method: String(i.method),
      headers: (i.headers ?? {}) as Record<string, string>,
      body: typeof i.body === "string" ? i.body : undefined,
    });
    return handler(String(url), i, calls.length);
  }) as typeof fetch;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

const okJson = (data: unknown = { ok: true }) =>
  new Response(JSON.stringify(data), { status: 200 });

// --- Auth ---

test("refresh flow: form-encoded exchange at the token endpoint, then Bearer on the API call", async () => {
  const mock = mockFetch((url) => {
    if (url === TOKEN_URL) return okJson({ access_token: "MINTED", expires_in: 3600 });
    return okJson({ accounts: [] });
  });
  try {
    const client = new MerchantsClient(oauthConfig());
    await client.listAccounts();

    const [tokenCall, apiCall] = mock.calls;
    assert.equal(tokenCall.url, TOKEN_URL);
    assert.equal(tokenCall.method, "POST");
    assert.equal(tokenCall.headers["Content-Type"], "application/x-www-form-urlencoded");
    const form = new URLSearchParams(tokenCall.body);
    assert.equal(form.get("grant_type"), "refresh_token");
    assert.equal(form.get("client_id"), "CID");
    assert.equal(form.get("client_secret"), "CSECRET");
    assert.equal(form.get("refresh_token"), "RTOKEN");

    assert.equal(apiCall.url, `${BASE}/accounts/v1/accounts`);
    assert.equal(apiCall.headers.Authorization, "Bearer MINTED");
  } finally {
    mock.restore();
  }
});

test("the minted token is cached: two API calls, one token exchange", async () => {
  let tokenCalls = 0;
  const mock = mockFetch((url) => {
    if (url === TOKEN_URL) {
      tokenCalls++;
      return okJson({ access_token: "MINTED", expires_in: 3600 });
    }
    return okJson();
  });
  try {
    const client = new MerchantsClient(oauthConfig());
    await client.listAccounts();
    await client.getAccount({ account: "222" });
    assert.equal(tokenCalls, 1);
  } finally {
    mock.restore();
  }
});

test("a failed token exchange surfaces the OAuth error and is not cached", async () => {
  let tokenCalls = 0;
  const mock = mockFetch((url) => {
    if (url === TOKEN_URL) {
      tokenCalls++;
      if (tokenCalls === 1) {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Token has been revoked." }),
          { status: 400 },
        );
      }
      return okJson({ access_token: "MINTED", expires_in: 3600 });
    }
    return okJson();
  });
  try {
    const client = new MerchantsClient(oauthConfig());
    await assert.rejects(
      () => client.listAccounts(),
      /OAuth token refresh failed: HTTP 400: invalid_grant: Token has been revoked\./,
    );
    // The failure was not cached: the next call exchanges again and succeeds.
    await client.listAccounts();
    assert.equal(tokenCalls, 2);
  } finally {
    mock.restore();
  }
});

test("a 401 with the refresh flow mints a new token and retries once", async () => {
  let apiCalls = 0;
  let tokenCalls = 0;
  const mock = mockFetch((url) => {
    if (url === TOKEN_URL) {
      tokenCalls++;
      return okJson({ access_token: `TOKEN-${tokenCalls}`, expires_in: 3600 });
    }
    apiCalls++;
    if (apiCalls === 1) {
      return new Response(JSON.stringify({ error: { code: 401, message: "expired", status: "UNAUTHENTICATED" } }), {
        status: 401,
      });
    }
    return okJson();
  });
  try {
    const client = new MerchantsClient(oauthConfig());
    const result = await client.listAccounts();
    assert.deepEqual(result, { ok: true });
    assert.equal(apiCalls, 2);
    assert.equal(tokenCalls, 2, "the 401 must invalidate the cached token");
    const retry = mock.calls.at(-1)!;
    assert.equal(retry.headers.Authorization, "Bearer TOKEN-2");
  } finally {
    mock.restore();
  }
});

test("a 401 with a static access token fails immediately (nothing to refresh)", async () => {
  let apiCalls = 0;
  const mock = mockFetch(() => {
    apiCalls++;
    return new Response(JSON.stringify({ error: { code: 401, message: "bad token", status: "UNAUTHENTICATED" } }), {
      status: 401,
    });
  });
  try {
    await assert.rejects(
      () => new MerchantsClient(staticConfig()).listAccounts(),
      /HTTP 401: \[UNAUTHENTICATED\] bad token/,
    );
    assert.equal(apiCalls, 1);
  } finally {
    mock.restore();
  }
});

// --- Endpoint mapping (static token: no token endpoint involved) ---

test("listAccounts: GET accounts/v1 with pageSize/pageToken/filter as query params", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await new MerchantsClient(staticConfig()).listAccounts({
      pageSize: 10,
      pageToken: "tok",
      filter: 'accountName = "*store*"',
    });
    const call = mock.calls[0];
    assert.equal(call.method, "GET");
    const url = new URL(call.url);
    assert.equal(`${url.origin}${url.pathname}`, `${BASE}/accounts/v1/accounts`);
    assert.equal(url.searchParams.get("pageSize"), "10");
    assert.equal(url.searchParams.get("pageToken"), "tok");
    assert.equal(url.searchParams.get("filter"), 'accountName = "*store*"');
    assert.equal(call.body, undefined, "GET must not carry a body");
  } finally {
    mock.restore();
  }
});

test("account fallback: explicit account wins, config default fills in, none throws", async () => {
  const mock = mockFetch(() => okJson());
  try {
    const client = new MerchantsClient(staticConfig());
    await client.getAccount({ account: "999" });
    assert.equal(mock.calls[0].url, `${BASE}/accounts/v1/accounts/999`);
    await client.getAccount();
    assert.equal(mock.calls[1].url, `${BASE}/accounts/v1/accounts/111`);
    // A pasted resource name is normalized, not doubled.
    await client.getAccount({ account: "accounts/42" });
    assert.equal(mock.calls[2].url, `${BASE}/accounts/v1/accounts/42`);

    const noDefault = new MerchantsClient(staticConfig({ accountId: undefined }));
    await assert.rejects(() => noDefault.listProducts(), /GOOGLE_MERCHANTS_ACCOUNT_ID/);
    assert.equal(mock.calls.length, 3, "no fetch without an account");
  } finally {
    mock.restore();
  }
});

test("insertProductInput: POST productInputs:insert with dataSource query param and camelCase body", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await new MerchantsClient(staticConfig()).insertProductInput({
      dataSource: "104628",
      offerId: "sku123",
      contentLanguage: "en",
      feedLabel: "US",
      productAttributes: { title: "Bike", price: { amountMicros: "9990000", currencyCode: "USD" } },
    });
    const call = mock.calls[0];
    const url = new URL(call.url);
    assert.equal(call.method, "POST");
    assert.equal(`${url.origin}${url.pathname}`, `${BASE}/products/v1/accounts/111/productInputs:insert`);
    assert.equal(url.searchParams.get("dataSource"), "accounts/111/dataSources/104628");
    assert.deepEqual(JSON.parse(call.body!), {
      offerId: "sku123",
      contentLanguage: "en",
      feedLabel: "US",
      productAttributes: { title: "Bike", price: { amountMicros: "9990000", currencyCode: "USD" } },
    });
  } finally {
    mock.restore();
  }
});

test("a full dataSource resource name passes through unchanged", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await new MerchantsClient(staticConfig()).deleteProductInput({
      productInput: "en~US~sku123",
      dataSource: "accounts/111/dataSources/7",
    });
    const url = new URL(mock.calls[0].url);
    assert.equal(mock.calls[0].method, "DELETE");
    assert.equal(`${url.origin}${url.pathname}`, `${BASE}/products/v1/accounts/111/productInputs/en~US~sku123`);
    assert.equal(url.searchParams.get("dataSource"), "accounts/111/dataSources/7");
  } finally {
    mock.restore();
  }
});

test("fetchDataSource: POST :fetch with an empty JSON body", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await new MerchantsClient(staticConfig()).fetchDataSource({ dataSource: "42" });
    const call = mock.calls[0];
    assert.equal(call.method, "POST");
    assert.equal(call.url, `${BASE}/datasources/v1/accounts/111/dataSources/42:fetch`);
    assert.equal(call.body, "{}");
  } finally {
    mock.restore();
  }
});

test("insertPromotion: dataSource goes in the BODY, not the query string", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await new MerchantsClient(staticConfig()).insertPromotion({
      dataSource: "9",
      promotion: { promotionId: "SUMMER", contentLanguage: "en", targetCountry: "US", redemptionChannel: ["ONLINE"] },
    });
    const call = mock.calls[0];
    assert.equal(call.url, `${BASE}/promotions/v1/accounts/111/promotions:insert`);
    assert.deepEqual(JSON.parse(call.body!), {
      promotion: { promotionId: "SUMMER", contentLanguage: "en", targetCountry: "US", redemptionChannel: ["ONLINE"] },
      dataSource: "accounts/111/dataSources/9",
    });
  } finally {
    mock.restore();
  }
});

test("searchReports: POST reports:search with the MCQL query in the body", async () => {
  const mock = mockFetch(() => okJson({ results: [] }));
  try {
    await new MerchantsClient(staticConfig()).searchReports({
      query: "SELECT offer_id FROM product_view",
      pageSize: 50,
    });
    const call = mock.calls[0];
    assert.equal(call.method, "POST");
    assert.equal(call.url, `${BASE}/reports/v1/accounts/111/reports:search`);
    assert.deepEqual(JSON.parse(call.body!), { query: "SELECT offer_id FROM product_view", pageSize: 50 });
  } finally {
    mock.restore();
  }
});

test("priceCompetitiveness builds the canned MCQL (with and without the country filter)", async () => {
  const mock = mockFetch(() => okJson({ results: [] }));
  try {
    const client = new MerchantsClient(staticConfig());
    await client.priceCompetitiveness({ country: "US" });
    assert.equal(
      (JSON.parse(mock.calls[0].body!) as { query: string }).query,
      "SELECT id, offer_id, title, brand, price, benchmark_price, report_country_code " +
        "FROM price_competitiveness_product_view WHERE report_country_code = 'US'",
    );
    await client.priceCompetitiveness({});
    assert.match(
      (JSON.parse(mock.calls[1].body!) as { query: string }).query,
      /FROM price_competitiveness_product_view$/,
    );
  } finally {
    mock.restore();
  }
});

test("priceInsights builds the canned MCQL on price_insights_product_view", async () => {
  const mock = mockFetch(() => okJson({ results: [] }));
  try {
    await new MerchantsClient(staticConfig()).priceInsights({ pageSize: 10 });
    const body = JSON.parse(mock.calls[0].body!) as { query: string; pageSize: number };
    assert.equal(
      body.query,
      "SELECT id, offer_id, title, brand, price, suggested_price, effectiveness, " +
        "predicted_impressions_change_fraction, predicted_clicks_change_fraction, " +
        "predicted_conversions_change_fraction FROM price_insights_product_view",
    );
    assert.equal(body.pageSize, 10);
  } finally {
    mock.restore();
  }
});

test("listAggregateProductStatuses: issueresolution/v1 with the filter as a query param", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await new MerchantsClient(staticConfig()).listAggregateProductStatuses({
      filter: 'reporting_context = "SHOPPING_ADS" AND country = "US"',
    });
    const url = new URL(mock.calls[0].url);
    assert.equal(
      `${url.origin}${url.pathname}`,
      `${BASE}/issueresolution/v1/accounts/111/aggregateProductStatuses`,
    );
    assert.equal(url.searchParams.get("filter"), 'reporting_context = "SHOPPING_ADS" AND country = "US"');
  } finally {
    mock.restore();
  }
});

// --- Error handling, retries, timeout, SSRF ---

test("non-2xx throws MerchantsError with the Google envelope decoded", async () => {
  const mock = mockFetch(
    () =>
      new Response(
        JSON.stringify({ error: { code: 404, message: "Product not found", status: "NOT_FOUND" } }),
        { status: 404 },
      ),
  );
  try {
    await assert.rejects(
      () => new MerchantsClient(staticConfig()).getProduct({ product: "en~US~missing" }),
      /HTTP 404: \[NOT_FOUND\] Product not found/,
    );
  } finally {
    mock.restore();
  }
});

test("request() retries a 429 on any method (the request was never processed)", async () => {
  let calls = 0;
  const mock = mockFetch(() => {
    calls++;
    if (calls === 1) return new Response("rate limited", { status: 429 });
    return okJson();
  });
  try {
    const client = new MerchantsClient(staticConfig({ maxRetries: 2 }));
    const result = await client.insertPromotion({ dataSource: "1", promotion: {} });
    assert.deepEqual(result, { ok: true });
    assert.equal(calls, 2);
  } finally {
    mock.restore();
  }
});

test("request() retries a 5xx for GET but NOT for POST (write dedup)", async () => {
  let calls = 0;
  const mock = mockFetch(() => {
    calls++;
    if (calls === 1) return new Response("unavailable", { status: 503 });
    return okJson();
  });
  try {
    const client = new MerchantsClient(staticConfig({ maxRetries: 2 }));
    const result = await client.listProducts();
    assert.deepEqual(result, { ok: true });
    assert.equal(calls, 2);
  } finally {
    mock.restore();
  }

  calls = 0;
  const mock2 = mockFetch(() => {
    calls++;
    return new Response("unavailable", { status: 503 });
  });
  try {
    const client = new MerchantsClient(staticConfig({ maxRetries: 2 }));
    await assert.rejects(
      () => client.insertProductInput({ dataSource: "1", offerId: "x", contentLanguage: "en", feedLabel: "US" }),
      /HTTP 503/,
    );
    assert.equal(calls, 1, "a 5xx on a write must not be retried");
  } finally {
    mock2.restore();
  }
});

test("request() retries a network error for GET only, and gives up after maxRetries", async () => {
  let calls = 0;
  const mock = mockFetch(() => {
    calls++;
    throw new Error("ECONNRESET");
  });
  try {
    const client = new MerchantsClient(staticConfig({ maxRetries: 2 }));
    await assert.rejects(() => client.listAccounts(), /ECONNRESET/);
    assert.equal(calls, 3); // initial + 2 retries

    calls = 0;
    await assert.rejects(() => client.fetchDataSource({ dataSource: "1" }), /ECONNRESET/);
    assert.equal(calls, 1, "a network error on a write must not be retried");
  } finally {
    mock.restore();
  }
});

test("request() aborts and reports a timeout when the request hangs", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = ((_url: unknown, init: unknown) =>
    new Promise((_resolve, reject) => {
      const signal = (init as RequestInit).signal as AbortSignal;
      signal.addEventListener("abort", () =>
        reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
      );
    })) as typeof fetch;
  try {
    const client = new MerchantsClient(staticConfig({ timeoutMs: 10, maxRetries: 0 }));
    await assert.rejects(() => client.listAccounts(), /timed out after 10ms/);
  } finally {
    globalThis.fetch = original;
  }
});

test("request() rejects an absolute path (SSRF) and never fetches a foreign origin", async () => {
  for (const evil of ["https://evil.example/steal", "http://evil.example/x", "\\\\evil.example/x"]) {
    const mock = mockFetch(() => okJson());
    try {
      await assert.rejects(
        () => new MerchantsClient(staticConfig()).request("GET", evil),
        /foreign origin/,
      );
      assert.equal(mock.calls.length, 0, `must not fetch for ${JSON.stringify(evil)}`);
    } finally {
      mock.restore();
    }
  }
});

test("request() still accepts a relative API path with a query", async () => {
  const mock = mockFetch(() => okJson());
  try {
    const result = await new MerchantsClient(staticConfig()).request(
      "GET",
      "quota/v1/accounts/111/quotas",
      undefined,
      { pageSize: 5 },
    );
    assert.deepEqual(result, { ok: true });
    assert.equal(mock.calls[0].url, `${BASE}/quota/v1/accounts/111/quotas?pageSize=5`);
  } finally {
    mock.restore();
  }
});
