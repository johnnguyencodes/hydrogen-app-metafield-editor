import { watch } from "node:fs";
import { promises as fs } from "node:fs";
import path from "path";
import { client } from "./lib/newClientInstance";
import type { ProductData } from "../types/global";

export function watchForChangesInDirectory(destination: string) {
  try {
    const directoryToWatch = path.resolve(process.cwd(), destination);

    watch(directoryToWatch, { recursive: true }, (eventType, filename) => {
      if (!filename) {
        console.error("no filename");
        return;
      }

      if (eventType !== "change" && eventType !== "rename") return;

      const fullPath = path.join(directoryToWatch, filename.toString());

      console.log("eventType and fullPath:", eventType, fullPath);

      try {
        pushProductData(fullPath);
      } catch (err) {
        console.error(`could not update ${filename} in Shopify store:`, err);
      }
    });
    console.log(`watching for file changes in ${destination}`);
  } catch (err) {
    console.error(err);
  }
}

watchForChangesInDirectory("product-data");

async function pushProductData(fullPath: string) {
  const raw = await fs.readFile(fullPath, "utf-8");
  const product = JSON.parse(raw) as ProductData;

  product.metafields = product.metafields.map((metafield) => ({
    namespace: metafield.namespace,
    key: metafield.key,
    type: metafield.type,
    value:
      metafield.type === "json"
        ? JSON.stringify(metafield.value)
        : metafield.value,
  }));

  const mutation = `
    mutation updateProduct($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        userErrors {
          field
          message
        }
        product {
          id
          handle
          title
          status
          productType
          tags
          descriptionHtml
        }
      }  
    }
  `;

  const variables = { product };

  console.log(
    "Sending to Shopify:",
    JSON.stringify({ query: mutation, variables }, null, 2)
  );

  const response = await client.query<{ productUpdate: any }>({
    data: { query: mutation, variables },
  });

  console.log("Response:", JSON.stringify(response, null, 2));
}
