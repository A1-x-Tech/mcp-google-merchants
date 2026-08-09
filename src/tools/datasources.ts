import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
