import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MerchantsClient } from "../client.js";
import {
  accountParam,
  dataSourceParam,
  fail,
  ok,
  pageSizeParam,
  pageTokenParam,
  READ_ONLY,
  WRITE,
} from "./util.js";

export function registerPromotionTools(server: McpServer, client: MerchantsClient): void {
  server.registerTool(
    "insert_promotion",
    {
      title: "Insert or update a promotion",
      annotations: WRITE,
      description:
        "Creates or updates a promotion. Unlike product writes, the data source travels in the request BODY " +
        "(the server assembles it). The promotion object requires promotionId, contentLanguage (ISO 639-1), " +
        "targetCountry (CLDR, e.g. \"US\") and redemptionChannel (array with ONLINE and/or IN_STORE — at least " +
        "one). Optional `attributes` carry longTitle, couponValueType, offerType, genericRedemptionCode, " +
        "promotionEffectiveTimePeriod {startTime, endTime}, productApplicability, moneyOffAmount, percentOff, etc. " +
        "Returns the Promotion incl. promotionStatus; approval happens asynchronously (check get_promotion later).",
      inputSchema: {
        account: accountParam(),
        data_source: dataSourceParam(),
        promotion: z
          .record(z.any())
          .describe(
            "Promotion object. Required: promotionId, contentLanguage, targetCountry, redemptionChannel " +
              '(["ONLINE"] and/or ["IN_STORE"]). Optional: attributes {longTitle, couponValueType, offerType, ' +
              "genericRedemptionCode, promotionEffectiveTimePeriod {startTime, endTime}, productApplicability, " +
              "moneyOffAmount, percentOff, ...}, customAttributes, versionNumber.",
          ),
      },
    },
    async ({ account, data_source, promotion }) => {
      try {
        return ok(await client.insertPromotion({ account, dataSource: data_source, promotion }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "list_promotions",
    {
      title: "List promotions",
      annotations: READ_ONLY,
      description:
        "Lists the promotions of an account: promotions[] (name, promotionId, contentLanguage, targetCountry, " +
        "redemptionChannel, attributes, promotionStatus with destination statuses and itemLevelIssues) and " +
        "nextPageToken.",
      inputSchema: {
        account: accountParam(),
        page_size: pageSizeParam(250, 50),
        page_token: pageTokenParam(),
      },
    },
    async ({ account, page_size, page_token }) => {
      try {
        return ok(await client.listPromotions({ account, pageSize: page_size, pageToken: page_token }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_promotion",
    {
      title: "Get a promotion",
      annotations: READ_ONLY,
      description:
        "Returns one promotion including promotionStatus (per-destination approval and itemLevelIssues) — the " +
        "place to check whether a freshly inserted promotion was approved.",
      inputSchema: {
        account: accountParam(),
        promotion: z.string().min(1).describe("Promotion ID (the {promotion} segment of the resource name)."),
      },
    },
    async ({ account, promotion }) => {
      try {
        return ok(await client.getPromotion({ account, promotion }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
