import type { ProductsResponse, ProductData } from "types/global";
import { client } from "./newClientInstance";

export async function fetchProductsAndMetafields(): Promise<ProductData[]> {
  const query = `{
    products(first: 250) {
      edges { node { 
        id
        handle
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

    const data = response.data;

    const productsData: ProductData[] = data.products.edges.map(({ node }) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      status: node.status,
      productType: node.productType,
      tags: node.tags,
      descriptionHtml: node.descriptionHtml,
      metafields: node.metafields.nodes,
    }));

    return productsData;
  } catch (err: any) {
    console.error("Connection failed:", err.response?.errors || err.message);
    process.exit(1);
  }
}
