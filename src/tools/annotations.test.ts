import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAccountTools } from "./accounts.js";
import { registerProductTools } from "./products.js";
import { registerDataSourceTools } from "./datasources.js";
import { registerPromotionTools } from "./promotions.js";
import { registerReportTools } from "./reports.js";
import { registerIssueTools } from "./issues.js";
import { registerRawTool } from "./raw.js";
import { DESTRUCTIVE, READ_ONLY, WRITE } from "./util.js";

interface Annotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

/** Registers every tool against a fake server, capturing each tool's annotations. */
function collectAnnotations(): Record<string, Annotations | undefined> {
  const annotations: Record<string, Annotations | undefined> = {};
  const server = {
    registerTool: (name: string, cfg: { annotations?: Annotations }) => {
      annotations[name] = cfg.annotations;
    },
  };
  // Registration reads the client only inside handlers, so a stub is fine here.
  registerAccountTools(server as never, {} as never);
  registerProductTools(server as never, {} as never);
  registerDataSourceTools(server as never, {} as never);
  registerPromotionTools(server as never, {} as never);
  registerReportTools(server as never, {} as never);
  registerIssueTools(server as never, {} as never);
  registerRawTool(server as never, {} as never);
  return annotations;
}

const ANN = collectAnnotations();

/**
 * The Merchant API has real writes, so annotations are pinned per tool — a new
 * tool must be added here CONSCIOUSLY, deciding whether it reads, writes or
 * destroys remote state.
 */
const EXPECTED: Record<string, Annotations> = {
  // reads
  get_account: READ_ONLY,
  get_data_source: READ_ONLY,
  get_product: READ_ONLY,
  get_promotion: READ_ONLY,
  list_accounts: READ_ONLY,
  list_data_sources: READ_ONLY,
  list_product_issues: READ_ONLY,
  list_products: READ_ONLY,
  list_promotions: READ_ONLY,
  price_competitiveness: READ_ONLY,
  price_insights: READ_ONLY,
  search_reports: READ_ONLY,
  // writes
  fetch_data_source: WRITE,
  insert_product_input: WRITE,
  insert_promotion: WRITE,
  // destructive
  delete_product_input: DESTRUCTIVE,
  raw_request: DESTRUCTIVE,
};

test("registers exactly the expected tools", () => {
  assert.deepEqual(Object.keys(ANN).sort(), Object.keys(EXPECTED).sort());
});

test("every tool carries its pinned annotations with all four hints set", () => {
  for (const [name, expected] of Object.entries(EXPECTED)) {
    const a = ANN[name];
    assert.ok(a, `${name} is missing annotations`);
    assert.deepEqual(
      a,
      expected,
      `${name} must carry ${expected.readOnlyHint ? "READ_ONLY" : expected.destructiveHint ? "DESTRUCTIVE" : "WRITE"}`,
    );
  }
});
