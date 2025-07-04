import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION, Session } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2025-04";
import dotenv from "dotenv";
import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";

dotenv.config();

const apiKey = process.env.SHOPIFY_API_KEY;
if (!apiKey) throw new Error("Missing SHOPIFY_API_KEY");

const apiSecret = process.env.SHOPIFY_API_SECRET;
if (!apiSecret) throw new Error("Missing SHOPIFY_API_SECRET");

const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
if (!storeDomain) throw new Error("Missing SHOPIFY_STORE_DOMAIN");

const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
if (!accessToken) throw new Error("Missing SHOPIFY_ACCESS_TOKEN");

const SCOPES = [
  "write_metaobject_definitions",
  "read_metaobject_definitions",
  "write_metaobjects",
  "read_metaobjects",
  "read_files",
  "write_products",
  "read_products",
];

const shopify = shopifyApi({
  apiKey: apiKey,
  apiSecretKey: apiSecret,
  hostName: storeDomain,
  scopes: SCOPES,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
  restResources,
  sessionStorage: new MemorySessionStorage(),
  future: {},
});

const session = new Session({
  id: "offline-session",
  shop: storeDomain,
  state: "",
  isOnline: false,
  accessToken: accessToken,
  scope: SCOPES.join(","),
  isActive: true,
  accessTokenExpires: undefined,
  onlineAccessInfo: undefined,
  isScopeChanged: false,
  isScopeIncluded: false,
  isExpired: false,
});

export const client = new shopify.clients.Graphql({ session });
