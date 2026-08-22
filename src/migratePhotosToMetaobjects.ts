import { promises as fs } from "node:fs";
import path from "path";
import type { PhotographyMediaFileWithMetadata } from "types/global";
import { client } from "./lib/newClientInstance";
import {
  buildPhotoMetaobjectFields,
  photoHandle,
  type ReferenceCache,
} from "./lib/buildPhotoMetaobjectFields";

// One-time backfill: reads every photo already written to
// product-data/photography/photos/ (via `npm run sort-photography`) and
// upserts each as its own `photo` metaobject entry. Safe to re-run
// (metaobjectUpsert creates-or-updates by handle).
//
// Run order: npm run sync -> npm run sort-photography -> npm run
// sync-photo-refs -> npm run setup-photo-metaobject -> npm run migrate-photos

const PHOTOS_DIR = "product-data/photography/photos";

const UPSERT_MUTATION = `
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

async function loadReferenceCache(): Promise<ReferenceCache> {
  const refsPath = path.resolve(process.cwd(), "output/photography-refs.json");
  const raw = await fs.readFile(refsPath, "utf-8");
  return JSON.parse(raw) as ReferenceCache;
}

async function run() {
  const photosDir = path.resolve(process.cwd(), PHOTOS_DIR);
  const files = (await fs.readdir(photosDir)).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    throw new Error(
      `No photo files found in ${photosDir}. Run npm run sort-photography first.`
    );
  }

  const refs = await loadReferenceCache();

  let succeeded = 0;
  let failed = 0;

  for (const file of files) {
    const raw = await fs.readFile(path.join(photosDir, file), "utf-8");
    const photo = JSON.parse(raw) as PhotographyMediaFileWithMetadata;
    const handle = photoHandle(photo);

    try {
      const fields = buildPhotoMetaobjectFields(photo, refs);

      const variables = {
        handle: { type: "photo", handle },
        metaobject: {
          fields,
          capabilities: { publishable: { status: "ACTIVE" } },
        },
      };

      const response = await client.query<{
        metaobjectUpsert: {
          metaobject: { handle: string; id: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>({ data: { query: UPSERT_MUTATION, variables } });

      const body = (response as any)?.body?.data?.metaobjectUpsert;
      if (body?.userErrors?.length > 0) {
        console.error(`  ${handle}: ${JSON.stringify(body.userErrors)}`);
        failed++;
      } else {
        console.log(`  ${handle}: ok`);
        succeeded++;
      }
    } catch (err: any) {
      console.error(`  ${handle}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nMigrated ${succeeded}/${files.length} photos (${failed} failed).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
