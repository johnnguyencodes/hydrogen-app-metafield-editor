import { promises as fs } from "node:fs";
import path from "path";
import { client } from "./newClientInstance";

// The photography reference metaobject types (camera body, lens, film stock,
// film format) already exist in Shopify, created ad hoc by the old
// category-based watcher. Their exact `type` id casing isn't guaranteed to
// match the category label used locally, so this discovers the live
// definitions instead of assuming the casing.
const REFERENCE_CATEGORIES = [
  "cameraBody",
  "lens",
  "filmStock",
  "filmFormat",
] as const;

type ReferenceCategory = (typeof REFERENCE_CATEGORIES)[number];

type ReferenceCache = {
  definitions: Record<ReferenceCategory, { id: string; type: string }>;
  entries: Record<ReferenceCategory, Record<string, string>>;
};

const DEFINITIONS_QUERY = `
  query getMetaobjectDefinitions {
    metaobjectDefinitions(first: 50) {
      nodes {
        id
        type
      }
    }
  }
`;

const ENTRIES_QUERY = `
  query getMetaobjectEntries($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      nodes {
        id
        handle
      }
    }
  }
`;

function matchesCategory(definitionType: string, category: ReferenceCategory) {
  return definitionType.toLowerCase() === category.toLowerCase();
}

export async function fetchPhotographyReferenceMetaobjects(): Promise<ReferenceCache> {
  const definitionsResponse = await client.request<{
    metaobjectDefinitions: { nodes: { id: string; type: string }[] };
  }>(DEFINITIONS_QUERY);

  if (!definitionsResponse.data) {
    throw new Error("No response data fetching metaobject definitions");
  }

  const allDefinitions = definitionsResponse.data.metaobjectDefinitions.nodes;

  const definitions = {} as ReferenceCache["definitions"];
  const entries = {} as ReferenceCache["entries"];

  for (const category of REFERENCE_CATEGORIES) {
    const definition = allDefinitions.find((node) =>
      matchesCategory(node.type, category)
    );

    if (!definition) {
      throw new Error(
        `Could not find an existing metaobject definition for "${category}". ` +
          `Found types: ${allDefinitions.map((n) => n.type).join(", ")}`
      );
    }

    definitions[category] = { id: definition.id, type: definition.type };

    const entriesResponse = await client.request<{
      metaobjects: { nodes: { id: string; handle: string }[] };
    }>(ENTRIES_QUERY, { variables: { type: definition.type, first: 250 } });

    if (!entriesResponse.data) {
      throw new Error(`No response data fetching ${category} entries`);
    }

    entries[category] = Object.fromEntries(
      entriesResponse.data.metaobjects.nodes.map((node) => [
        node.handle,
        node.id,
      ])
    );
  }

  return { definitions, entries };
}

async function run() {
  const cache = await fetchPhotographyReferenceMetaobjects();

  const outPath = path.resolve(process.cwd(), "output/photography-refs.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(cache, null, 2), "utf-8");

  console.log(`Wrote reference metaobject cache -> ${outPath}`);
  for (const category of REFERENCE_CATEGORIES) {
    console.log(
      `  ${category} (type "${cache.definitions[category].type}"): ${
        Object.keys(cache.entries[category]).length
      } entries`
    );
  }
}

// Only run automatically when this file is invoked directly (e.g. via
// `npm run sync-photo-refs`), not when imported by other scripts.
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
