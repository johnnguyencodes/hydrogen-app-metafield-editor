import { promises as fs } from "node:fs";
import path from "path";
import { client } from "./lib/newClientInstance";

// Run once (`npm run setup-photo-metaobject`) to create the `photo`
// metaobject type: one entry per photo, with camera_body/lens/film_stock/
// film_format as real metaobject_reference fields instead of duplicating
// each photo's full metadata into every category's own metaobject.
//
// Requires output/photography-refs.json to already exist
// (`npm run sync-photo-refs`), since the reference fields need the
// existing camerabody/lens/filmstock/filmformat definitions' GIDs.

type ReferenceCache = {
  definitions: Record<string, { id: string; type: string }>;
  entries: Record<string, Record<string, string>>;
};

async function loadReferenceCache(): Promise<ReferenceCache> {
  const refsPath = path.resolve(process.cwd(), "output/photography-refs.json");
  const raw = await fs.readFile(refsPath, "utf-8");
  return JSON.parse(raw) as ReferenceCache;
}

const DEFINITION_CREATE_MUTATION = `
  mutation createPhotoDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function referenceField(key: string, definitionId: string) {
  return {
    key,
    type: "metaobject_reference",
    validations: [{ name: "metaobject_definition_id", value: definitionId }],
  };
}

async function run() {
  const refs = await loadReferenceCache();

  const fieldDefinitions = [
    { key: "image_url", type: "url" },
    { key: "image_width", type: "number_integer" },
    { key: "image_height", type: "number_integer" },
    { key: "alt", type: "single_line_text_field" },
    { key: "date", type: "date" },
    { key: "index", type: "single_line_text_field" },
    { key: "file_type", type: "single_line_text_field" },
    referenceField("camera_body", refs.definitions.cameraBody.id),
    referenceField("lens", refs.definitions.lens.id),
    referenceField("film_stock", refs.definitions.filmStock.id),
    referenceField("film_format", refs.definitions.filmFormat.id),
    { key: "iso", type: "single_line_text_field" },
    { key: "aperture", type: "single_line_text_field" },
    { key: "shutterspeed", type: "single_line_text_field" },
  ];

  const variables = {
    definition: {
      type: "photo",
      name: "Photo",
      access: { storefront: "PUBLIC_READ" },
      fieldDefinitions,
    },
  };

  const response = await client.query<{
    metaobjectDefinitionCreate: {
      metaobjectDefinition: { id: string; type: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>({
    data: { query: DEFINITION_CREATE_MUTATION, variables },
  });

  console.log(JSON.stringify((response as any)?.body?.data, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
