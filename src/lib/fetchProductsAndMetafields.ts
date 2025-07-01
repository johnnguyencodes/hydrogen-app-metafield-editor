import type { ProductsResponse } from "types/global";
import { client } from "./newClientInstance";

export async function fetchProductsAndMetafields(): Promise<
  Array<{
    id: string;
    title: string;
    metafields: Array<{ namespace: string; key: string; value: string }>;
  }>
> {
  const query = `{
    products(first: 250) {
      edges { node { 
        title
        productType
        tags
        descriptionHtml
        id
        status
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

    const data = response.data;

    return data;
  } catch (err: any) {
    console.error("Connection failed:", err.response?.errors || err.message);
    process.exit(1);
  }
}
