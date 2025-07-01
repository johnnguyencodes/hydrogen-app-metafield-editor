import type { ProductsResponse } from "types/global";
import { client } from "./newClientInstance";

export async function fetchProductsAndMetafields(): Promise<ProductsResponse> {
  const query = `{
    products(first: 250) {
      edges { node { 
        id
        title
        status
        productType
        tags
        descriptionHtml
        metafields(first: 250) {
          nodes {
            namespace
            key
            value
            type
          }
        }  
      }}
    }
  }`;

  try {
    const response = await client.request<ProductsResponse>(query);

    if (!response.data) {
      throw new Error("No response data from Shopify");
    }

    return response.data;
  } catch (err: any) {
    console.error("Connection failed:", err.response?.errors || err.message);
    process.exit(1);
  }
}
