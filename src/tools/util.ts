import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Shared zod schema FACTORIES (not shared consts): reusing one zod object
 * across two fields makes zod-to-json-schema dedupe them into a `$ref`, which
 * some tool-schema consumers (OpenAI Apps review) don't dereference and flag
 * as `any`. A fresh object per field keeps each one inlined.
 */

/** Merchant Center account ID; optional everywhere — the configured default applies. */
export const accountParam = () =>
  z
    .string()
    .min(1)
    .optional()
    .describe(
      'Merchant Center account ID (digits, e.g. "123456"). Omit to use the GOOGLE_MERCHANTS_ACCOUNT_ID default.',
    );

/** pageSize with a per-endpoint cap. */
export const pageSizeParam = (max: number, apiDefault: number) =>
  z
    .number()
    .int()
    .min(1)
    .max(max)
    .optional()
    .describe(`Max results per page (1..${max}; API default ${apiDefault}).`);

/** pageToken continuation; all other parameters must stay identical between pages. */
export const pageTokenParam = () =>
  z
    .string()
    .min(1)
    .optional()
    .describe(
      "nextPageToken from the previous response. All other parameters must be identical to the previous call.",
    );

/** A data source reference: numeric ID or full resource name. */
export const dataSourceParam = () =>
  z
    .string()
    .min(1)
    .describe(
      'Data source: numeric ID (e.g. "104628") or full name "accounts/{account}/dataSources/{id}". ' +
        "Product/promotion writes require an API-type data source (input: API), not a file feed.",
    );

/** Wraps a value as a compact-JSON tool result (compact: the consumer is an LLM). */
export function ok(data: unknown): CallToolResult {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return { content: [{ type: "text", text: text ?? "null" }] };
}

export function fail(err: unknown): CallToolResult {
  let message = err instanceof Error ? err.message : String(err);
  // Surface the underlying cause (e.g. the network error behind a timeout) — no
  // secrets live in cause, and it makes failures far easier to diagnose.
  if (err instanceof Error && err.cause instanceof Error) message += ` (${err.cause.message})`;
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

/**
 * MCP tool annotations — hints the consuming client can use to gate or label a
 * tool. All four hints are set explicitly on every tool: some clients (OpenAI
 * Apps review) require readOnlyHint, destructiveHint and openWorldHint on each.
 */
export const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

/** Creates or updates remote state, but never destroys existing data. */
export const WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;

/** Can delete or irreversibly overwrite remote data. */
export const DESTRUCTIVE = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
} as const;
