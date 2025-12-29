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
    pushPhotographyData(path);
  });
  watcher.on("change", (path) => {
    console.log(`file change detected at ${path}`);
    pushPhotographyData(path);
  });
}

async function pushPhotographyData(fullPath: string) {
  const raw = await fs.readFile(fullPath, "utf-8");
  const photographyData = JSON.parse(raw);

  const mutation = `
    mutation metaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          handle
          id
        }
        userErrors {
          field
          message
        }
      }  
    }
  `;

  const variables = {
    handle: {
      type: "photography_images",
      handle: "global-photography-image-data",
    },
    metaobject: {
      fields: [
        {
          key: "data_json",
          value: JSON.stringify(photographyData),
        },
      ],
      capabilities: {
        publishable: {
          status: "ACTIVE",
        },
      },
    },
  };

  const response = await client.query({
    data: {
      query: mutation,
      variables: variables,
    },
  });

  console.log("Response:", JSON.stringify(response, null, 2));
}

watchForChangesInDirectory("product-data/photography/");
