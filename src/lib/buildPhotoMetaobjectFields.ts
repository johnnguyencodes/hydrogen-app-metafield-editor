import type { PhotographyMediaFileWithMetadata } from "types/global";

export type ReferenceCache = {
  entries: Record<string, Record<string, string>>;
};

export function photoHandle(photo: PhotographyMediaFileWithMetadata): string {
  return `photo-${photo.meta.date}-${photo.meta.index}`;
}

// Resolves camera_body/lens/film_stock/film_format to the referenced
// metaobject's GID via the output/photography-refs.json cache, and shapes
// the rest of a photo's metadata into the `photo` metaobject's field list.
export function buildPhotoMetaobjectFields(
  photo: PhotographyMediaFileWithMetadata,
  refs: ReferenceCache
) {
  const { meta } = photo;

  const cameraBodyId = refs.entries.cameraBody?.[meta.cameraBody];
  const lensId = refs.entries.lens?.[meta.lens];
  const filmStockId = refs.entries.filmStock?.[meta.filmStockBrand];
  const filmFormatId = refs.entries.filmFormat?.[meta.filmFormat];

  const missing: string[] = [];
  if (!cameraBodyId) missing.push(`cameraBody "${meta.cameraBody}"`);
  if (!lensId) missing.push(`lens "${meta.lens}"`);
  if (!filmStockId) missing.push(`filmStock "${meta.filmStockBrand}"`);
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
