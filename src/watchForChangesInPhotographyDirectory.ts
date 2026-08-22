import chokidar from "chokidar";
import path from "path";
import { promises as fs } from "node:fs";
import type { PhotographyMediaFileWithMetadata } from "types/global";
import { client } from "./lib/newClientInstance";
import {
  buildPhotoMetaobjectFields,
  photoHandle,
  type ReferenceCache,
} from "./lib/buildPhotoMetaobjectFields";

// Watches product-data/photography/photos/ (one file per photo) and upserts
// each changed photo as its own `photo` metaobject entry, with
// camera_body/lens/film_stock/film_format resolved to metaobject references
// via output/photography-refs.json (run `npm run sync-photo-refs` first,
// and whenever a new camera/lens/film-stock/film-format value is introduced).

const PHOTOS_DIR = "product-data/photography/photos";

async function loadReferenceCache(): Promise<ReferenceCache> {
  const refsPath = path.resolve(process.cwd(), "output/photography-refs.json");
  const raw = await fs.readFile(refsPath, "utf-8");
  return JSON.parse(raw) as ReferenceCache;
}

export function watchForChangesInPhotographyDirectory() {
  const directoryToWatch = path.resolve(process.cwd(), PHOTOS_DIR);

  const watcher = chokidar.watch(directoryToWatch, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  console.log(`watching for changes at ${directoryToWatch}`);
  watcher.on("add", (filePath) => {
    console.log(`file add detected at ${filePath}`);
    pushPhoto(filePath);
  });
  watcher.on("change", (filePath) => {
    console.log(`file change detected at ${filePath}`);
    pushPhoto(filePath);
  });
}

async function pushPhoto(fullPath: string) {
  const raw = await fs.readFile(fullPath, "utf-8");
  const photo = JSON.parse(raw) as PhotographyMediaFileWithMetadata;

  const refs = await loadReferenceCache();
  const fields = buildPhotoMetaobjectFields(photo, refs);
  const handle = photoHandle(photo);

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
      type: "photo",
      handle,
    },
    metaobject: {
      fields,
    },
  };

  const response = await client.query({
    data: { query: mutation, variables },
  });

  const Cyan = "\x1b[36m";
  const Green = "\x1b[32m";
  const Reset = "\x1b[0m";

  console.log(
    `${Cyan}Metaobject pushed:${Reset} ${Green}photo -> ${handle}${Reset}`,
    JSON.stringify((response as any)?.body?.data, null, 2)
  );
}

watchForChangesInPhotographyDirectory();
