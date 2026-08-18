import { test } from "node:test";
import assert from "node:assert/strict";

import { ConfigError, hasCredentials, loadConfig } from "./config.js";

/**
 * The reason codes below are the vocabulary the telemetry dashboard groups by —
 * renaming one silently splits a bar in two, so they are pinned here.
 */
const ALL_VARS: Record<string, string | undefined> = {
  GOOGLE_MERCHANTS_CLIENT_ID: undefined,
  GOOGLE_MERCHANTS_CLIENT_SECRET: undefined,
  GOOGLE_MERCHANTS_REFRESH_TOKEN: undefined,
  GOOGLE_MERCHANTS_ACCESS_TOKEN: undefined,
  GOOGLE_MERCHANTS_ACCOUNT_ID: undefined,
  GOOGLE_MERCHANTS_API_BASE: undefined,
  GOOGLE_MERCHANTS_TOKEN_URL: undefined,
  GOOGLE_MERCHANTS_TIMEOUT_MS: undefined,
  GOOGLE_MERCHANTS_MAX_RETRIES: undefined,
};

function withEnv(vars: Record<string, string | undefined>, run: () => void): void {
  const scope = { ...ALL_VARS, ...vars };
  const saved = new Map(Object.keys(scope).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(scope)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    run();
  } finally {
    for (const [k, v] of saved) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

function errorOf(vars: Record<string, string | undefined>): ConfigError {
  let caught: unknown;
  withEnv(vars, () => {
    try {
      loadConfig();
    } catch (err) {
      caught = err;
    }
  });
  assert.ok(caught instanceof ConfigError, "config problems must throw ConfigError, not exit");
  return caught;
}

/**
 * Missing credentials used to throw here, which killed the process before the
 * MCP handshake and left the user with a dead server and no reason. It is now
 * a survivable state: the server starts degraded and the client raises
 * CredentialsError on the first call instead (pinned in client.test.ts).
 * Reverting this would restore that dead end.
 */
test("no credentials at all is not an error — the config loads with empty fields", () => {
  withEnv({}, () => {
    const config = loadConfig();
    assert.equal(config.clientId, undefined);
    assert.equal(config.clientSecret, undefined);
    assert.equal(config.refreshToken, undefined);
    assert.equal(config.accessToken, undefined);
    assert.equal(config.apiBase, "https://merchantapi.googleapis.com");
    assert.equal(config.tokenUrl, "https://oauth2.googleapis.com/token");
    assert.equal(hasCredentials(config), false);
  });
});

test("empty strings count as absent, not as a partial trio", () => {
  withEnv(
    {
      GOOGLE_MERCHANTS_CLIENT_ID: "",
      GOOGLE_MERCHANTS_CLIENT_SECRET: "",
      GOOGLE_MERCHANTS_REFRESH_TOKEN: "",
      GOOGLE_MERCHANTS_ACCESS_TOKEN: "",
    },
    () => {
      const config = loadConfig();
      assert.equal(config.clientId, undefined);
      assert.equal(config.accessToken, undefined);
      assert.equal(hasCredentials(config), false);
    },
  );
});

test("a partial OAuth trio reports incomplete_oauth", () => {
  assert.equal(
    errorOf({ GOOGLE_MERCHANTS_CLIENT_ID: "id", GOOGLE_MERCHANTS_CLIENT_SECRET: "secret" }).reason,
    "incomplete_oauth",
  );
  assert.equal(errorOf({ GOOGLE_MERCHANTS_REFRESH_TOKEN: "rt" }).reason, "incomplete_oauth");
});

test("the incomplete_oauth message names exactly the missing variables", () => {
  assert.equal(
    errorOf({ GOOGLE_MERCHANTS_CLIENT_ID: "id", GOOGLE_MERCHANTS_CLIENT_SECRET: "secret" }).message,
    "Incomplete OAuth refresh credentials: GOOGLE_MERCHANTS_REFRESH_TOKEN is missing " +
      "(the refresh flow needs GOOGLE_MERCHANTS_CLIENT_ID, GOOGLE_MERCHANTS_CLIENT_SECRET " +
      "and GOOGLE_MERCHANTS_REFRESH_TOKEN together).",
  );
  assert.equal(
    errorOf({ GOOGLE_MERCHANTS_REFRESH_TOKEN: "rt" }).message,
    "Incomplete OAuth refresh credentials: GOOGLE_MERCHANTS_CLIENT_ID, GOOGLE_MERCHANTS_CLIENT_SECRET " +
      "are missing (the refresh flow needs GOOGLE_MERCHANTS_CLIENT_ID, GOOGLE_MERCHANTS_CLIENT_SECRET " +
      "and GOOGLE_MERCHANTS_REFRESH_TOKEN together).",
  );
});

test("the full OAuth trio loads without throwing", () => {
  withEnv(
    {
      GOOGLE_MERCHANTS_CLIENT_ID: "id",
      GOOGLE_MERCHANTS_CLIENT_SECRET: "secret",
      GOOGLE_MERCHANTS_REFRESH_TOKEN: "rt",
    },
    () => {
      const config = loadConfig();
      assert.equal(config.refreshToken, "rt");
      assert.equal(config.apiBase, "https://merchantapi.googleapis.com");
      assert.equal(config.tokenUrl, "https://oauth2.googleapis.com/token");
      assert.equal(config.timeoutMs, 60_000);
      assert.equal(config.maxRetries, 3);
      assert.equal(hasCredentials(config), true);
    },
  );
});

test("a bare access token is enough (no refresh trio needed)", () => {
  withEnv({ GOOGLE_MERCHANTS_ACCESS_TOKEN: "at" }, () => {
    const config = loadConfig();
    assert.equal(config.accessToken, "at");
    assert.equal(hasCredentials(config), true);
  });
});

test("the default account accepts both a bare ID and a pasted resource name", () => {
  withEnv(
    { GOOGLE_MERCHANTS_ACCESS_TOKEN: "at", GOOGLE_MERCHANTS_ACCOUNT_ID: "accounts/123456" },
    () => {
      assert.equal(loadConfig().accountId, "123456");
    },
  );
  withEnv({ GOOGLE_MERCHANTS_ACCESS_TOKEN: "at", GOOGLE_MERCHANTS_ACCOUNT_ID: "123456" }, () => {
    assert.equal(loadConfig().accountId, "123456");
  });
});

test("invalid numeric overrides fall back to the defaults", () => {
  withEnv(
    {
      GOOGLE_MERCHANTS_ACCESS_TOKEN: "at",
      GOOGLE_MERCHANTS_TIMEOUT_MS: "soon",
      GOOGLE_MERCHANTS_MAX_RETRIES: "-1",
    },
    () => {
      const config = loadConfig();
      assert.equal(config.timeoutMs, 60_000);
      assert.equal(config.maxRetries, 3);
    },
  );
});
