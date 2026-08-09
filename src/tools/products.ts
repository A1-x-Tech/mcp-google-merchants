import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MerchantsClient } from "../client.js";
import {
  accountParam,
  dataSourceParam,
  DESTRUCTIVE,
  fail,
  ok,
  pageSizeParam,
  pageTokenParam,
  READ_ONLY,
  WRITE,
} from "./util.js";

export function registerProductTools(server: McpServer, client: MerchantsClient): void {
  server.registerTool(
    "list_products",
    {
      title: "List processed products",
      annotations: READ_ONLY,
      description:
        "Lists the processed products of an account, as shown in Merchant Center. Each product has " +
        "name (accounts/{a}/products/{contentLanguage~feedLabel~offerId} — NO channel segment in v1), " +
        "offerId, contentLanguage, feedLabel, dataSource, productAttributes (title, price, availability, ...), " +
        "productStatus with itemLevelIssues, and base64EncodedName (use it when offerId contains URL-hostile " +
        "characters like '/'). The list has no server-side filter — filter via search_reports on product_view. " +
        "Recently inserted products appear only after async processing (minutes).",
      inputSchema: {
        account: accountParam(),
        page_size: pageSizeParam(1000, 25),
        page_token: pageTokenParam(),
      },
    },
    async ({ account, page_size, page_token }) => {
      try {
        return ok(await client.listProducts({ account, pageSize: page_size, pageToken: page_token }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_product",
    {
      title: "Get a processed product",
      annotations: READ_ONLY,
      description:
        "Returns one processed product including productStatus.itemLevelIssues (code, severity, " +
        "resolution, description) — the place to see why a product is disapproved. Identify the product " +
        'either with `product` ("contentLanguage~feedLabel~offerId", e.g. "en~US~sku123", or the base64url ' +
        "base64EncodedName; legacy local products use a local~ prefix) or with the three components " +
        "content_language + feed_label + offer_id. A product inserted moments ago may 404 until async " +
        "processing finishes (minutes).",
      inputSchema: {
        account: accountParam(),
        product: z
          .string()
          .min(1)
          .optional()
          .describe(
            'Product ID: "contentLanguage~feedLabel~offerId" (e.g. "en~US~sku123") or the base64url ' +
              "base64EncodedName. Omit when passing the three components separately.",
          ),
        content_language: z
          .string()
          .regex(/^[a-zA-Z]{2}$/, "two-letter ISO 639-1 code")
          .optional()
          .describe('Two-letter ISO 639-1 content language, e.g. "en". Used with feed_label + offer_id.'),
        feed_label: z
          .string()
          .min(1)
          .max(20)
          .optional()
          .describe('Feed label, e.g. "US". Used with content_language + offer_id.'),
        offer_id: z
          .string()
          .min(1)
          .optional()
          .describe("The merchant's offer ID (SKU). Used with content_language + feed_label."),
      },
    },
    async ({ account, product, content_language, feed_label, offer_id }) => {
      const id =
        product ??
        (content_language && feed_label && offer_id
          ? `${content_language}~${feed_label}~${offer_id}`
          : undefined);
      if (!id) {
        return fail(
          new Error("Pass either `product` or all of content_language, feed_label and offer_id."),
        );
      }
      try {
        return ok(await client.getProduct({ account, product: id }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "insert_product_input",
    {
      title: "Insert or replace a product",
      annotations: WRITE,
      description:
        "Uploads (upserts) a product into an API data source: an existing input with the same " +
        "contentLanguage~feedLabel~offerId in that data source is fully replaced. Requires data_source " +
        "(an API-type source — create one with create_data_source or in Merchant Center; file feeds cannot " +
        "be written). " +
        "Inserting with a different data source MOVES the product to it. Returns the ProductInput (name, " +
        "product = the future processed name, base64EncodedProduct). Processing is async: the processed " +
        "product shows up in get_product/list_products after several minutes, and data-quality problems " +
        "surface later in productStatus.itemLevelIssues, not as API errors. Prices go in product_attributes " +
        'as {"price": {"amountMicros": "9990000", "currencyCode": "USD"}} (1 unit = 1,000,000 micros).',
      inputSchema: {
        account: accountParam(),
        data_source: dataSourceParam(),
        offer_id: z.string().min(1).describe("The merchant's unique offer ID (SKU)."),
        content_language: z
          .string()
          .regex(/^[a-zA-Z]{2}$/, "two-letter ISO 639-1 code")
          .describe('Two-letter ISO 639-1 language of the listing, e.g. "en".'),
        feed_label: z
          .string()
          .regex(/^[A-Za-z0-9\-_]{1,20}$/, "1-20 chars: letters, digits, - and _")
          .describe('Feed label, usually the target country CLDR code, e.g. "US" (≤20 chars, no spaces).'),
        product_attributes: z
          .record(z.any())
          .optional()
          .describe(
            "Product attributes object: title, description, link, imageLink, price {amountMicros, currencyCode}, " +
              "availability (in_stock/out_of_stock/preorder/backorder), condition (new/refurbished/used), " +
              "gtin (array), brand, color, sizes, etc. Attribute names are camelCase.",
          ),
        custom_attributes: z
          .array(
            z.object({
              name: z.string().min(1).describe("Custom attribute name."),
              value: z.string().describe("Custom attribute value."),
            }),
          )
          .optional()
          .describe("Custom (non-standard) attributes as {name, value} pairs."),
        version_number: z
          .string()
          .regex(/^\d+$/, "int64 as a decimal string")
          .optional()
          .describe(
            "Optional int64 freshness guard (as a string): an insert with a lower version than the stored one is rejected.",
          ),
      },
    },
    async ({
      account,
      data_source,
      offer_id,
      content_language,
      feed_label,
      product_attributes,
      custom_attributes,
      version_number,
    }) => {
      try {
        return ok(
          await client.insertProductInput({
            account,
            dataSource: data_source,
            offerId: offer_id,
            contentLanguage: content_language,
            feedLabel: feed_label,
            productAttributes: product_attributes,
            customAttributes: custom_attributes,
            versionNumber: version_number,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "update_product_input",
    {
      title: "Update a product input",
      annotations: WRITE,
      description:
        "Sparse-updates an existing product input — the cheap way to change price or availability without " +
        "re-sending the whole product. data_source must be the source holding the input. update_mask is a " +
        'comma-separated list of attribute paths (e.g. "productAttributes.price,productAttributes.availability"); ' +
        "when omitted, all populated fields of the request are applied. Returns the updated ProductInput; " +
        "the processed product refreshes after async processing (minutes). To create a product or replace " +
        "it wholesale use insert_product_input.",
      inputSchema: {
        account: accountParam(),
        product_input: z
          .string()
          .min(1)
          .describe('Product input ID: "contentLanguage~feedLabel~offerId" or the base64url name.'),
        data_source: dataSourceParam(),
        update_mask: z
          .string()
          .min(1)
          .optional()
          .describe(
            'Comma-separated attribute paths to update, e.g. "productAttributes.price". ' +
              "Omit to apply every populated field of this request.",
          ),
        product_attributes: z
          .record(z.any())
          .optional()
          .describe(
            "Product attributes to change (camelCase), e.g. " +
              '{"price": {"amountMicros": "8990000", "currencyCode": "USD"}, "availability": "out_of_stock"}.',
          ),
        custom_attributes: z
          .array(
            z.object({
              name: z.string().min(1).describe("Custom attribute name."),
              value: z.string().describe("Custom attribute value."),
            }),
          )
          .optional()
          .describe("Custom (non-standard) attributes as {name, value} pairs."),
        version_number: z
          .string()
          .regex(/^\d+$/, "int64 as a decimal string")
          .optional()
          .describe("Optional int64 freshness guard (as a string)."),
      },
    },
    async ({
      account,
      product_input,
      data_source,
      update_mask,
      product_attributes,
      custom_attributes,
      version_number,
    }) => {
      try {
        return ok(
          await client.updateProductInput({
            account,
            productInput: product_input,
            dataSource: data_source,
            updateMask: update_mask,
            productAttributes: product_attributes,
            customAttributes: custom_attributes,
            versionNumber: version_number,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "delete_product_input",
    {
      title: "Delete a product input",
      annotations: DESTRUCTIVE,
      description:
        "Deletes a product input from a specific data source (data_source is required — the same product " +
        "can exist in several sources, and only the targeted input is removed). product_input is " +
        '"contentLanguage~feedLabel~offerId" or the base64url name. Returns an empty object on success; ' +
        "the processed product disappears after async processing (minutes).",
      inputSchema: {
        account: accountParam(),
        product_input: z
          .string()
          .min(1)
          .describe('Product input ID: "contentLanguage~feedLabel~offerId" or the base64url name.'),
        data_source: dataSourceParam(),
      },
    },
    async ({ account, product_input, data_source }) => {
      try {
        return ok(
          await client.deleteProductInput({ account, productInput: product_input, dataSource: data_source }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );
}
