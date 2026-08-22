import type { PhotographyMediaFileWithMetadata } from "types/global";

export type ReferenceCache = {
  entries: Record<string, Record<string, string>>;
};

export function photoHandle(photo: PhotographyMediaFileWithMetadata): string {
  return `photo-${photo.meta.date}-${photo.meta.index}`;
}

// The existing filmStock reference entries are keyed by brand+ISO (e.g.
// "fujifilm-400", "kodak-gold-200") for real film, since box speed is part
// of what distinguishes one film stock from another. Digital shots use the
// literal brand "45mp" alone (isoNumber varies per shot, so combining it in
// would fragment "45mp" into many nonexistent sub-handles).
function filmStockLookupKey(meta: PhotographyMediaFileWithMetadata["meta"]): string {
  return meta.filmStockBrand === "45mp"
    ? meta.filmStockBrand
    : `${meta.filmStockBrand}-${meta.isoNumber}`;
}

// Resolves camera_body/lens/film_stock/film_format to the referenced
// metaobject's GID via the output/photography-refs.json cache, and shapes
// the rest of a photo's metadata into the `photo` metaobject's field list.
export function buildPhotoMetaobjectFields(
  photo: PhotographyMediaFileWithMetadata,
  refs: ReferenceCache
) {
  const { meta } = photo;
  const filmStockKey = filmStockLookupKey(meta);

  const cameraBodyId = refs.entries.cameraBody?.[meta.cameraBody];
  const lensId = refs.entries.lens?.[meta.lens];
  const filmStockId = refs.entries.filmStock?.[filmStockKey];
  const filmFormatId = refs.entries.filmFormat?.[meta.filmFormat];

  const missing: string[] = [];
  if (!cameraBodyId) missing.push(`cameraBody "${meta.cameraBody}"`);
  if (!lensId) missing.push(`lens "${meta.lens}"`);
  if (!filmStockId) missing.push(`filmStock "${filmStockKey}"`);
  if (!filmFormatId) missing.push(`filmFormat "${meta.filmFormat}"`);

  if (missing.length > 0) {
    throw new Error(
      `Could not resolve reference metaobject(s) for ${photoHandle(photo)}: ${missing.join(", ")}. ` +
        `Create the entry in Shopify first, then re-run npm run sync-photo-refs.`
    );
  }

  const image = (photo as any).image ?? {};

  return [
    { key: "image_url", value: image.url ?? "" },
    { key: "image_width", value: String(image.width ?? 0) },
    { key: "image_height", value: String(image.height ?? 0) },
    { key: "alt", value: (photo as any).alt ?? "" },
    { key: "date", value: meta.date },
    { key: "index", value: meta.index },
    { key: "file_type", value: meta.fileType },
    { key: "camera_body", value: cameraBodyId },
    { key: "lens", value: lensId },
    { key: "film_stock", value: filmStockId },
    { key: "film_format", value: filmFormatId },
    { key: "iso", value: meta.isoNumber },
    { key: "aperture", value: meta.aperture },
    { key: "shutterspeed", value: meta.shutterspeed },
  ];
}
