import { promises as fs } from "node:fs";
import path from "path";
import { client } from "./lib/newClientInstance";

// One-time: adds a `display_name` field to each of the 4 existing
// photography reference metaobject definitions (camerabody, lens,
// filmstock, filmformat), so a clean, hand-authored label can live
// alongside each entry's handle instead of being guessed from it at
// render time. Run after `npm run sync-photo-refs`.

type ReferenceCache = {
  definitions: Record<string, { id: string; type: string }>;
};

async function loadReferenceCache(): Promise<ReferenceCache> {
  const refsPath = path.resolve(process.cwd(), "output/photography-refs.json");
  const raw = await fs.readFile(refsPath, "utf-8");
  return JSON.parse(raw) as ReferenceCache;
}

const DEFINITION_UPDATE_MUTATION = `
  mutation addDisplayNameField($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        id
        type
        fieldDefinitions {
          key
        }
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

  for (const [category, definition] of Object.entries(refs.definitions)) {
    const variables = {
      id: definition.id,
      definition: {
        fieldDefinitions: [
          {
            create: {
              key: "display_name",
              type: "single_line_text_field",
              name: "Display name",
            },
          },
        ],
      },
    };

    const response = await client.query<{
      metaobjectDefinitionUpdate: {
        metaobjectDefinition: { id: string; type: string } | null;
        userErrors: { field: string[]; message: string }[];
      };
    }>({ data: { query: DEFINITION_UPDATE_MUTATION, variables } });

    const body = (response as any)?.body?.data?.metaobjectDefinitionUpdate;
    if (body?.userErrors?.length > 0) {
      console.error(`${category} (${definition.type}): ${JSON.stringify(body.userErrors)}`);
    } else {
      console.log(`${category} (${definition.type}): display_name field added`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
