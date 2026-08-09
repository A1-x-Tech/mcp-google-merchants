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

export function registerDataSourceTools(server: McpServer, client: MerchantsClient): void {
  server.registerTool(
    "list_data_sources",
    {
      title: "List data sources",
      annotations: READ_ONLY,
      description:
        "Lists the data sources of an account. Each has name (accounts/{a}/dataSources/{id}), dataSourceId, " +
        "displayName, input (API | FILE | UI | AUTOFEED), exactly one type object (primaryProductDataSource, " +
        "supplementalProductDataSource, promotionDataSource, ...) and fileInput for file feeds. Use it to find " +
        "the API-type data source that insert_product_input / insert_promotion require as data_source.",
      inputSchema: {
        account: accountParam(),
        page_size: pageSizeParam(1000, 25),
        page_token: pageTokenParam(),
      },
    },
    async ({ account, page_size, page_token }) => {
      try {
        return ok(await client.listDataSources({ account, pageSize: page_size, pageToken: page_token }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_data_source",
    {
      title: "Get a data source",
      annotations: READ_ONLY,
      description:
        "Returns one data source by its numeric ID (or full resource name): type, input (API/FILE/UI/AUTOFEED), " +
        "feed configuration and fetch settings. Check `input` before calling fetch_data_source — only file-based " +
        "feeds with fetch settings can be re-fetched.",
      inputSchema: {
        account: accountParam(),
        data_source: dataSourceParam(),
      },
    },
    async ({ account, data_source }) => {
      try {
        return ok(await client.getDataSource({ account, dataSource: data_source }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "create_data_source",
    {
      title: "Create an API data source",
      annotations: WRITE,
      description:
        "Creates an API (generic) data source — the target that insert_product_input / update_product_input / " +
        "insert_promotion need as data_source. Only API sources can be created through the API (file, UI and " +
        "autofeed sources are set up in Merchant Center). For product sources content_language and feed_label " +
        "must be both set or both omitted; countries applies to primary sources only. A promotions source " +
        "requires target_country and content_language. Returns the created DataSource with its dataSourceId.",
      inputSchema: {
        account: accountParam(),
        display_name: z
          .string()
          .min(1)
          .describe("Human-readable data source name shown in Merchant Center."),
        type: z
          .enum(["primary_products", "supplemental_products", "promotions"])
          .describe(
            "Data source type: primary_products (main product feed), supplemental_products " +
              "(overrides/extra attributes) or promotions.",
          ),
        content_language: z
          .string()
          .regex(/^[a-zA-Z]{2}$/, "two-letter ISO 639-1 code")
          .optional()
          .describe(
            'Two-letter ISO 639-1 language, e.g. "en". Product sources: set together with feed_label ' +
              "or not at all. Required for promotions sources.",
          ),
        feed_label: z
          .string()
          .regex(/^[A-Za-z0-9\-_]{1,20}$/, "1-20 chars: letters, digits, - and _")
          .optional()
          .describe('Feed label, e.g. "US". Product sources only; set together with content_language.'),
        countries: z
          .array(z.string().min(2))
          .optional()
          .describe("CLDR country codes the products target. Primary product sources only."),
        target_country: z
          .string()
          .regex(/^[a-zA-Z]{2}$/, "two-letter CLDR code")
          .optional()
          .describe('CLDR country code, e.g. "US". Required for (and only used by) promotions sources.'),
      },
    },
    async ({ account, display_name, type, content_language, feed_label, countries, target_country }) => {
      if (type === "promotions" && (!target_country || !content_language)) {
        return fail(new Error("A promotions data source requires target_country and content_language."));
      }
      if (type !== "promotions" && !content_language !== !feed_label) {
        return fail(
          new Error("content_language and feed_label must be both set or both omitted for product sources."),
        );
      }
      try {
        return ok(
          await client.createDataSource({
            account,
            displayName: display_name,
            type,
            contentLanguage: content_language,
            feedLabel: feed_label,
            countries,
            targetCountry: target_country,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "fetch_data_source",
    {
      title: "Re-fetch a file feed now",
      annotations: WRITE,
      description:
        "Triggers an immediate re-fetch (re-read) of a file-based feed outside its regular schedule. Works only " +
        "for data sources with a file input and fetch settings (scheduled fetch or Google Sheets); calling it on " +
        "an API-type source is an error. Returns an empty object on success — the fetch itself runs " +
        "asynchronously on Google's side.",
      inputSchema: {
        account: accountParam(),
        data_source: dataSourceParam(),
      },
    },
    async ({ account, data_source }) => {
      try {
        return ok(await client.fetchDataSource({ account, dataSource: data_source }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
