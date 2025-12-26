import chokidar from "chokidar";
import path from "path";
import { promises as fs } from "node:fs";
import { client } from "./lib/newClientInstance";
import type { ProductData } from "../types/global";

export function watchForChangesInDirectory(destination: string) {
  const directoryToWatch = path.resolve(process.cwd(), destination);
  console.log("directoryToWatch:", directoryToWatch);
  const watcher = chokidar.watch(directoryToWatch, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  console.log(`watching for changes at ${directoryToWatch}`);
  watcher.on("add", (path) => {
    console.log(`file add detected at ${path}`);
    pushProductData(path);
  });
  watcher.on("change", (path) => {
    console.log(`file change detected at ${path}`);
    pushProductData(path);
  });
}

watchForChangesInDirectory("product-data/plants");

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
