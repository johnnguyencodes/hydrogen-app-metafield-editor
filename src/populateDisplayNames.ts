import { promises as fs } from "node:fs";
import path from "path";
import { client } from "./lib/newClientInstance";

// One-time: fills in the `display_name` field (added by
// addDisplayNameFields.ts) for all 13 existing photography reference
// entries. Hand-authored rather than derived from the handle, since a
// handle like "sigma-105mm-f28-os-hsm-macro" can't be algorithmically
// turned into "Sigma 105mm f/2.8 OS HSM Macro" (acronym casing, f-stop
// notation) with any real confidence.

const DISPLAY_NAMES: Record<string, Record<string, string>> = {
  filmFormat: {
    "full-frame": "Full-Frame",
    "half-frame": "Half-Frame",
  },
  cameraBody: {
    "nikon-d850": "Nikon D850",
    "pentax-17": "Pentax 17",
    "nikon-f2": "Nikon F2",
  },
  lens: {
    "sigma-105mm-f28-os-hsm-macro": "Sigma 105mm f/2.8 OS HSM Macro",
    "nikkor-35mm-105mm-f35-f45-ais": "Nikkor 35-105mm f/3.5-4.5 AI-S",
    "nikkor-50mm-f18-ais": "Nikkor 50mm f/1.8 AI-S",
    "nikkor-28mm-f28-ais": "Nikkor 28mm f/2.8 AI-S",
    "pentax-25mm-f35-hd-hf": "Pentax 25mm f/3.5 HD HF",
  },
  filmStock: {
    "45mp": "Digital 45 MP",
    "fujifilm-400": "Fujifilm 400",
    "kodak-gold-200": "Kodak Gold 200",
  },
};

type ReferenceCache = {
  entries: Record<string, Record<string, string>>;
};

async function loadReferenceCache(): Promise<ReferenceCache> {
  const refsPath = path.resolve(process.cwd(), "output/photography-refs.json");
  const raw = await fs.readFile(refsPath, "utf-8");
  return JSON.parse(raw) as ReferenceCache;
}

const METAOBJECT_UPDATE_MUTATION = `
  mutation setDisplayName($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function run() {
  const refs = await loadReferenceCache();

  let succeeded = 0;
  let failed = 0;

  for (const [category, handles] of Object.entries(DISPLAY_NAMES)) {
    for (const [handle, displayName] of Object.entries(handles)) {
      const id = refs.entries[category]?.[handle];
      if (!id) {
        console.error(
          `${category}/${handle}: no GID in output/photography-refs.json - run npm run sync-photo-refs first`
        );
        failed++;
        continue;
      }

      const variables = {
        id,
        metaobject: {
          fields: [{ key: "display_name", value: displayName }],
        },
      };

      const response = await client.query<{
        metaobjectUpdate: {
          metaobject: { id: string; handle: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>({ data: { query: METAOBJECT_UPDATE_MUTATION, variables } });

      const body = (response as any)?.body?.data?.metaobjectUpdate;
      if (body?.userErrors?.length > 0) {
        console.error(
          `${category}/${handle}: ${JSON.stringify(body.userErrors)}`
        );
        failed++;
      } else {
        console.log(`${category}/${handle}: "${displayName}"`);
        succeeded++;
      }
    }
  }

  console.log(`\nSet ${succeeded} display names (${failed} failed).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
