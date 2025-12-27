import chokidar from "chokidar";
import path from "path";
import { promises as fs } from "node:fs";
import { client } from "./lib/newClientInstance";
import type { NodeGroup } from "../types/global";

let SHOP_ID: string;

async function getShopId() {
  if (SHOP_ID) return SHOP_ID;

  const response = await client.query({
    data: {
      query: `
        query {
          shop {
            id
          }
        }
      `,
    },
  });

  SHOP_ID = response.body.data.shop.id;
  return SHOP_ID;
}

export function watchForChangesInDirectory(
  destination: string,
  category: string
) {
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
    pushPhotographyData(path, category);
  });
  watcher.on("change", (path) => {
    console.log(`file change detected at ${path}`);
    pushPhotographyData(path, category);
  });
}

watchForChangesInDirectory("product-data/photography/cameraBody", "cameraBody");
watchForChangesInDirectory("product-data/photography/filmFormat", "filmFormat");
watchForChangesInDirectory("product-data/photography/filmStock", "filmStock");
watchForChangesInDirectory("product-data/photography/lens", "lens");

async function pushPhotographyData(fullPath: string, category: string) {
  const raw = await fs.readFile(fullPath, "utf-8");
  const photographyData = JSON.parse(raw) as NodeGroup;

  const key = path.basename(fullPath, ".json");
  const ownerId = await getShopId();

  const metafieldInput = {
    ownerId,
    namespace: category,
    key,
    type: "json",
    value: JSON.stringify(photographyData),
  };

  const mutation = `
    mutation SetShopMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          namespace
          key
        }
        userErrors {
          field
          message
        }
      }  
    }
  `;

  console.log("Sending to Shopify:", metafieldInput);

  const response = await client.query({
    data: {
      query: mutation,
      variables: {
        metafields: [metafieldInput],
      },
    },
  });

  console.log("Response:", JSON.stringify(response, null, 2));
}
