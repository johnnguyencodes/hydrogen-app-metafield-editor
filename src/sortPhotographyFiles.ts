import type { PhotographyMediaFileWithMetadata } from "types/global";
import { promises as fs } from "node:fs";
import path from "path";

// Each media file pulled from Shopify's admin API is a file object. Each object has an image.url that must be named with the following structure for photography images
// `photography--YYYY-MM-DD--${index}--${filmFormat}--${cameraBody}--${lens}--${filmStockBrand}--${isoNumber}--${aperture}--${shutterSpeed}.jpg`
// For example: /photography--2025-11-13--013--full-frame--nikon-d850--35mm-105mm-zoom-ais--45mp--iso-200--f56--1-3s.jpg
//
// Aperture format: a whole f-stop is just digits (f11, f16, f22, f8 -> f/11,
// f/16, f/22, f/8). For a decimal f-stop, use a dash in place of the decimal
// point (f1-1, f1-8, f5-6 -> f/1.1, f/1.8, f/5.6) - this is required to
// distinguish e.g. f/1.1 from f/11, which otherwise both encode as "f11".
// Older files written before this convention (plain digits with no dash,
// e.g. "f56" for f/5.6) are still supported for display - see
// formatAperture in the storefront's app/lib/fancyboxOptions.ts.
//
// Each photo is written to its own file (product-data/photography/photos/{date}-{index}.json)
// instead of being duplicated into per-camera/lens/film-stock/film-format
// category files, since a photo's metadata should live in exactly one place.

async function loadMedia(): Promise<any[]> {
  const masterMediaPath = path.resolve(
    process.cwd(),
    "output/master-media.json"
  );

  const raw = await fs.readFile(masterMediaPath, "utf-8");
  return JSON.parse(raw);
}

// getting url of media that contains filename
function extractUrl(media: any): string | undefined {
  // generic files
  if (typeof media.url === "string") return media.url;
  // image
  if (media.image?.url) return media.image.url;
  // video
  if (media.originalSource?.url) return media.alt;
  // 3d model
  if (Array.isArray(media.sources) && media.sources[0]?.url) {
    return media.sources[0].url;
  }

  //fallback
  return undefined;
}

// extracting media filename from url
function filenameFromUrl(fullUrl: string): string {
  const cleanedUrl = fullUrl.split("?")[0];
  const filenameWithExt = cleanedUrl.split("/").pop()!;

  return filenameWithExt;
}

// parsing meta data from url
function parseMeta(filename: string) {
  const [
    fileType,
    date,
    index,
    filmFormat,
    cameraBody,
    lens,
    filmStockBrand,
    isoNumber,
    aperture,
    shutterspeed,
  ] = filename.split("--");
  const sanitizedShutterspeed = shutterspeed.split(".").slice(0, -1).toString();
  return {
    fileType,
    date,
    index,
    filmFormat, //
    cameraBody, //
    lens, //
    filmStockBrand, //
    isoNumber, //
    aperture,
    sanitizedShutterspeed,
  };
}

// Run the script
async function run() {
  const allMedia = await loadMedia();

  const photosDir = path.resolve(process.cwd(), "product-data/photography/photos");
  await fs.mkdir(photosDir, { recursive: true });

  let count = 0;

  for (const node of allMedia) {
    const url = extractUrl(node);
    if (!url) continue;

    // filtering urls to make sure only photography images are being processed
    if (url.indexOf("photography") === -1) continue;

    const fileName = filenameFromUrl(url);
    const {
      fileType,
      date,
      index,
      filmFormat,
      cameraBody,
      lens,
      filmStockBrand,
      isoNumber,
      aperture,
      sanitizedShutterspeed,
    } = parseMeta(fileName);

    const meta = {
      fileType,
      date,
      index,
      filmFormat,
      cameraBody,
      lens,
      filmStockBrand,
      isoNumber,
      aperture,
      shutterspeed: sanitizedShutterspeed,
    };

    const photo: PhotographyMediaFileWithMetadata = { ...node, meta };

    const targetFile = path.join(photosDir, `${date}-${index}.json`);
    await fs.writeFile(targetFile, JSON.stringify(photo, null, 2), "utf-8");
    count++;
  }

  console.log(`Wrote ${count} photo files to ${photosDir}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
