import chokidar from "chokidar";
import path from "path";
import { promises as fs } from "node:fs";
import { client } from "./lib/newClientInstance";

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

async function pushPhotographyData(fullPath: string, category: string) {
  const raw = await fs.readFile(fullPath, "utf-8");
  const photographyData = JSON.parse(raw);

  const fileName = path.parse(fullPath).name;

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
      type: category,
      handle: fileName,
    },
    metaobject: {
      fields: [
        {
          key: "images",
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

  // color codes
  const Cyan = "\x1b[36m";
  const Green = "\x1b[32m";
  const Reset = "\x1b[0m"; // Always use this to stop the color

  console.log(
    `${Cyan} Metaobject pushed:${Reset} ${Green}${category} -> ${fileName}${Reset}`,
    JSON.stringify((response as any)?.body?.data, null, 2)
  );
}

watchForChangesInDirectory("product-data/photography/cameraBody", "cameraBody");
watchForChangesInDirectory("product-data/photography/filmFormat", "filmFormat");
watchForChangesInDirectory("product-data/photography/filmStock", "filmStock");
watchForChangesInDirectory("product-data/photography/lens", "lens");
